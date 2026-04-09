from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import secrets
import base64
import hashlib
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
from twilio.rest import Client as TwilioClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

twilio_client = None
if os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN"):
    try:
        twilio_client = TwilioClient(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
    except:
        pass

app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("JWT_SECRET", "your-secret-key"),
    https_only=False,
    same_site="lax",
    max_age=86400,
)

api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PhoneOTPRequest(BaseModel):
    phone_number: str

class PhoneOTPVerify(BaseModel):
    phone_number: str
    code: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "auto"
    session_id: Optional[str] = None

class ImageRequest(BaseModel):
    prompt: str
    style: Optional[str] = "realistic"

class VideoRequest(BaseModel):
    prompt: str
    duration: Optional[int] = 4
    size: Optional[str] = "1280x720"
    style: Optional[str] = "cinematic"

# ==================== HELPERS ====================
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain, hashed):
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id, email):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id):
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        session_token = request.cookies.get("session_token")
        if session_token:
            session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
            if session_doc:
                expires_at = session_doc["expires_at"]
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at < datetime.now(timezone.utc):
                    raise HTTPException(status_code=401, detail="Session expired")
                user = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
                return user
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== STARTUP ====================
@app.on_event("startup")
async def startup_db():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@infinityai.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "auth_method": "email",
            "created_at": datetime.now(timezone.utc)
        })

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(user: UserCreate, response: Response):
    email = user.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = hash_password(user.password)
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "password_hash": hashed_password,
        "name": user.name,
        "role": "user",
        "auth_method": "email",
        "created_at": datetime.now(timezone.utc)
    })
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"user_id": user_id, "email": email, "name": user.name, "role": "user", "auth_method": "email"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    email = credentials.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "role": user.get("role", "user"), "auth_method": user.get("auth_method", "email")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"status": "logged_out"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user["user_id"], user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"status": "success"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ==================== GOOGLE OAUTH ====================
@api_router.get("/auth/google/session")
async def google_session_exchange(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    async with httpx.AsyncClient() as c:
        auth_response = await c.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if auth_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to validate session")
    session_data = auth_response.json()
    user = await db.users.find_one({"email": session_data["email"]})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "role": "user",
            "auth_method": "google",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": session_data["name"], "picture": session_data.get("picture")}})
    session_token = session_data["session_token"]
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {"user_id": user_id, "session_token": session_token, "expires_at": datetime.now(timezone.utc) + timedelta(days=7), "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"user_id": user_id, "email": session_data["email"], "name": session_data["name"], "picture": session_data.get("picture"), "role": user.get("role", "user"), "auth_method": "google"}

# ==================== PHONE OTP ====================
@api_router.post("/auth/phone/send-otp")
async def send_phone_otp(data: PhoneOTPRequest):
    if not twilio_client:
        raise HTTPException(status_code=503, detail="Phone verification not configured")
    try:
        verification = twilio_client.verify.services(os.getenv("TWILIO_VERIFY_SERVICE")).verifications.create(to=data.phone_number, channel="sms")
        return {"status": verification.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/phone/verify-otp")
async def verify_phone_otp(data: PhoneOTPVerify, response: Response):
    if not twilio_client:
        raise HTTPException(status_code=503, detail="Phone verification not configured")
    try:
        check = twilio_client.verify.services(os.getenv("TWILIO_VERIFY_SERVICE")).verification_checks.create(to=data.phone_number, code=data.code)
        if check.status != "approved":
            raise HTTPException(status_code=400, detail="Invalid OTP code")
        user = await db.users.find_one({"phone_number": data.phone_number})
        if not user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = {"user_id": user_id, "phone_number": data.phone_number, "name": f"User {data.phone_number[-4:]}", "role": "user", "auth_method": "phone", "created_at": datetime.now(timezone.utc)}
            await db.users.insert_one(user)
        access_token = create_access_token(user["user_id"], user.get("email", ""))
        refresh_token = create_refresh_token(user["user_id"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
        return {"user_id": user["user_id"], "phone_number": user["phone_number"], "name": user["name"], "role": "user", "auth_method": "phone"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== AI CHAT ====================
@api_router.post("/ai/chat")
async def ai_chat(data: ChatRequest, user: dict = Depends(get_current_user)):
    session_id = data.session_id or f"chat_{uuid.uuid4().hex[:12]}"
    if data.model == "auto":
        if len(data.message) > 500:
            provider, model = "openai", "gpt-4o"
            api_key = os.environ.get("EMERGENT_LLM_KEY")
        else:
            provider, model = "gemini", "gemini-2.0-flash"
            api_key = os.environ.get("GEMINI_API_KEY")
    else:
        if ":" in data.model:
            provider, model = data.model.split(":", 1)
        else:
            provider, model = "openai", "gpt-4o"
        api_key = os.environ.get("GEMINI_API_KEY") if provider == "gemini" else os.environ.get("EMERGENT_LLM_KEY")

    chat = LlmChat(api_key=api_key, session_id=session_id, system_message="You are a helpful AI assistant.").with_model(provider, model)
    message = UserMessage(text=data.message)
    response_text = await chat.send_message(message)
    await db.chat_history.insert_one({
        "user_id": user["user_id"], "session_id": session_id,
        "message": data.message, "response": response_text,
        "model": f"{provider}:{model}", "created_at": datetime.now(timezone.utc)
    })
    return {"response": response_text, "session_id": session_id, "model": f"{provider}:{model}"}

@api_router.get("/ai/chat/history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    history = await db.chat_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return {"history": history}

# ==================== AI IMAGE ====================
@api_router.post("/ai/image")
async def generate_image(data: ImageRequest, user: dict = Depends(get_current_user)):
    api_key = os.environ.get("GEMINI_API_KEY")
    session_id = f"img_{uuid.uuid4().hex[:12]}"
    style_prompts = {
        "realistic": "photorealistic, high detail, professional photography",
        "anime": "anime style, vibrant colors, manga illustration",
        "cinematic": "cinematic lighting, dramatic composition, film quality",
        "futuristic": "futuristic, sci-fi, neon lights, cyberpunk aesthetic"
    }
    enhanced_prompt = f"{data.prompt}, {style_prompts.get(data.style, '')}"
    chat = LlmChat(api_key=api_key, session_id=session_id, system_message="You are an AI image generator.").with_model("gemini", "gemini-2.0-flash-exp-image-generation").with_params(modalities=["image", "text"])
    msg = UserMessage(text=enhanced_prompt)
    try:
        text, images = await chat.send_message_multimodal_response(msg)
        if images and len(images) > 0:
            image_id = f"img_{uuid.uuid4().hex[:12]}"
            await db.image_history.insert_one({"image_id": image_id, "user_id": user["user_id"], "prompt": data.prompt, "style": data.style, "created_at": datetime.now(timezone.utc)})
            return {"image_id": image_id, "image_data": images[0]['data'], "mime_type": images[0]['mime_type'], "prompt": data.prompt}
        else:
            raise HTTPException(status_code=500, detail="No image generated")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@api_router.get("/ai/image/history")
async def get_image_history(user: dict = Depends(get_current_user)):
    history = await db.image_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return {"history": history}

# ==================== AI VIDEO ====================
@api_router.post("/ai/video")
async def generate_video(data: VideoRequest, user: dict = Depends(get_current_user)):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    style_prompts = {
        "cinematic": "cinematic camera movement, dramatic lighting, film quality",
        "animation": "animated style, smooth motion, vibrant colors",
        "storytelling": "narrative story, emotional journey, character-driven"
    }
    enhanced_prompt = f"{data.prompt}, {style_prompts.get(data.style, '')}"
    try:
        video_gen = OpenAIVideoGeneration(api_key=api_key)
        video_id = f"vid_{uuid.uuid4().hex[:12]}"
        output_path = f"/tmp/{video_id}.mp4"
        video_bytes = video_gen.text_to_video(prompt=enhanced_prompt, model="sora-2", size=data.size, duration=data.duration, max_wait_time=600)
        if video_bytes:
            video_gen.save_video(video_bytes, output_path)
            await db.video_history.insert_one({"video_id": video_id, "user_id": user["user_id"], "prompt": data.prompt, "style": data.style, "duration": data.duration, "size": data.size, "file_path": output_path, "created_at": datetime.now(timezone.utc)})
            return {"video_id": video_id, "prompt": data.prompt, "status": "completed", "download_url": f"/api/ai/video/{video_id}/download"}
        else:
            raise HTTPException(status_code=500, detail="Video generation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

@api_router.get("/ai/video/history")
async def get_video_history(user: dict = Depends(get_current_user)):
    history = await db.video_history.find({"user_id": user["user_id"]}, {"_id": 0, "file_path": 0}).sort("created_at", -1).limit(50).to_list(50)
    return {"history": history}

@api_router.get("/ai/video/{video_id}/download")
async def download_video(video_id: str, user: dict = Depends(get_current_user)):
    video = await db.video_history.find_one({"video_id": video_id, "user_id": user["user_id"]}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    from fastapi.responses import FileResponse
    file_path = video.get("file_path")
    if file_path and os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4", filename=f"{video_id}.mp4")
    raise HTTPException(status_code=404, detail="Video file not found")

# ==================== ROOT ====================
@api_router.get("/")
async def root():
    return {"message": "Infinity AI Platform API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('FRONTEND_URL', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

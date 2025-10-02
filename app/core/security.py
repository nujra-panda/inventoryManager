from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import os
from dotenv import load_dotenv  # Add this import

# Load environment variables from .env file
load_dotenv()  # Add this line

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME")  # set env in prod
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain_password: str) -> str:
    # Truncate password to 72 bytes to avoid bcrypt limitation
    if len(plain_password.encode('utf-8')) > 72:
        # Truncate to 72 bytes, being careful with UTF-8 characters
        truncated = plain_password.encode('utf-8')[:72].decode('utf-8', 'ignore')
        return pwd_context.hash(truncated)
    return pwd_context.hash(plain_password)

def create_access_token(sub: str, minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({"sub": sub, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[str]:
    try:
      payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      return payload.get("sub")
    except JWTError:
      return None
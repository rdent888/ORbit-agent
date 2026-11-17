"""Fernet symmetric encryption for API keys."""
import os, base64, pathlib
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# Load .env
env_path = pathlib.Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

def _get_fernet() -> Fernet:
    key = os.environ.get("AGY_MASTER_KEY")
    if not key:
        key = Fernet.generate_key().decode()
        os.environ["AGY_MASTER_KEY"] = key
    key_bytes = key.encode()
    if len(key_bytes) == 32:
        key_bytes = base64.urlsafe_b64encode(key_bytes)
    return Fernet(key_bytes)

def encrypt(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()

def decrypt(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()

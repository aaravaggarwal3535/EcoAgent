"""Configuration settings for EcoAgent backend."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Google Gemini Settings
    google_api_key: str = ""
    
    # Agent Settings
    agent_model: str = "models/gemini-2.0-flash"
    agent_temperature: float = 0.7
    
    # Data Settings
    data_dir: str = "./data"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

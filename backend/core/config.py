from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "EduAlert GH"
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "postgresql://postgres:samuel123@localhost:5432/edualert"
    ANTHROPIC_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
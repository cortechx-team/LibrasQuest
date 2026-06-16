from pydantic import BaseModel, ConfigDict, Field, field_validator


class AuthRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=72)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Informe um e-mail válido.")
        return value.lower()


class RegisterRequest(AuthRequest):
    name: str = Field(min_length=2, max_length=255)


class LoginRequest(AuthRequest):
    pass


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

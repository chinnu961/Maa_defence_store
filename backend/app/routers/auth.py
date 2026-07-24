from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = models.User(
        name=payload.name,
        email=payload.email.lower(),
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=models.UserRole.user,
        institute_name=payload.institute_name,
        battalion=payload.battalion,
        regimental_number=payload.regimental_number,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # form_data.username carries the email (OAuth2 password flow convention)
    user = db.scalar(select(models.User).where(models.User.email == form_data.username.lower()))
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login-json", response_model=schemas.Token)
def login_json(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """JSON-body alternative to /login for frontends that don't want to send form-encoded data."""
    user = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_current_user(payload: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.email is not None:
        existing = db.scalar(select(models.User).where(models.User.email == payload.email.lower(), models.User.id != current_user.id))
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = payload.email.lower()
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.shop_address is not None:
        current_user.shop_address = payload.shop_address
    if payload.institute_name is not None:
        current_user.institute_name = payload.institute_name
    if payload.battalion is not None:
        current_user.battalion = payload.battalion
    if payload.regimental_number is not None:
        current_user.regimental_number = payload.regimental_number
    if payload.password is not None and len(payload.password) >= 6:
        current_user.hashed_password = hash_password(payload.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/admin-contact")
def get_admin_contact(db: Session = Depends(get_db)):
    admin = db.scalar(select(models.User).where(models.User.role == models.UserRole.admin).order_by(models.User.created_at))
    if not admin:
        return {
            "phone": "+91 96662 97143",
            "email": "support@sagardefence.com",
            "shop_address": "Nagarampalem Main Road, Opposite Luthren Prayer Hall, Guntur - 522004"
        }
    return {
        "phone": admin.phone or "+91 96662 97143",
        "email": admin.email,
        "shop_address": admin.shop_address or "Nagarampalem Main Road, Opposite Luthren Prayer Hall, Guntur - 522004"
    }

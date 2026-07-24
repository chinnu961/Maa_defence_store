from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app import models
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import admin, auth, cart, orders, products
from app.seed_data import PRODUCTS
from app.security import hash_password


def seed_products(db) -> None:
    existing_ids = set(db.scalars(select(models.Product.id)).all())
    new_products = [models.Product(**p) for p in PRODUCTS if p["id"] not in existing_ids]
    if new_products:
        db.add_all(new_products)
        db.commit()


def seed_first_admin(db) -> None:
    existing = db.scalar(select(models.User).where(models.User.email == settings.FIRST_ADMIN_EMAIL.lower()))
    if existing:
        return
    admin_user = models.User(
        name=settings.FIRST_ADMIN_NAME,
        email=settings.FIRST_ADMIN_EMAIL.lower(),
        hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
        role=models.UserRole.admin,
    )
    db.add(admin_user)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN shop_address VARCHAR(255)"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN institute_name VARCHAR(255)"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN battalion VARCHAR(255)"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN regimental_number VARCHAR(255)"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE orders ADD COLUMN institute_name VARCHAR(255)"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE orders ADD COLUMN battalion VARCHAR(255)"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE orders ADD COLUMN cancellation_reason TEXT"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        seed_products(db)
        seed_first_admin(db)
    finally:
        db.close()
    yield


import os
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="MAA Defence Stores API",
    description="Backend API for the MAA Defence Stores e-commerce application.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount it
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}

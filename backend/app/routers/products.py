from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
import uuid
import os
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_admin

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[schemas.ProductOut])
def list_products(
    category: str | None = Query(default=None),
    badge: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(models.Product).where(models.Product.is_active.is_(True))
    if category:
        stmt = stmt.where(models.Product.category == category)
    if badge:
        stmt = stmt.where(models.Product.badge == badge)
    if search:
        stmt = stmt.where(models.Product.name.ilike(f"%{search}%"))
    return db.scalars(stmt.order_by(models.Product.name)).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=schemas.ProductOut, status_code=201, dependencies=[Depends(get_current_admin)])
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.get(models.Product, payload.id):
        raise HTTPException(status_code=400, detail="A product with this id already exists")
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=schemas.ProductOut, dependencies=[Depends(get_current_admin)])
def update_product(product_id: str, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(get_current_admin)])
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return None


@router.post("/upload", dependencies=[Depends(get_current_admin)])
async def upload_image(file: UploadFile = File(...)):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".heic", ".avif"}
    filename = file.filename or "upload"
    _, ext = os.path.splitext(filename.lower())
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension: {ext or 'None'}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    unique_filename = f"{uuid.uuid4()}{ext}"
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    return {"url": f"/uploads/{unique_filename}"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/api/cart", tags=["cart"])

FITTING_FEE = 250


def _build_cart_out(cart_items: list[models.CartItem]) -> schemas.CartOut:
    subtotal = sum(float(item.price) * item.quantity for item in cart_items)
    has_custom = any(item.is_custom for item in cart_items)
    fitting_fee = FITTING_FEE if has_custom else 0
    item_count = sum(item.quantity for item in cart_items)
    return schemas.CartOut(
        items=[schemas.CartItemOut.model_validate(i) for i in cart_items],
        subtotal=subtotal,
        fitting_fee=fitting_fee,
        grand_total=subtotal + fitting_fee,
        item_count=item_count,
    )


def _get_user_cart_items(db: Session, user_id: str) -> list[models.CartItem]:
    stmt = select(models.CartItem).where(models.CartItem.user_id == user_id).order_by(models.CartItem.created_at)
    return list(db.scalars(stmt).all())


@router.get("", response_model=schemas.CartOut)
def get_cart(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _build_cart_out(_get_user_cart_items(db, current_user.id))


@router.post("/items", response_model=schemas.CartOut, status_code=201)
def add_to_cart(
    payload: schemas.CartItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.is_custom:
        if not payload.name or payload.price is None:
            raise HTTPException(status_code=400, detail="Custom items require a name and price")
        item = models.CartItem(
            user_id=current_user.id,
            product_id=None,
            name=payload.name,
            price=payload.price,
            image=payload.image,
            details=payload.details,
            quantity=payload.quantity,
            is_custom=True,
        )
        db.add(item)
    else:
        if not payload.product_id:
            raise HTTPException(status_code=400, detail="product_id is required for catalog items")
        product = db.get(models.Product, payload.product_id)
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail="Product not found")

        existing = db.scalar(
            select(models.CartItem).where(
                models.CartItem.user_id == current_user.id,
                models.CartItem.product_id == product.id,
                models.CartItem.is_custom.is_(False),
            )
        )
        if existing:
            existing.quantity += payload.quantity
        else:
            db.add(
                models.CartItem(
                    user_id=current_user.id,
                    product_id=product.id,
                    name=product.name,
                    price=product.price,
                    image=product.image,
                    details=product.description,
                    quantity=payload.quantity,
                    is_custom=False,
                )
            )
    db.commit()
    return _build_cart_out(_get_user_cart_items(db, current_user.id))


@router.put("/items/{item_id}", response_model=schemas.CartOut)
def update_cart_item(
    item_id: str,
    payload: schemas.CartItemUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(models.CartItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = payload.quantity
    db.commit()
    return _build_cart_out(_get_user_cart_items(db, current_user.id))


@router.delete("/items/{item_id}", response_model=schemas.CartOut)
def remove_cart_item(
    item_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(models.CartItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return _build_cart_out(_get_user_cart_items(db, current_user.id))


@router.delete("", response_model=schemas.CartOut)
def clear_cart(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for item in _get_user_cart_items(db, current_user.id):
        db.delete(item)
    db.commit()
    return _build_cart_out([])

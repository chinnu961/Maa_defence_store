import random
import json
from datetime import datetime, timedelta

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.routers.cart import FITTING_FEE, _get_user_cart_items

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _generate_order_number() -> str:
    return f"SDS-{random.randint(10_000_000, 99_999_999)}"


@router.post("", response_model=schemas.OrderOut, status_code=201)
def checkout(
    payload: schemas.CheckoutRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_items = payload.items
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    subtotal = sum(float(i.price) * i.quantity for i in cart_items)
    has_custom = any(i.is_custom for i in cart_items)
    fitting_fee = FITTING_FEE if has_custom else 0

    order_number = _generate_order_number()
    while db.scalar(select(models.Order).where(models.Order.order_number == order_number)):
        order_number = _generate_order_number()

    fitting_date = (datetime.utcnow() + timedelta(days=3)).strftime("%d %b %Y")

    order = models.Order(
        order_number=order_number,
        user_id=current_user.id,
        full_name=payload.full_name,
        phone=payload.phone,
        division=payload.division,
        regiment_id=payload.regiment_id,
        institute_name=payload.institute_name,
        battalion=payload.battalion,
        subtotal=subtotal,
        fitting_fee=fitting_fee,
        grand_total=subtotal + fitting_fee,
        status=models.OrderStatus.pending,
        fitting_appointment=f"{fitting_date} at Delhi Cantt Outlet",
    )
    db.add(order)
    db.flush()  # get order.id before creating items

    for cart_item in cart_items:
        if cart_item.product_id:
            product = db.get(models.Product, cart_item.product_id)
            if product:
                if product.stock < cart_item.quantity:
                    db.rollback()
                    raise HTTPException(status_code=400, detail=f"Not enough stock for {cart_item.name}. Available: {product.stock}")
                product.stock -= cart_item.quantity

        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                name=cart_item.name,
                price=cart_item.price,
                quantity=cart_item.quantity,
                is_custom=cart_item.is_custom,
                details=cart_item.details,
            )
        )

    db.commit()
    db.refresh(order)

    # Create admin notification for new order
    try:
        items_summary = [{"name": i.name, "quantity": i.quantity, "price": float(i.price)} for i in order.items]
        notif_data = {
            "order_id": order.id,
            "order_number": order.order_number,
            "full_name": order.full_name,
            "phone": order.phone,
            "division": order.division,
            "regiment_id": order.regiment_id,
            "institute_name": order.institute_name,
            "battalion": order.battalion,
            "grand_total": float(order.grand_total),
            "items": items_summary
        }
        notif = models.Notification(
            user_id=None,
            title="New Order Placed",
            message=f"Order {order.order_number} placed by {order.full_name} for ₹{order.grand_total:,.2f}",
            type="order",
            data=json.dumps(notif_data)
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        print("Failed to create checkout notification:", e)

    return order


@router.get("/my", response_model=list[schemas.OrderOut])
def my_orders(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = (
        select(models.Order)
        .where(models.Order.user_id == current_user.id)
        .options(selectinload(models.Order.items))
        .order_by(models.Order.created_at.desc())
    )
    return db.scalars(stmt).all()


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.id == order_id).options(selectinload(models.Order.items))
    order = db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return order


@router.put("/{order_id}/cancel", response_model=schemas.OrderOut)
def cancel_order(order_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.id == order_id).options(selectinload(models.Order.items))
    order = db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    if order.status in [models.OrderStatus.delivered, models.OrderStatus.cancelled]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status {order.status}")
        
    # Refund stock
    for item in order.items:
        if item.product_id:
            product = db.get(models.Product, item.product_id)
            if product:
                product.stock += item.quantity
                
    order.status = models.OrderStatus.cancelled
    db.commit()
    db.refresh(order)
    return order

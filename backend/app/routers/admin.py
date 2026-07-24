from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db
from app.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


@router.get("/orders", response_model=list[schemas.OrderOut])
def list_all_orders(
    status: models.OrderStatus | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(models.Order).options(selectinload(models.Order.items)).order_by(models.Order.created_at.desc())
    if status:
        stmt = stmt.where(models.Order.status == status)
    return db.scalars(stmt).all()


@router.patch("/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: str, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    if payload.status == models.OrderStatus.cancelled and payload.cancellation_reason:
        order.cancellation_reason = payload.cancellation_reason
    db.commit()
    db.refresh(order)
    return order


@router.get("/users", response_model=list[schemas.UserWithOrdersOut])
def list_users(db: Session = Depends(get_db)):
    stmt = select(models.User).where(models.User.role != models.UserRole.admin).options(
        selectinload(models.User.orders).selectinload(models.Order.items)
    ).order_by(models.User.created_at.desc())
    return db.scalars(stmt).all()


@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(db: Session = Depends(get_db)):
    total_orders = db.scalar(select(func.count(models.Order.id))) or 0
    total_users = db.scalar(select(func.count(models.User.id))) or 0
    total_revenue = db.scalar(
        select(func.coalesce(func.sum(models.Order.grand_total), 0))
        .where(models.Order.status == models.OrderStatus.delivered)
    ) or 0
    pending_orders = (
        db.scalar(select(func.count(models.Order.id)).where(models.Order.status == models.OrderStatus.pending)) or 0
    )

    status_rows = db.execute(
        select(models.Order.status, func.count(models.Order.id)).group_by(models.Order.status)
    ).all()
    orders_by_status = {status.value: count for status, count in status_rows}

    return schemas.AdminStats(
        total_orders=total_orders,
        total_users=total_users,
        total_revenue=float(total_revenue),
        pending_orders=pending_orders,
        orders_by_status=orders_by_status,
    )

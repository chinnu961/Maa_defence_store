from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[schemas.NotificationOut])
def list_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == models.UserRole.admin:
        stmt = select(models.Notification).where(
            (models.Notification.user_id == None) | (models.Notification.user_id == current_user.id)
        ).order_by(models.Notification.created_at.desc())
    else:
        stmt = select(models.Notification).where(
            models.Notification.user_id == current_user.id
        ).order_by(models.Notification.created_at.desc())
    
    return db.scalars(stmt).all()


@router.patch("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notification_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.get(models.Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Permission check: admin or specific user
    if current_user.role != models.UserRole.admin and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification")
        
    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.get("/{notification_id}", response_model=schemas.NotificationOut)
def get_notification(
    notification_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.get(models.Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if current_user.role != models.UserRole.admin and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this notification")
        
    return notification

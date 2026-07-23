from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import OrderStatus, UserRole

# ---------- Auth / Users ----------


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=10)
    password: str = Field(min_length=6, max_length=128)
    institute_name: str = Field(min_length=2, max_length=255)
    battalion: str | None = Field(default=None, max_length=255)
    regimental_number: str | None = Field(default=None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=10, max_length=10)
    password: str | None = Field(default=None, min_length=6, max_length=128)
    shop_address: str | None = Field(default=None, max_length=255)
    institute_name: str | None = Field(default=None, max_length=255)
    battalion: str | None = Field(default=None, max_length=255)
    regimental_number: str | None = Field(default=None, max_length=255)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: str | None
    role: UserRole
    is_active: bool
    shop_address: str | None = None
    institute_name: str | None = None
    battalion: str | None = None
    regimental_number: str | None = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Products ----------


class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    badge: str
    image: str
    description: str | None = None
    stock: int = 1000


class ProductCreate(ProductBase):
    id: str


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: float | None = None
    badge: str | None = None
    image: str | None = None
    description: str | None = None
    stock: int | None = None
    is_active: bool | None = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool


# ---------- Cart ----------


class CartItemCreate(BaseModel):
    product_id: str | None = None
    quantity: int = Field(default=1, ge=1)

    # Only used when adding a custom (customizer) package, product_id is omitted
    name: str | None = None
    price: float | None = None
    image: str | None = None
    details: str | None = None
    is_custom: bool = False


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str | None
    name: str
    price: float
    image: str | None
    details: str | None
    quantity: int
    is_custom: bool


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: float
    fitting_fee: float
    grand_total: float
    item_count: int


# ---------- Orders ----------


class CheckoutItem(BaseModel):
    product_id: str | None = None
    name: str
    price: float
    quantity: int
    is_custom: bool = False
    details: str | None = None

class CheckoutRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=15)
    division: str
    regiment_id: str = Field(min_length=1, max_length=120)
    institute_name: str = Field(min_length=2, max_length=255)
    battalion: str | None = Field(default=None, max_length=255)
    items: list[CheckoutItem]


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str | None
    name: str
    price: float
    quantity: int
    is_custom: bool
    details: str | None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    user_id: str
    full_name: str
    phone: str
    division: str
    regiment_id: str
    institute_name: str | None = None
    battalion: str | None = None
    subtotal: float
    fitting_fee: float
    grand_total: float
    status: OrderStatus
    fitting_appointment: str | None
    created_at: datetime
    items: list[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ---------- Admin ----------


class AdminStats(BaseModel):
    total_orders: int
    total_users: int
    total_revenue: float
    pending_orders: int
    orders_by_status: dict[str, int]


class UserWithOrdersOut(UserOut):
    orders: list[OrderOut] = []


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime
    data: str | None


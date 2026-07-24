# MAA Defence Stores — Backend API

FastAPI + PostgreSQL backend for the MAA Defence Stores e-commerce app (matches the
`maa-defence-stores-react` frontend: shop, cart drawer, checkout modal, customizer).

## Features

- **Auth** — register / login with JWT, bcrypt-hashed passwords, roles (`user`, `admin`)
- **Products** — public catalog (matches the 101 items from the frontend's `products.js`,
  seeded automatically on first startup), admin CRUD
- **Cart** — per-user server-side cart (add / update quantity / remove / clear), supports
  both catalog items and one-off "customized package" items from the Customizer
- **Orders** — checkout creates an order from the cart (mirrors `CheckoutModal.jsx`: full
  name, phone, division/wing, regiment ID → order number `SDS-XXXXXXXX` + fitting
  appointment), users can view their own order history
- **Admin** — view all orders (filter by status), update order status, list users,
  dashboard stats (revenue, order counts by status)

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, startup seeding
    config.py           Settings (reads .env)
    database.py          SQLAlchemy engine/session
    models.py            ORM models: User, Product, CartItem, Order, OrderItem
    schemas.py            Pydantic request/response models
    security.py           Password hashing + JWT
    deps.py                Auth dependencies (get_current_user / get_current_admin)
    seed_data.py            Product catalog seed (mirrors frontend data)
    routers/
      auth.py               /api/auth/*
      products.py            /api/products/*
      cart.py                 /api/cart/*
      orders.py                /api/orders/*
      admin.py                  /api/admin/*
  requirements.txt
  docker-compose.yml   Local Postgres
  .env.example
```

## Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Or point `DATABASE_URL` in `.env` at any existing PostgreSQL instance.

### 2. Configure environment

```bash
cp .env.example .env
# edit .env: set a strong SECRET_KEY, adjust CORS_ORIGINS to your frontend URL, etc.
```

### 3. Install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

On first startup the app automatically:
- creates all database tables
- seeds the product catalog (101 items, matching the frontend) if not already present
- creates a first admin account (`FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD` in `.env`)

Interactive API docs: `http://localhost:8000/docs`

## API overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | OAuth2 form login (`username`=email, `password`), returns JWT |
| POST | `/api/auth/login-json` | – | Same as above but JSON body `{email, password}` |
| GET | `/api/auth/me` | user | Current user profile |
| GET | `/api/products` | – | List products (filters: `category`, `badge`, `search`) |
| GET | `/api/products/{id}` | – | Product detail |
| POST/PUT/DELETE | `/api/products...` | admin | Manage catalog |
| GET | `/api/cart` | user | View your cart |
| POST | `/api/cart/items` | user | Add catalog item or custom package to cart |
| PUT | `/api/cart/items/{id}` | user | Change quantity |
| DELETE | `/api/cart/items/{id}` | user | Remove one item |
| DELETE | `/api/cart` | user | Clear cart |
| POST | `/api/orders` | user | Checkout — creates order from cart, clears cart |
| GET | `/api/orders/my` | user | Your order history |
| GET | `/api/orders/{id}` | user/admin | Order detail (owner or admin only) |
| GET | `/api/admin/orders` | admin | All orders (filter by `status`) |
| PATCH | `/api/admin/orders/{id}/status` | admin | Update order status |
| GET | `/api/admin/users` | admin | List all users |
| GET | `/api/admin/stats` | admin | Dashboard totals |

Send the JWT as `Authorization: Bearer <token>` on all authenticated requests.

## Connecting the React frontend

In the frontend, replace the mock `setTimeout` order submission in
`CheckoutModal.jsx` and the in-memory `CartContext.jsx` with calls to these endpoints
(e.g. via `fetch`/`axios`, base URL `http://localhost:8000`), and add a login page that
posts to `/api/auth/login-json` and stores the returned JWT (e.g. in memory or
`sessionStorage`, attached to a request client) for subsequent requests.

## Notes on production hardening

- Set a long random `SECRET_KEY` and never commit `.env`.
- Put this behind HTTPS; restrict `CORS_ORIGINS` to your real frontend domain.
- Consider Alembic migrations instead of `create_all` once the schema stabilizes.
- Add rate limiting on `/api/auth/login` to slow brute-force attempts.

# TempoTempo

TempoTempo is a full-stack ecommerce platform for digital gaming products such as gift cards, game time, and activation codes. It is built as a Software Engineering bachelor degree project with a Django REST API, JWT authentication, and a React/Vite frontend.

## Project Goals

- Provide a complete customer shopping flow from product discovery to checkout.
- Support digital product catalog management through Django Admin.
- Include user accounts, profile management, cart, wishlist, orders, coupons, reviews, and blog content.
- Demonstrate software engineering practices: layered architecture, validation, authentication, automated tests, environment-based configuration, and documentation.

## Main Features

- Customer registration and cookie-backed refresh-token login (access tokens stay in memory)
- Product categories, products, variants, stock, featured products, and search
- Cart management with quantity validation and stock limits
- Transaction-safe checkout with coupon support and stock reduction
- Order history for customers
- Wishlist and verified-buyer product reviews
- Admin dashboard with revenue, order, user, and product statistics
- Blog system for published articles
- Responsive Persian/RTL frontend
- Backend tests for key business flows

## Technology Stack

| Layer | Technology |
| --- | --- |
| Backend | Django, Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL for production-like use, SQLite fallback for local tests |
| Frontend | React, Vite, React Router |
| State Management | Zustand |
| HTTP Client | Axios |
| Styling | CSS Modules and global CSS |

## Architecture

```mermaid
flowchart LR
    Customer["Customer / Admin"] --> Frontend["React Frontend"]
    Frontend --> API["Django REST API"]
    API --> Auth["JWT Auth"]
    API --> Products["Products App"]
    API --> Orders["Orders App"]
    API --> Users["Users App"]
    API --> Blog["Blog App"]
    Products --> DB[("Database")]
    Orders --> DB
    Users --> DB
    Blog --> DB
    API --> Media["Uploaded Media"]
```

## Data Model Overview

```mermaid
erDiagram
    USER ||--o| CART : owns
    USER ||--o{ ORDER : places
    USER ||--o{ WISHLIST : saves
    USER ||--o{ REVIEW : writes
    CATEGORY ||--o{ PRODUCT : contains
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ REVIEW : receives
    CART ||--o{ CART_ITEM : contains
    PRODUCT_VARIANT ||--o{ CART_ITEM : selected_as
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : purchased_as
```

## Local Setup

### Backend

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and adjust values if needed.
4. Run migrations:

```bash
python manage.py migrate
```

5. Create an admin user:

```bash
python manage.py createsuperuser
```

6. Start the backend:

```bash
python manage.py runserver
```

Optional demo data for presentations:

```bash
python manage.py seed_demo
```

This creates sample products, variants, a coupon code `DEMO10`, one blog post, and—only when
`DEMO_ADMIN_PASSWORD` is set—an admin user with the email `admin@tempotempo.test`.

The admin password is read from the `DEMO_ADMIN_PASSWORD` environment variable and is intentionally
not published in this repository. Set it before seeding — always for a public deployment:

```bash
DEMO_ADMIN_PASSWORD='<choose-a-strong-password>' python manage.py seed_demo
```

There is no fallback password, including in development. In production the command fails safely if
admin creation is requested without the secret. To rotate an existing demo admin, set a new
`DEMO_ADMIN_PASSWORD` and run `python manage.py seed_demo` once; remove the secret afterward.

### Frontend

1. Open the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Copy `frontend/.env.example` to `frontend/.env` if the API URL changes.
4. Start the frontend:

```bash
npm run dev
```

## Useful Commands

Run backend checks:

```bash
python manage.py check
```

Run backend tests with SQLite:

```bash
USE_SQLITE=True python manage.py test
```

Build the frontend:

```bash
cd frontend
npm run build
```

Lint the frontend:

```bash
cd frontend
npm run lint
```

On Windows PowerShell, use `$env:USE_SQLITE='True'; python manage.py test`.

### Production configuration check

Copy `.env.production.example` into your deployment secret manager; set explicit Vercel production
and approved preview origins in both `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`. Do not use
a wildcard Vercel regular expression. Run this check with production-like variables:

```powershell
$env:DEBUG='False'; $env:SECRET_KEY='<long-random-secret>'; $env:ALLOWED_HOSTS='your-api.onrender.com'
$env:CORS_ALLOWED_ORIGINS='https://your-app.vercel.app'; $env:CSRF_TRUSTED_ORIGINS='https://your-app.vercel.app'
$env:SECURE_SSL_REDIRECT='True'; $env:USE_OBJECT_STORAGE='True'; $env:AWS_STORAGE_BUCKET_NAME='validation-only-bucket'
python manage.py check --deploy
```

The application refuses to start under `DEBUG=False` with a missing or fallback secret. Render is
configured to trust `X-Forwarded-Proto`; it redirects to HTTPS and uses secure HSTS/session/CSRF
cookies. The refresh cookie is HttpOnly, Secure, and `SameSite=None` for the separate Vercel/Render
origins; mutating authentication endpoints require Django CSRF protection.

### Security and test coverage

- Cart additions and updates reject over-stock quantities without changing the cart.
- Checkout locks cart rows, variants, and coupons; PostgreSQL is required to prove real lock contention.
- Status changes follow `pending -> processing/cancelled -> completed/cancelled`; cancellation restores stock once and writes an audit record.
- Password registration/change uses Django validators. Refresh rotation and blacklist-backed logout are enabled.
- Login, registration, refresh, password change, coupon validation, and checkout are rate-limited. Request IDs are returned as `X-Request-ID`; logs intentionally omit bodies, passwords, tokens, and payment data.
- The API emits a restrictive CSP and Vercel sends the SPA CSP header. Edge WAF/rate limiting, secret rotation, security monitoring, and penetration testing remain deployment/infrastructure work.

### Media and distributed rate limits

Render's local filesystem is not durable for uploaded media. Production must use object storage (for
example S3-compatible storage) before accepting user uploads; local media is for development only.
The built-in DRF rate limiter is process-local, so a multi-worker deployment must add Redis-backed
rate limiting or an edge control.

PostgreSQL concurrency tests must be run only against an isolated PostgreSQL test database, for example:

```powershell
$env:DATABASE_URL='postgresql://user:password@localhost:5432/tempotempo_test'; Remove-Item Env:USE_SQLITE -ErrorAction Ignore
python manage.py test orders.tests_postgres --keepdb
```

They are intentionally not treated as passing when PostgreSQL is unavailable.

## Online Presentation Deploy

The project is prepared for a low-cost hosted demo with:

- Django API and PostgreSQL on Render using `render.yaml`
- React/Vite frontend on Vercel from the repo root or the `frontend` directory

Render creates the PostgreSQL database, installs Python dependencies, collects static files, and runs migrations through `build.sh`. Demo seeding is opt-in: set `SEED_DEMO=true` and provide `DEMO_ADMIN_PASSWORD`; the production default does not seed data or create an admin. The default API URL expected by the production frontend is:

```text
https://tempotempo-api.onrender.com/api
```

For Vercel, `vercel.json` builds the `frontend` app and sets `VITE_API_BASE_URL` for the presentation API. The frontend also includes `frontend/vercel.json` for setups where the Vercel project root is configured as `frontend`.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register/` | Create customer account |
| POST | `/api/auth/csrf/` | Set/read CSRF token for cookie-auth operations |
| POST | `/api/auth/login/` | Get in-memory access JWT and set HttpOnly refresh cookie |
| POST | `/api/auth/token/refresh/` | Rotate refresh cookie and issue a new access JWT |
| POST | `/api/auth/logout/` | Blacklist refresh cookie and end the session |
| GET/PATCH | `/api/auth/me/` | Read or update profile |
| POST | `/api/auth/change-password/` | Change password |
| GET | `/api/products/` | List products with pagination, category filter, and search |
| GET | `/api/products/categories/` | List categories |
| GET | `/api/products/<slug>/` | Product detail |
| GET/POST | `/api/cart/` | Read cart or add item |
| PATCH/DELETE | `/api/cart/<item_id>/` | Update or remove cart item |
| POST | `/api/coupon/validate/` | Validate discount code |
| POST | `/api/checkout/` | Create order and reduce stock |
| GET | `/api/orders/` | Customer order history |
| GET/POST/DELETE | `/api/wishlist/` | Manage wishlist |
| GET/POST | `/api/reviews/<product_id>/` | Read or write reviews |
| GET | `/api/admin/stats/` | Admin statistics |
| GET/PATCH | `/api/admin/orders/` | Admin order management |
| GET | `/api/blog/` | Published blog posts |
| GET | `/api/blog/<slug>/` | Blog post detail |

## Quality Improvements Included

- Checkout now runs inside a database transaction.
- Product stock is checked before checkout and reduced after order creation.
- Coupon usage is validated and incremented safely.
- Cart quantities are validated and cannot exceed stock.
- Product list queries use `select_related`, `prefetch_related`, and annotated starting prices.
- Duplicate serializer and URL definitions were removed.
- Settings are environment-driven and support local SQLite testing.
- CKEditor 4 dependency was removed to avoid the unsupported package warning.
- Tests cover authentication, products, checkout, coupons, stock handling, reviews, and blog visibility.
- A demo seed command creates realistic data for live presentations.

## Suggested Future Work

- Add payment gateway integration.
- Add order detail pages and downloadable digital code delivery.
- Add admin product creation/editing inside the React dashboard.
- Add frontend component tests and end-to-end tests.
- Add Docker Compose for backend, frontend, and PostgreSQL.
- Add email notifications for order status changes.

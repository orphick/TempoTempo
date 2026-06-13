# TempoTempo Frontend

React/Vite frontend for the TempoTempo ecommerce platform.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Environment

Copy `.env.example` to `.env` when the backend API URL is different from the default:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Main Screens

- Home page with categories, featured products, newest products, and blog previews
- Shop page with category filtering, search, and pagination
- Product detail page with variants, cart action, wishlist, reviews, and related products
- Cart and checkout page with coupon validation
- Login, register, profile, wishlist, and orders pages
- Admin dashboard with stats and order status management

# Vendora Frontend

Vendora Frontend is the Vue application for a multi-tenant ecommerce platform
focused on technology products. It provides customer shopping flows, checkout,
account management, vendor workflows, and AI-assisted experiences on top of the
Django REST API.

This repository is one part of the Vendora system:

```text
Vendora/
  ecommerce-backend/    Django REST API
  ecommerce-frontend/   Vue customer and vendor interface
  ecommerce-infra/      Docker Compose and local environment orchestration
```

## Product Experience

The frontend is designed around two main audiences:

- Customers browsing products, managing carts, checking out, and tracking orders
- Vendors managing inventory, reviewing orders, and using dashboard/analytics tools

Key areas include:

- Catalog browsing with category navigation, search, price filters, brand facets, and product detail pages
- Product image display from backend media URLs
- Cart drawer with quantity controls and remove actions
- Authentication screens for login, registration, password reset, and tenant registration
- Profile editing with avatar upload
- Multi-step checkout with address, payment, and confirmation states
- Stripe Elements card form in the payment step
- Customer order history, status filters, order detail timeline, and event log
- Vendor dashboard, inventory, product management, order workflows, exports, and analytics
- AI chat widget and vendor analytics chat
- Role-aware navigation guards for customer, vendor, and protected routes

## Tech Stack

| Area       | Technology    |
| ---------- | ------------- |
| Framework  | Vue 3         |
| Build tool | Vite          |
| State      | Pinia         |
| Routing    | Vue Router    |
| Styling    | Tailwind CSS  |
| Payments   | Stripe.js     |
| Charts     | Chart.js      |
| Testing    | Vitest, jsdom |

## Backend Integration

The app calls the backend through REST endpoints under `/api/v1/`. The default
API base URL is:

```text
http://localhost:8000
```

Optional frontend environment values:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

When using Docker Compose, the frontend is served at `http://localhost:5173`.
Use `localhost`, not `127.0.0.1`, so browser requests match the backend CORS
configuration.

## Local Development With Docker

Use the infrastructure repository for the full stack:

```bash
cd path/to/Vendora/ecommerce-infra
cp .env.example .env
docker compose up --build -d
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_demo_data
```

Open:

```text
http://localhost:5173
```

The seed command prepares demo users and data for local testing. Credentials
should be shared through the team channel or read from the seed command output,
not committed to documentation.

## Local Development Without Docker

Use this mode only when working on frontend UI while the backend is already
running:

```bash
cd path/to/Vendora/ecommerce-frontend
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
```

When running through Docker:

```bash
cd path/to/Vendora/ecommerce-infra
docker compose exec frontend npm run test
docker compose exec frontend npm run build
```

## Source Layout

| Path             | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `src/components` | Page-level and reusable UI components                          |
| `src/stores`     | Pinia stores for auth, chat, theme, wishlist, and shared state |
| `src/router`     | Routes and role-based navigation guards                        |
| `src/assets`     | Static frontend assets                                         |
| `src/main.js`    | Vue app bootstrap                                              |

## Quality Checks

Run unit tests:

```bash
npm run test
```

Build production assets:

```bash
npm run build
```

## Troubleshooting

If the UI shows `Failed to fetch`, confirm the backend is running:

```bash
cd path/to/Vendora/ecommerce-infra
docker compose ps
docker compose logs -f web
```

If products load without images, reseed backend demo data:

```bash
docker compose exec web python manage.py seed_demo_data
```

If protected pages redirect unexpectedly, verify the logged-in user's role and
run the router tests:

```bash
npm run test
```

## Development Notes

- Keep UI behavior aligned with backend permissions and API responses.
- Prefer reusable components and existing Pinia stores before adding new global state.
- Keep customer, vendor, and admin navigation paths clear and role-aware.
- Do not commit `node_modules`, local `.env` files, or build artifacts unless the team explicitly agrees.

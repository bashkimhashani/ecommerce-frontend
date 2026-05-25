# Vendora Frontend

Vendora Frontend is the Vue 3 single-page application for the Vendora
multi-tenant ecommerce platform. It provides customer shopping flows, auth
screens, checkout, order history, vendor views, and AI chat UI.

## Project Overview

The frontend supports:

- Product catalog browsing with category navigation, search, filters, and product details
- Shopping cart drawer with quantity updates and item removal
- Customer authentication, registration, password reset, and profile editing
- Multi-step checkout with address, payment, and confirmation steps
- Stripe Elements card form
- Customer order history and order detail timeline
- Vendor dashboard, inventory, product management, analytics, and order workflows
- AI chat widget and vendor analytics chat
- Role-aware navigation guards

The app communicates with the Django backend through REST endpoints under
`/api/v1/*`.

## Tech Stack

- Vue 3
- Vite
- Pinia
- Vue Router
- Tailwind CSS
- Vitest
- Stripe.js
- Chart.js

## Related Repositories

The full project uses three sibling repositories:

```text
Vendora/
  ecommerce-backend/
  ecommerce-frontend/
  ecommerce-infra/
```

For normal development, start the project from `ecommerce-infra` with Docker
Compose.

## Local Setup With Docker

Clone all repositories into the same parent folder:

```bash
git clone https://github.com/bashkimhashani/ecommerce-backend.git
git clone https://github.com/bashkimhashani/ecommerce-frontend.git
git clone https://github.com/bashkimhashani/ecommerce-infra.git
```

Start the full stack:

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

Use `localhost`, not `127.0.0.1`, because backend CORS is configured for
`http://localhost:5173`.

## Local Setup Without Docker

Use this only when working on frontend UI separately:

```bash
cd path/to/Vendora/ecommerce-frontend
npm install
npm run dev
```

The default backend URL is:

```text
http://localhost:8000
```

Optional local `.env` values:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

The backend must still be running for API-backed screens to work.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
```

In Docker, run frontend commands through the `frontend` service:

```bash
cd path/to/Vendora/ecommerce-infra
docker compose exec frontend npm run test
docker compose exec frontend npm run build
```

## Main Source Areas

- `src/components` - page and UI components
- `src/stores` - Pinia stores for auth, chat, wishlist, and theme state
- `src/router` - Vue Router routes and role-based guards
- `src/assets` - static frontend assets

## Demo Accounts

After the backend seed command runs:

```text
admin@example.com
vendor@example.com
gaming.vendor@example.com
office.vendor@example.com
customer@example.com
```

Password:

```text
DemoPass123!
```

## Troubleshooting

If the catalog says `Failed to fetch`, confirm the backend is running:

```bash
cd path/to/Vendora/ecommerce-infra
docker compose ps
docker compose logs -f web
```

If products appear without images, refresh backend seed data:

```bash
docker compose exec web python manage.py seed_demo_data
```

If route guards redirect unexpectedly, verify the logged-in user's role and run:

```bash
npm run test
```

## Git Workflow

```bash
git checkout main
git pull origin main
git checkout -b feature/yourname/task-name
```

Commit and push:

```bash
git add .
git commit -m "type: describe the change"
git push origin feature/yourname/task-name
```

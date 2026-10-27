# QR Menu: restaurant menu and ordering platform

Restaurant owners register, build their menu, and print a QR code. Guests scan it,
browse the menu on their phone, and place orders. The owner sees orders live.

## Stack
- Backend: C# / .NET 8 Web API, Entity Framework Core, SQL Server, JWT auth, SignalR
- Frontend: Next.js (App Router), React, Tailwind CSS
- Images: stored on the server disk (`backend/wwwroot/media`)

## Project structure
```
backend/    .NET API (Controllers, Models, Dtos, Services, Hubs, Migrations)
frontend/   Next.js app (app/, components/, lib/)
```

## Requirements
- .NET 8 SDK
- Node.js 20+
- SQL Server (LocalDB, Express, or Docker `mcr.microsoft.com/mssql/server:2022-latest`)

## Local setup

### 1. Backend
1. In `backend/appsettings.json` set the connection string, the JWT key and the allowed origins
   (see the table below). Do not commit real secrets.
2. Create the database tables (the database is created automatically):
   ```bash
   cd backend
   dotnet ef database update
   ```
3. Run it with the `http` profile and note the port (for example `http://localhost:5123`).
   Swagger is at `/swagger` in development.

### 2. Frontend
1. Create `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5123
   ```
2. Install and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 (use `localhost`, not `127.0.0.1`, because of CORS).

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `ConnectionStrings__Default` | backend | SQL Server connection string |
| `Jwt__Key` | backend | Secret that signs login tokens (40+ random characters) |
| `Jwt__Issuer`, `Jwt__Audience` | backend | Token issuer and audience (defaults in appsettings) |
| `Jwt__ExpiresMinutes` | backend | Token lifetime, default 1440 |
| `Cors__AllowedOrigins__0` | backend | Frontend address, for example `https://menu.example.uz` |
| `NEXT_PUBLIC_API_URL` | frontend | Backend address. Set at build time. |

In ASP.NET, double underscores in an environment variable name replace `:`
(`Jwt__Key` means `Jwt:Key`).

## Features
- Owner registration (a restaurant is created automatically), login with JWT, BCrypt hashed passwords
- Dashboard: restaurant profile, categories, menu items with photos and stock switch
- Live orders over SignalR with status flow New, Preparing, Ready, Served / Cancelled, sound alert, history
- Public page `/r/{slug}` with category navigation, cart, item notes, and live order tracking
- QR generator: PNG, SVG, printable PDF, one QR per table (`?table=5`)
- Public restaurant list with search
- Customer pages in Uzbek, Russian and English

## API overview
| Route | Access |
|---|---|
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | public / token |
| `GET, PUT /restaurant/me` | owner |
| `CRUD /categories`, `CRUD /menu-items`, `POST /uploads/image` | owner |
| `GET /orders`, `PATCH /orders/{id}/status` | owner |
| `GET /public/restaurants`, `GET /public/restaurants/{slug}` | public |
| `POST /public/restaurants/{slug}/orders`, `GET /public/orders/{publicId}` | public |
| `/hubs/orders` (SignalR) | owner (orders) / guests (own order) |

## Security notes
- Every owner endpoint reads the restaurant id from the token, never from the request.
- Prices are always read from the database when an order is placed.
- Guests track orders with a random `PublicId`, not a guessable number.
- Rate limits on login, uploads and public endpoints.
- Uploaded files are checked by their real file header, max 5 MB.

## Deployment (short)
1. Publish: `dotnet publish -c Release`, and `npm run build` in `frontend`.
2. Run the API behind Nginx with HTTPS. Pass `Upgrade` headers for WebSockets.
3. Keep `backend/wwwroot/media` when updating. It holds uploaded images.
4. The API applies pending migrations on start.
5. Back up the database and the `media` folder regularly.

## Troubleshooting
- "Cannot reach the server": check `NEXT_PUBLIC_API_URL`, the backend port, and restart `npm run dev`.
- CORS error: the browser address must match `Cors:AllowedOrigins` exactly.
- Page shows "default export is not a React Component": the file is empty or unsaved. Save it.
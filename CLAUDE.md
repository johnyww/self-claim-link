# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Self-Claim Link is a Next.js 15 application for digital product delivery. Customers claim virtual products using order IDs, and administrators manage the system through a JWT-authenticated dashboard. The application uses SQLite for persistence and TypeScript for type safety.

## Development Commands

```bash
# Install dependencies (requires --legacy-peer-deps flag)
npm install --legacy-peer-deps

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Database Layer (`lib/database.ts`)

- **Singleton Pattern**: Uses a cached `db` instance to prevent multiple connections
- **Lazy Initialization**: `getDatabase()` creates tables and seeds defaults on first call
- **Auto-Seeding**: In non-production, creates default admin (`username: admin`, `password: password`)
- **Schema**: 5 tables (`products`, `orders`, `order_products`, `admins`, `settings`)

**Key Pattern**: Always call `getDatabase()` at the start of API routes to ensure schema exists.

### Authentication Flow

1. Admin logs in via `POST /api/auth/login` with username/password
2. Server validates credentials against bcrypt-hashed passwords in `admins` table
3. Returns JWT token signed with `JWT_SECRET` (24h expiration)
4. Client stores token in `localStorage` as `adminToken`
5. Protected routes expect `Authorization: Bearer <token>` header
6. Token payload: `{ userId, username }`

**JWT Secret Requirement**: `JWT_SECRET` environment variable is mandatory. App will throw errors if missing.

### API Route Patterns

**Standard CRUD Structure**:
- `GET` - List all resources
- `POST` - Create resource (returns 201 on success)
- `PUT` - Update resource (requires `id` in body)
- `DELETE` - Delete resource (requires `id` in query params: `?id=123`)

**Error Handling Convention**:
- Validation errors: `{ error: string }` with 400 status
- Not found: `{ error: string }` with 404 status
- Auth errors: `{ error: string }` with 401 status
- Server errors: `{ error: string }` with 500 status
- In development: detailed error messages; in production: generic messages

**Settings API Special Case** (`/api/settings`):
- Uses action-based routing via `action` body parameter
- Actions: `update_settings`, `create_admin`, `update_admin_password`, `delete_admin`
- Always pass `action` field to determine operation type

### Database Relationships

**Many-to-Many Orders ↔ Products**:
- Junction table: `order_products`
- When querying orders, use `GROUP_CONCAT` to aggregate product data:
  ```sql
  SELECT o.*,
         GROUP_CONCAT(p.name) as product_names,
         GROUP_CONCAT(p.id) as product_ids
  FROM orders o
  LEFT JOIN order_products op ON o.id = op.order_id
  LEFT JOIN products p ON op.product_id = p.id
  GROUP BY o.id
  ```
- Split comma-separated strings in JavaScript: `.split(',').map(Number)`

**Order Lifecycle**:
1. Created with `order_id`, `product_ids`, `expiration_days`, `one_time_use`
2. Customer claims via `POST /api/claim` with order_id
3. Claim validation: checks expiration date, one-time-use status, claim count
4. On successful claim: increments `claim_count`, sets `claim_timestamp`, returns product download links

### Key Business Logic

**Claim Restrictions** (`/api/claim/route.ts`):
- Expired orders: Blocks claim if `expiration_date` < current time
- One-time use: If `one_time_use=true` and `claim_count > 0`, reject claim
- Multi-use orders: Always allow claims regardless of `claim_count`

**Order Editing** (`PUT /api/orders`):
- When switching from multi-use to one-time-use: resets `claim_count` to 0
- Always deletes existing `order_products` entries and re-inserts to update product list
- Validates all `product_ids` exist before updating

**Admin Account Management** (`/api/settings`):
- Prevents deletion of last admin account (queries count before allowing delete)
- Password changes use bcrypt with 10 salt rounds
- Usernames must be unique (enforced by database constraint)

### Frontend Architecture

**Page Structure**:
- `/app/page.tsx` - Customer claim interface (public)
- `/app/admin/page.tsx` - Tabbed admin dashboard (Orders, Products, Settings)
- `/app/admin/login/page.tsx` - Admin authentication page

**State Management Pattern**:
- Uses React `useState` for local component state
- `useEffect` hooks for data fetching on mount and authentication checks
- No global state management (Redux/Context) - relies on API as source of truth
- Token persistence via `localStorage.getItem('adminToken')`

**Admin Dashboard Tabs**:
1. **Orders Tab**: CRUD operations, shows claim status and counts
2. **Products Tab**: CRUD operations for digital products
3. **Settings Tab**: System configuration and admin account management

### TypeScript Types (`lib/types.ts`)

Core interfaces:
- `Product` - Digital product with download link
- `Order` - Order with claim metadata and optional `products` array
- `OrderProduct` - Junction table representation
- `Settings` - System configuration
- `ClaimResponse` - API response for claim endpoint

**Type Pattern**: API responses return database rows directly, then map to TypeScript interfaces client-side.

## Important Configuration

### Environment Variables

**Required**:
- `JWT_SECRET` - Secret for signing JWT tokens (use `openssl rand -base64 32` in production)

**Optional**:
- `NODE_ENV` - Set to `production` to disable default admin creation

### Database File

- Location: `database.sqlite` in project root
- File-based SQLite (no server required)
- Auto-created on first `getDatabase()` call
- Not in `.gitignore` - commit initial schema, exclude from production deploys

## Common Tasks

### Adding New Admin Endpoints

1. Create API route in `app/api/[endpoint]/route.ts`
2. Add authentication check by verifying JWT token in request headers
3. Call `getDatabase()` to get database connection
4. Use parameterized queries to prevent SQL injection: `db.get('SELECT * FROM table WHERE id = ?', [id])`
5. Return `NextResponse.json()` with appropriate status codes

### Adding New Database Tables

1. Add schema to `getDatabase()` function in `lib/database.ts`
2. Add TypeScript interface to `lib/types.ts`
3. Consider foreign key constraints for relational integrity
4. Use `CREATE TABLE IF NOT EXISTS` for idempotency

**Note**: The README recommends implementing proper migration tools (Knex.js or Prisma) for production.

### Modifying Claim Logic

Key file: `app/api/claim/route.ts`

Validation order:
1. Check order exists
2. Fetch associated products via join
3. Validate expiration date
4. Check one-time-use restriction
5. Increment claim count
6. Return products with download links

## Security Considerations

- All admin endpoints should verify JWT tokens
- SQL queries use parameterized statements (no string concatenation)
- Passwords hashed with bcrypt (10 rounds)
- Input validation on all API routes (check required fields)
- CORS not explicitly configured - uses Next.js defaults
- Rate limiting not implemented - recommended for production

## Path Aliases

- `@/lib/*` → `/lib/*`
- `@/app/*` → `/app/*`

Configured in `tsconfig.json` with `paths` field.

# Admin Web Application

Admin Portal for Student Governance System

## Setup & Running

### Development

```bash
cd /app/admin-frontend
yarn install
yarn dev
```

The application will run on `http://localhost:5173`

### Login Credentials

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

## Features

### Phase 1: Authentication ✅
- JWT-based authentication
- Protected routes
- Role-based access control (Admin only)

### Phase 2: School & Office Management ✅
- Schools CRUD with pagination and search
- Offices CRUD with pagination, search, and type filtering
- Activate/Deactivate functionality
- Responsive data tables

### Phase 3: User Management ✅
- Users CRUD with role filtering
- Bulk CSV import
- Role-based form fields
- User activation/deactivation
- School assignment for students and headmasters

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## API Endpoints Used

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/schools` - List schools
- `POST /api/schools` - Create school
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Deactivate school
- `GET /api/offices` - List offices
- `POST /api/offices` - Create office
- `PUT /api/offices/:id` - Update office
- `DELETE /api/offices/:id` - Deactivate office
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/bulk-import` - Bulk import users

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── common/
│   │   │   └── StatCard.tsx
│   │   └── layout/
│   │       └── Sidebar.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Schools.tsx
│   │   │   ├── Offices.tsx
│   │   │   └── Users.tsx
│   │   └── Login.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development Notes

- The app uses localStorage for JWT token storage
- All API calls go through `/api/*` which is proxied to the backend (port 8001)
- Only users with 'admin' role can access the application
- Form validation is handled on both frontend and backend

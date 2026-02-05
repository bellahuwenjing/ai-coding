# API Testing Guide

Use these examples to test the authentication endpoints.

## Prerequisites

Make sure the server is running:
```bash
npm run dev
```

Server should be at: `http://localhost:3000`

---

## 1. Register (Create Company + User)

**Endpoint:** `POST /api/auth/register`

### Using curl:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Corp",
    "name": "John Doe",
    "email": "john@acme.com",
    "password": "password123"
  }'
```

### Using Postman/Insomnia:
```json
POST http://localhost:3000/api/auth/register

Headers:
Content-Type: application/json

Body:
{
  "company_name": "Acme Corp",
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "password123"
}
```

### Expected Response (201 Created):
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john@acme.com"
    },
    "session": {
      "access_token": "eyJhbGci...",
      "refresh_token": "eyJhbGci..."
    },
    "profile": {
      "id": "uuid-here",
      "name": "John Doe",
      "company_id": "uuid-here",
      "company_name": "Acme Corp"
    }
  }
}
```

**Save the `access_token` - you'll need it for protected endpoints!**

---

## 2. Login

**Endpoint:** `POST /api/auth/login`

### Using curl:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acme.com",
    "password": "password123"
  }'
```

### Using Postman/Insomnia:
```json
POST http://localhost:3000/api/auth/login

Headers:
Content-Type: application/json

Body:
{
  "email": "john@acme.com",
  "password": "password123"
}
```

### Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john@acme.com"
    },
    "session": {
      "access_token": "eyJhbGci...",
      "refresh_token": "eyJhbGci..."
    },
    "profile": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@acme.com",
      "company_id": "uuid-here",
      "company_name": "Acme Corp"
    }
  }
}
```

---

## 3. Get Current User (Protected)

**Endpoint:** `GET /api/auth/me`

**Requires:** Authorization header with JWT token from login/register

### Using curl:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Using Postman/Insomnia:
```
GET http://localhost:3000/api/auth/me

Headers:
Authorization: Bearer eyJhbGci...YOUR_TOKEN_HERE
```

### Expected Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@acme.com",
    "phone": null,
    "company": {
      "id": "uuid-here",
      "name": "Acme Corp",
      "slug": "acme-corp"
    }
  }
}
```

---

## 4. Logout (Protected)

**Endpoint:** `POST /api/auth/logout`

**Requires:** Authorization header with JWT token

### Using curl:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Using Postman/Insomnia:
```
POST http://localhost:3000/api/auth/logout

Headers:
Authorization: Bearer eyJhbGci...YOUR_TOKEN_HERE
```

### Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Logout successful"
}
```

---

## Error Responses

### 400 Bad Request (Missing fields):
```json
{
  "status": "error",
  "message": "Missing required fields: company_name, name, email, password"
}
```

### 401 Unauthorized (Invalid credentials):
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### 401 Unauthorized (No token):
```json
{
  "status": "error",
  "message": "No token provided. Please login."
}
```

### 401 Unauthorized (Invalid token):
```json
{
  "status": "error",
  "message": "Invalid or expired token. Please login again."
}
```

---

## Testing Workflow

1. **Register** a new user → Get `access_token`
2. **Login** with same credentials → Verify you get the same user info
3. **Get Current User** → Use token from step 1 or 2
4. **Logout** → Token should be invalidated
5. Try **Get Current User** again → Should get 401 error

---

## Postman Collection

You can import this as a Postman collection:

1. Create a new collection "SchedulePro API"
2. Add environment variable `base_url` = `http://localhost:3000`
3. Add environment variable `token` (will be set automatically after login)
4. Add these requests with the examples above

---

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check your `.env` file has correct Supabase credentials
- Restart the server after updating `.env`

### Error: "Failed to create company"
- Check database connection to Supabase
- Verify schema was created successfully
- Check Supabase logs in dashboard

### Error: "User profile not found"
- The user exists in Supabase Auth but not in `people` table
- This shouldn't happen during normal registration
- Check database constraints and RLS policies

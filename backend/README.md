# Smart Parking Backend (Flask + SQLite + JWT)

A standalone Flask backend that powers the Smart Parking frontend. The frontend
will automatically use this backend when reachable at `http://localhost:5000`,
and gracefully fall back to localStorage when it is offline.

## What it provides

- **SQLite** persistent database (`parking.db`, created on first run)
- **bcrypt** password hashing (passwords never stored in plain text)
- **JWT** session tokens (HS256) — issued on login/signup, sent as
  `Authorization: Bearer <token>` from the frontend
- **CORS** enabled for the Vite dev server
- **No payment data is ever stored.** Only the generated e-receipt number,
  amount, and the high-level method label (`Card` / `UPI` / `Net Banking`)
  are persisted.

## Tables

- `users` (id, name, email UNIQUE, password_hash, role, created_at)
- `slots` (id, number, level, status, rate, vehicle_number)
- `bookings` (id, user_id, slot_id, slot_number, vehicle_number, date,
  start_time, end_time, amount, status, payment_method, receipt_number,
  created_at)
- `vehicle_logs` (id, vehicle_number, slot_id, type, timestamp)
- `notifications` (id, user_id, message, type, booking_id, read, created_at)
- `feedback` (id, name, email, message, created_at)

## Run it

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will start on `http://localhost:5000`. The frontend (running on
Vite at `http://localhost:8080` or `5173`) will detect it automatically.

Default admin account is created on first run:
- **email:** `admin@parking.com`
- **password:** `admin123`

## Configuration

Set environment variables (optional):

- `JWT_SECRET` — secret used to sign JWTs (defaults to a dev value; **change in production**)
- `DB_PATH` — SQLite database path (defaults to `./parking.db`)
- `CORS_ORIGINS` — comma-separated list (defaults to `*`)

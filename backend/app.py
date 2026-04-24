"""
Smart Parking — Flask + SQLite backend.

- Passwords are hashed with bcrypt.
- JWT (HS256) is used for session tokens; sent by the frontend as
  Authorization: Bearer <token>.
- Card numbers, CVV, UPI IDs, and bank passwords are NEVER persisted.
  Only the receipt number, amount, and high-level payment method label
  are stored on bookings.
"""

from __future__ import annotations

import os
import re
import sqlite3
import secrets
import datetime as dt
from functools import wraps
from typing import Any

import bcrypt
import jwt
from flask import Flask, g, jsonify, request
from flask_cors import CORS


# ─── Config ───────────────────────────────────────────────────────────────
DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "parking.db"))
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")


app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": CORS_ORIGINS}},
    supports_credentials=True,
)


# ─── Database helpers ────────────────────────────────────────────────────
def get_db() -> sqlite3.Connection:
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db


@app.teardown_appcontext
def close_db(_exc: Any) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL DEFAULT 'user',
            created_at    TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS slots (
            id             TEXT PRIMARY KEY,
            number         TEXT NOT NULL,
            level          INTEGER NOT NULL,
            status         TEXT NOT NULL,
            rate           REAL NOT NULL,
            vehicle_number TEXT
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            slot_id         TEXT NOT NULL,
            slot_number     TEXT NOT NULL,
            vehicle_number  TEXT NOT NULL,
            date            TEXT NOT NULL,
            start_time      TEXT NOT NULL,
            end_time        TEXT NOT NULL,
            amount          REAL NOT NULL,
            status          TEXT NOT NULL,
            payment_method  TEXT,
            receipt_number  TEXT,
            created_at      TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vehicle_logs (
            id              TEXT PRIMARY KEY,
            vehicle_number  TEXT NOT NULL,
            slot_id         TEXT NOT NULL,
            type            TEXT NOT NULL,
            timestamp       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            message     TEXT NOT NULL,
            type        TEXT NOT NULL,
            booking_id  TEXT,
            read        INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            email      TEXT NOT NULL,
            message    TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )

    # Seed default admin account
    cur.execute("SELECT 1 FROM users WHERE email = ?", ("admin@parking.com",))
    if not cur.fetchone():
        admin_hash = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8")
        cur.execute(
            "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin-1", "Admin", "admin@parking.com", admin_hash, "admin", now_iso()),
        )

    # Seed default slots
    cur.execute("SELECT COUNT(*) AS c FROM slots")
    if cur.fetchone()["c"] == 0:
        for i in range(30):
            sid = f"slot-{i + 1}"
            number = f"{chr(65 + i // 10)}{(i % 10) + 1}"
            level = i // 10 + 1
            status = "available" if i < 20 else ("occupied" if i < 25 else "reserved")
            vehicle = f"VH-{1000 + i}" if 20 <= i < 25 else None
            cur.execute(
                "INSERT INTO slots (id, number, level, status, rate, vehicle_number) VALUES (?, ?, ?, ?, ?, ?)",
                (sid, number, level, status, 2.0, vehicle),
            )

    conn.commit()
    conn.close()


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


# ─── Validation ──────────────────────────────────────────────────────────
EMAIL_RE = re.compile(r"^[^\s@]+@gmail\.com$")
PASSWORD_RE = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$"
)


def validate_signup(name: str, email: str, password: str) -> str | None:
    if not name or len(name.strip()) < 2 or len(name) > 50:
        return "Name must be 2-50 characters"
    if not email or not EMAIL_RE.match(email):
        return "Invalid email"
    if not PASSWORD_RE.match(password):
        return "Password must be 8+ chars with upper, lower, number, and special character"
    return None


# ─── JWT helpers ─────────────────────────────────────────────────────────
def issue_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(dt.datetime.now(dt.timezone.utc).timestamp()),
        "exp": int(dt.datetime.now(dt.timezone.utc).timestamp()) + JWT_TTL_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
        if not token:
            return jsonify({"error": "Missing token"}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            request.user_id = payload["sub"]
            request.user_role = payload.get("role", "user")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    @auth_required
    def wrapper(*args, **kwargs):
        if getattr(request, "user_role", "user") != "admin":
            return jsonify({"error": "Admin only"}), 403
        return fn(*args, **kwargs)

    return wrapper


def user_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
    }


# ─── Routes: Health / Auth ───────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"ok": True, "ts": now_iso()}


@app.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    err = validate_signup(name, email, password)
    if err:
        return jsonify({"error": err}), 400

    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return jsonify({"error": "Email already exists"}), 409

    user_id = f"user-{secrets.token_hex(6)}"
    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.execute(
        "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, name, email, pw_hash, "user", now_iso()),
    )
    db.commit()
    token = issue_token(user_id, "user")
    return jsonify({"id": user_id, "name": name, "email": email, "role": "user", "token": token})


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not bcrypt.checkpw(password.encode("utf-8"), row["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    token = issue_token(row["id"], row["role"])
    return jsonify({**user_to_dict(row), "token": token})


@app.get("/api/me")
@auth_required
def me():
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (request.user_id,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(user_to_dict(row))


# ─── Routes: Slots ───────────────────────────────────────────────────────
def slot_to_dict(row: sqlite3.Row) -> dict:
    d = {
        "id": row["id"],
        "number": row["number"],
        "level": row["level"],
        "status": row["status"],
        "rate": row["rate"],
    }
    if row["vehicle_number"]:
        d["vehicleNumber"] = row["vehicle_number"]
    return d


@app.get("/api/slots")
def get_slots():
    db = get_db()
    rows = db.execute("SELECT * FROM slots ORDER BY id").fetchall()
    return jsonify([slot_to_dict(r) for r in rows])


@app.post("/api/update-slot")
@auth_required
def update_slot():
    data = request.get_json(silent=True) or {}
    slot_id = data.get("slotId")
    status = data.get("status")
    vehicle = data.get("vehicleNumber")
    if not slot_id or status not in ("available", "occupied", "reserved"):
        return jsonify({"error": "Invalid payload"}), 400
    db = get_db()
    db.execute(
        "UPDATE slots SET status = ?, vehicle_number = ? WHERE id = ?",
        (status, vehicle, slot_id),
    )
    db.commit()
    return {"ok": True}


# ─── Routes: Bookings ────────────────────────────────────────────────────
def booking_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "slotId": row["slot_id"],
        "slotNumber": row["slot_number"],
        "vehicleNumber": row["vehicle_number"],
        "date": row["date"],
        "startTime": row["start_time"],
        "endTime": row["end_time"],
        "amount": row["amount"],
        "status": row["status"],
        "paymentMethod": row["payment_method"],
        "receiptNumber": row["receipt_number"],
        "createdAt": row["created_at"],
    }


def generate_receipt_number() -> str:
    return "RC-" + secrets.token_hex(4).upper() + "-" + secrets.token_hex(2).upper()


@app.post("/api/book-slot")
@auth_required
def book_slot():
    data = request.get_json(silent=True) or {}
    required = ["userId", "slotId", "slotNumber", "vehicleNumber", "date", "startTime", "endTime", "amount"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required booking fields"}), 400

    booking_id = data.get("id") or f"booking-{secrets.token_hex(6)}"
    receipt_no = data.get("receiptNumber") or generate_receipt_number()

    db = get_db()
    db.execute(
        """INSERT OR REPLACE INTO bookings
           (id, user_id, slot_id, slot_number, vehicle_number, date, start_time, end_time,
            amount, status, payment_method, receipt_number, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            booking_id,
            data["userId"],
            data["slotId"],
            data["slotNumber"],
            data["vehicleNumber"],
            data["date"],
            data["startTime"],
            data["endTime"],
            float(data["amount"]),
            data.get("status", "confirmed"),
            data.get("paymentMethod"),
            receipt_no,
            now_iso(),
        ),
    )
    db.execute(
        "UPDATE slots SET status = ?, vehicle_number = ? WHERE id = ?",
        ("reserved", data["vehicleNumber"], data["slotId"]),
    )
    db.commit()
    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    return jsonify(booking_to_dict(row))


@app.get("/api/bookings")
@auth_required
def list_bookings():
    user_id = request.args.get("userId")
    db = get_db()
    if user_id:
        rows = db.execute("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    else:
        rows = db.execute("SELECT * FROM bookings ORDER BY created_at DESC").fetchall()
    return jsonify([booking_to_dict(r) for r in rows])


@app.get("/api/active-booking")
@auth_required
def active_bookings():
    user_id = request.args.get("userId") or request.user_id
    db = get_db()
    rows = db.execute(
        "SELECT * FROM bookings WHERE user_id = ? AND status = 'confirmed' ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return jsonify([booking_to_dict(r) for r in rows])


@app.post("/api/extend-booking")
@auth_required
def extend_booking():
    data = request.get_json(silent=True) or {}
    booking_id = data.get("bookingId")
    new_end = data.get("newEndTime")
    additional = float(data.get("additionalAmount") or 0)
    if not booking_id or not new_end:
        return jsonify({"error": "bookingId and newEndTime required"}), 400
    db = get_db()
    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not row:
        return jsonify({"error": "Booking not found"}), 404
    db.execute(
        "UPDATE bookings SET end_time = ?, amount = amount + ?, status = 'confirmed' WHERE id = ?",
        (new_end, additional, booking_id),
    )
    # Log extension as an entry-style event for admin visibility
    db.execute(
        "INSERT INTO vehicle_logs (id, vehicle_number, slot_id, type, timestamp) VALUES (?, ?, ?, ?, ?)",
        (f"log-{secrets.token_hex(4)}", row["vehicle_number"], row["slot_id"], "entry", now_iso()),
    )
    db.commit()
    return {"ok": True}


# ─── Routes: Vehicle logs ────────────────────────────────────────────────
@app.post("/api/vehicle-log")
@auth_required
def vehicle_log():
    data = request.get_json(silent=True) or {}
    vehicle = data.get("vehicleNumber")
    slot_id = data.get("slotId")
    log_type = data.get("type")
    if not vehicle or not slot_id or log_type not in ("entry", "exit"):
        return jsonify({"error": "Invalid payload"}), 400
    db = get_db()
    db.execute(
        "INSERT INTO vehicle_logs (id, vehicle_number, slot_id, type, timestamp) VALUES (?, ?, ?, ?, ?)",
        (f"log-{secrets.token_hex(4)}", vehicle, slot_id, log_type, now_iso()),
    )
    db.commit()
    return {"ok": True}


@app.get("/api/vehicle-logs")
@admin_required
def get_vehicle_logs():
    db = get_db()
    rows = db.execute("SELECT * FROM vehicle_logs ORDER BY timestamp DESC LIMIT 500").fetchall()
    return jsonify([
        {
            "id": r["id"],
            "vehicleNumber": r["vehicle_number"],
            "slotId": r["slot_id"],
            "type": r["type"],
            "timestamp": r["timestamp"],
        }
        for r in rows
    ])


# ─── Routes: Notifications ───────────────────────────────────────────────
@app.get("/api/notifications")
@auth_required
def get_notifications():
    user_id = request.args.get("userId") or request.user_id
    db = get_db()
    rows = db.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    return jsonify([
        {
            "id": r["id"],
            "userId": r["user_id"],
            "message": r["message"],
            "type": r["type"],
            "bookingId": r["booking_id"],
            "read": bool(r["read"]),
            "createdAt": r["created_at"],
        }
        for r in rows
    ])


@app.post("/api/notifications/read")
@auth_required
def mark_notification_read():
    data = request.get_json(silent=True) or {}
    notif_id = data.get("notifId")
    if not notif_id:
        return jsonify({"error": "notifId required"}), 400
    db = get_db()
    db.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
    db.commit()
    return {"ok": True}


# ─── Routes: Feedback ────────────────────────────────────────────────────
@app.post("/api/feedback")
def submit_feedback():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    message = (data.get("message") or "").strip()
    if not name or not email or not message:
        return jsonify({"error": "All fields are required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email"}), 400
    if len(message) > 2000:
        return jsonify({"error": "Message too long"}), 400
    db = get_db()
    fid = f"fb-{secrets.token_hex(4)}"
    db.execute(
        "INSERT INTO feedback (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)",
        (fid, name, email, message, now_iso()),
    )
    db.commit()
    return {"ok": True, "id": fid}


@app.get("/api/feedback")
@admin_required
def list_feedback():
    db = get_db()
    rows = db.execute("SELECT * FROM feedback ORDER BY created_at DESC").fetchall()
    return jsonify([
        {"id": r["id"], "name": r["name"], "email": r["email"], "message": r["message"], "createdAt": r["created_at"]}
        for r in rows
    ])


# ─── Routes: Users (admin) ───────────────────────────────────────────────
@app.get("/api/users")
@admin_required
def list_users():
    db = get_db()
    rows = db.execute("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC").fetchall()
    return jsonify([
        {"id": r["id"], "name": r["name"], "email": r["email"], "role": r["role"], "createdAt": r["created_at"]}
        for r in rows
    ])


# ─── Entry point ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)

# 🚗 Smart Parking Management System

A full-stack **Smart Parking Management System** that enables users to view parking availability, reserve slots, and manage bookings efficiently. The system provides real-time updates, reservation handling, and administrative control for better parking management.

---

## 📌 Features

### 👤 User Side

* Real-time parking slot availability
  (🟢 Available | 🔴 Occupied | 🔵 Reserved)
* Slot booking with time selection
* Reservation system (reserved → occupied → available)
* E-receipt generation after booking
* Notifications for booking confirmation and expiry
* Input validation (vehicle number, required fields)

---

### 🛠️ Admin Side

* View and manage all parking slots
* Update slot status manually (occupied → available)
* View booking details (vehicle, time, duration, payment)
* Daily vehicle logs
* Monthly analytics (booking trends, usage, revenue)

---

### 🎨 UI/UX

* Modern responsive interface
* Smooth animations and transitions
* Structured navigation (Home, About, Feedback, Login/Signup)
* Clean layout with improved user experience

---

## ⚙️ Tech Stack

### Frontend

* **React (TypeScript)**
* **Tailwind CSS**

### Backend

* **Flask (Python)**
* **SQLite**
---

---

## 🚀 Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

### Frontend

```bash
npm install
npm run dev
```

---

## 🔐 Key Functional Flow

* User selects a parking slot
* Booking request is processed by backend
* Data is stored in database
* Slot status updates dynamically
* Booking expiry automatically frees the slot
* Admin can monitor and update system

---

## 📈 Future Enhancements

* Payment gateway integration
* Cloud database deployment
* Mobile application support
* Advanced authentication system

---

## 👨‍💻 Author

**Rinkita Ramrakhiyani**





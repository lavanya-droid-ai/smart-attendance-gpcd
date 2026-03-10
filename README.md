# Smart Hybrid Attendance System — GPCD

A real-time, multi-modal attendance management system built for **Govt. Physiotherapy College (GPCD)**, designed to streamline attendance tracking across the Bachelor of Physiotherapy (BPT) program using a three-tier verification model: **BLE proximity**, **NFC tap**, and **manual marking**.

**Domain:** `sybpt.gpcd.edu.in`

---

## Overview

The system replaces traditional paper-based attendance with a smart hybrid approach. Teachers start sessions from a dashboard; students mark attendance via Bluetooth Low Energy (BLE) proximity detection or NFC tap. Teachers can also manually mark attendance or override records. Parents receive real-time visibility into their ward's attendance. Admins manage users, classes, and view institution-wide analytics.

All attendance events stream in real-time via WebSockets, giving teachers a live classroom view.

---

## Tech Stack

| Layer | Technology |
|------------|-------------------------------------------|
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| Real-time | Socket.io |
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| HTTP | Axios |
| Icons | Lucide React |
| Date Utils | date-fns |

---

## Features

### Admin
- Dashboard with institution-wide statistics
- User management (create, update, activate/deactivate)
- Class management with student enrollment
- Attendance analytics and trend visualization
- Audit log monitoring

### Teacher
- Start and end attendance sessions
- Live attendance view with real-time updates via WebSocket
- Manual attendance marking and bulk operations
- Daily reports and class-wise reports
- Export attendance data to CSV

### Student
- Mark attendance via BLE proximity or NFC tap
- View personal attendance history and today's status
- Attendance statistics and trends

### Parent
- View ward's attendance dashboard
- Calendar view of attendance
- Summary and alerts

---

## Project Structure

```
smart-attendance/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js        # Roles, years, enums
│   │   │   └── db.js               # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── parentController.js
│   │   │   ├── studentController.js
│   │   │   └── teacherController.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT authentication
│   │   │   └── rbac.js             # Role-based access control
│   │   ├── models/
│   │   │   ├── Attendance.js
│   │   │   ├── AuditLog.js
│   │   │   ├── Class.js
│   │   │   ├── Session.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── parent.js
│   │   │   ├── student.js
│   │   │   └── teacher.js
│   │   ├── utils/
│   │   │   └── tokenGenerator.js   # BLE/NFC/session tokens
│   │   ├── app.js                  # Express app setup
│   │   ├── seed.js                 # Database seed script
│   │   └── server.js               # HTTP + Socket.io server
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DataTable.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatsCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── Classes.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Users.jsx
│   │   │   ├── parent/
│   │   │   │   ├── Attendance.jsx
│   │   │   │   ├── Calendar.jsx
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── student/
│   │   │   │   ├── Attendance.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Stats.jsx
│   │   │   ├── teacher/
│   │   │   │   ├── DailyReport.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── LiveAttendance.jsx
│   │   │   │   ├── Reports.jsx
│   │   │   │   └── Sessions.jsx
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── .gitignore
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB Atlas** account (or local MongoDB 6+)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-attendance
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (or edit the existing one) with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/smart_attendance?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
BLE_TOKEN_EXPIRY=3600
NFC_TOKEN_EXPIRY=3600
CORS_ORIGIN=http://localhost:3000
```

| Variable | Description |
|---------------------|-----------------------------------------------|
| `PORT` | API server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g., `7d`, `24h`) |
| `BLE_TOKEN_EXPIRY` | BLE token TTL in seconds (default: 3600) |
| `NFC_TOKEN_EXPIRY` | NFC token TTL in seconds (default: 3600) |
| `CORS_ORIGIN` | Allowed frontend origin for CORS |

Seed the database with demo data:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Demo Credentials

| Role | Email | Password |
|---------|----------------------------------------|------------|
| Admin | `admin@gpcd.edu.in` | `admin123` |
| Teacher | `rajesh.sharma@gpcd.edu.in` | `teacher123` |
| Teacher | `priya.patel@gpcd.edu.in` | `teacher123` |
| Student | `bpt25001@student.gpcd.edu.in` | `student123` |
| Parent | *(see seed output for exact emails)* | `parent123` |

---

## API Documentation

Base URL: `http://localhost:5000/api`

### Health Check

| Method | Endpoint | Description |
|--------|----------------|-------------------------|
| GET | `/health` | API health status |

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------------------|-------------------------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT |
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update profile |
| PUT | `/change-password` | Change password |

### Admin (`/api/admin`) — requires `admin` role

| Method | Endpoint | Description |
|--------|--------------------------------------|-------------------------------|
| GET | `/dashboard` | Admin dashboard stats |
| GET | `/users` | List all users |
| POST | `/users` | Create a user |
| PUT | `/users/:id` | Update a user |
| PATCH | `/users/:id/toggle-status` | Activate / deactivate user |
| GET | `/classes` | List all classes |
| POST | `/classes` | Create a class |
| PUT | `/classes/:id` | Update a class |
| POST | `/classes/:id/enroll` | Enroll students in a class |
| DELETE | `/classes/:id/students/:studentId` | Remove student from class |
| GET | `/analytics` | Institution analytics |

### Teacher (`/api/teacher`) — requires `teacher` or `admin` role

| Method | Endpoint | Description |
|--------|-----------------------------------------------|-------------------------------|
| GET | `/dashboard` | Teacher dashboard |
| GET | `/daily-report` | Today's report |
| GET | `/classes` | Teacher's assigned classes |
| GET | `/classes/:classId/report` | Class attendance report |
| GET | `/classes/:classId/export` | Export attendance CSV |
| POST | `/sessions` | Start a new session |
| PATCH | `/sessions/:sessionId/end` | End a session |
| GET | `/sessions/:sessionId/attendance` | Session attendance list |
| GET | `/sessions/:sessionId/live` | Live attendance feed |
| GET | `/sessions/:sessionId/absent` | Absent students list |
| POST | `/sessions/:sessionId/attendance` | Mark manual attendance |
| POST | `/sessions/:sessionId/attendance/bulk` | Bulk mark attendance |

### Student (`/api/student`) — requires `student` role

| Method | Endpoint | Description |
|--------|--------------------------|-------------------------------|
| GET | `/dashboard` | Student dashboard |
| POST | `/attendance/ble` | Mark via BLE token |
| POST | `/attendance/nfc` | Mark via NFC token |
| GET | `/attendance` | Attendance history |
| GET | `/attendance/today` | Today's attendance status |
| GET | `/attendance/stats` | Attendance statistics |

### Parent (`/api/parent`) — requires `parent` role

| Method | Endpoint | Description |
|--------|----------------------|-------------------------------|
| GET | `/dashboard` | Parent dashboard |
| GET | `/ward/attendance` | Ward's attendance records |
| GET | `/ward/calendar` | Calendar view |
| GET | `/ward/summary` | Attendance summary |

---

## Real-time Events (Socket.io)

| Event | Direction | Description |
|----------------------|-----------|--------------------------------------|
| `session:join` | Client → | Join a session room |
| `session:leave` | Client → | Leave a session room |
| `session:started` | → Client | Session has been started |
| `session:ended` | → Client | Session has been ended |
| `attendance:marked` | → Client | A student marked attendance |
| `attendance:update` | → Client | Attendance record updated |

---

## Deployment

### Production Build (Frontend)

```bash
cd frontend
npm run build
```

The `dist/` folder contains the static build, ready to be served by Nginx, Vercel, or any static host.

### Production Server (Backend)

```bash
cd backend
NODE_ENV=production node src/server.js
```

**Production checklist:**

- Set `NODE_ENV=production`
- Use a strong, unique `JWT_SECRET`
- Restrict `CORS_ORIGIN` to the deployed frontend URL
- Use MongoDB Atlas with IP whitelisting and strong credentials
- Run behind a reverse proxy (Nginx) with HTTPS
- Set up PM2 or similar for process management
- Configure rate limiting thresholds for production traffic

---

## Future Enhancements

- **React Native mobile apps** for student BLE/NFC attendance on-the-go
- **Push notifications** for low attendance alerts to students and parents
- **Biometric integration** (fingerprint / face recognition) as a fourth tier
- **Geofencing** to restrict attendance marking to campus boundaries
- **LMS integration** to sync attendance with learning management platforms
- **SMS/WhatsApp alerts** for parents on daily attendance
- **Advanced analytics** with predictive attendance models
- **Multi-department support** for scaling across the institution

---

## License

This project is developed for **Govt. Physiotherapy College (GPCD)** as part of the BPT program's digital infrastructure initiative.

# Smart Attendance System – Project Summary
## Govt. Physiotherapy College (GPCD)

**Prepared on:** March 10, 2026
**Domain:** sybpt.gpcd.edu.in

---

## What Is This System?

The Smart Attendance System is a digital solution that replaces paper-based attendance with a modern, automated approach. It is designed specifically for the BPT (Bachelor of Physiotherapy) program at Govt. Physiotherapy College.

The system has **three ways** to mark student attendance:

1. **Bluetooth (BLE) – Automatic** → The teacher's phone broadcasts a signal, and students' phones automatically detect it and mark attendance (coming in Phase 2 – mobile app)
2. **NFC Tap – Backup** → If Bluetooth fails, the student can tap their phone against the teacher's device (coming in Phase 2 – mobile app)
3. **Manual – Failsafe** → The teacher can always mark any student present directly from the system

---

## What Has Been Built So Far (Phase 1)

Phase 1 is a **fully working web application** that covers all the core features. It runs in any web browser (Chrome, Safari, Edge, etc.) on any device – phone, tablet, or computer.

### For the Administrator (College Office)

- **Dashboard** showing total students, teachers, active sessions, and attendance rates at a glance
- **User Management** – Add, edit, activate, or deactivate accounts for teachers, students, and parents
- **Class Management** – Create classes (Anatomy, Physiology, etc.), assign teachers, and enroll students
- **Analytics** – View attendance statistics broken down by year (First Year BPT through Final Year BPT)

### For Teachers

- **Start a Class Session** – The teacher selects their class and clicks "Start Session." The system generates unique security tokens for that session
- **Live Attendance View** – A real-time screen showing which students have marked attendance, who is still pending, and the running count
- **Manual Marking** – If a student's phone is not working, the teacher can mark them present with one click
- **Bulk Marking** – Mark multiple remaining students at once if needed
- **Reports** – View attendance history for any class, see each student's percentage, and identify students with low attendance
- **Export to CSV/Excel** – Download attendance data as a spreadsheet for records

### For Students

- **Mark Attendance** – In the current web version, students enter a session token (displayed in the classroom) to mark their presence. In the upcoming mobile app, this will happen automatically via Bluetooth
- **View Attendance History** – See all past attendance records with dates, classes, and status
- **Attendance Statistics** – View overall attendance percentage per class, with warnings if attendance drops below 75%

### For Parents

- **Ward's Dashboard** – See your child's attendance status for today
- **Attendance Calendar** – A monthly calendar view showing which days your child was present, absent, or late
- **Summary Reports** – Monthly attendance percentage and class-wise breakdown

### Security Features Already Built

- Secure login with email and password for every user
- Role-based access (admin, teacher, student, parent – each sees only what they should)
- Unique, time-limited session tokens that expire after class ends
- Duplicate prevention – a student cannot mark attendance twice for the same session
- Complete audit trail – every action is logged

---

## How Attendance Works Right Now (Phase 1 – Web Version)

Since we don't have mobile apps yet, the Bluetooth and NFC features are simulated through manual token entry. Here's the current flow:

### Step-by-Step Process

1. **Teacher logs in** → Goes to "Sessions" → Selects class → Clicks "Start Session"
2. **System generates two tokens** → A BLE token and an NFC token are displayed on the teacher's screen
3. **Teacher displays or shares the token** → Can project it on the classroom screen, write it on the whiteboard, or share verbally
4. **Student logs in** → Sees the token input field on their dashboard → Types the token → Clicks "Mark"
5. **System validates** → Checks if the token is correct, session is active, and student hasn't already marked → Records attendance
6. **Teacher sees live updates** → The Live Attendance screen shows students appearing as they mark
7. **Teacher ends session** → Clicks "End Session" when class is over → Final attendance is recorded

### What the Teacher Needs to Do

- Log in to the system before class
- Start a session (takes 5 seconds)
- Display the token for students
- Monitor live attendance during class
- Mark any remaining students manually if needed
- End the session after class

### What the Student Needs to Do

- Log in to the system
- Enter the token displayed in the classroom
- Click "Mark" – done

---

## Demo Data Already Loaded

The system comes pre-loaded with sample data for testing:

| What | How Many |
|------|----------|
| Admin Account | 1 |
| Teachers | 8 (2 per year, covering Anatomy, Physiology, Biomechanics, Exercise Therapy, Electrotherapy, Orthopedics, Rehabilitation, Neurology) |
| Students | 80 (20 per year × 4 years) |
| Parent Accounts | 10 (linked to specific students) |
| Classes | 8 (2 subjects per year) |
| Sample Sessions | 5 (with pre-filled attendance for testing) |

### Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gpcd.edu.in | admin123 |
| Teacher | rajesh.sharma@gpcd.edu.in | teacher123 |
| Student | bpt25001@student.gpcd.edu.in | student123 |
| Parent | (see system for exact emails) | parent123 |

All 8 teachers use password `teacher123`. All students use `student123`. All parents use `parent123`.

---

## What to Test Right Now

### Test 1: Admin Dashboard
1. Log in as **admin@gpcd.edu.in** / **admin123**
2. Check the dashboard – you should see 80 students, 8 teachers
3. Go to "Users" – browse through teachers, students, parents
4. Go to "Classes" – see 8 classes with enrolled students
5. Go to "Analytics" – see year-wise attendance stats

### Test 2: Full Attendance Flow (Most Important)
1. Open **two browser windows** (or use a private/incognito window for the second)
2. **Window 1 – Teacher:** Log in as `rajesh.sharma@gpcd.edu.in` / `teacher123`
   - Go to "Sessions"
   - Select a class (e.g., "Anatomy - First Year BPT")
   - Click "Start Session"
   - Click "View Live" on the active session
   - Note the BLE Token or NFC Token shown on screen
3. **Window 2 – Student:** Log in as `bpt25001@student.gpcd.edu.in` / `student123`
   - On the dashboard, find the "Mark Attendance" section
   - Type the BLE token from the teacher's screen into the "BLE Session Token" field
   - Click "Mark"
4. **Back on Window 1 (Teacher):** The student should now appear in the live attendance list
5. Teacher can also click "Mark Present" for absent students manually
6. Click "End Session" when done

### Test 3: Student View
1. Log in as a student
2. Check "Attendance" page – see history of past attendance
3. Check "Statistics" – see attendance percentage per class

### Test 4: Parent View
1. Log in as a parent
2. See your ward's attendance status
3. Check the "Calendar" page for monthly view

### Test 5: Reports (Teacher)
1. Log in as a teacher
2. Go to "Reports"
3. Select a class and date range
4. View student-wise attendance percentages
5. Try the "Export CSV" button to download data

---

## What Comes Next (Phase 2 – Mobile App)

Phase 2 transforms the manual token process into a fully automatic experience using mobile phones.

### What Changes for Teachers

- **Install the app** on their iPhone or Android phone
- **Start a session** from the app (same as now, but on mobile)
- **Phone automatically broadcasts a Bluetooth signal** – no need to display tokens
- Students within 5-15 meters of the teacher's phone get marked automatically
- Everything else stays the same – live view, manual override, reports

### What Changes for Students

- **Install the app** on their Android phone
- **Do nothing** – the app runs in the background
- When the student walks into the classroom and is near the teacher's phone, attendance is marked automatically
- If Bluetooth doesn't work, they can tap their phone on the teacher's phone (NFC)
- If both fail, the teacher marks them manually

### What Changes for Parents

- Same web dashboard, plus optional push notifications ("Your child was marked present in Anatomy class at 10:05 AM")

### What's Needed for Phase 2

| Requirement | Status |
|-------------|--------|
| Google Play Console account (for Android app) | Not yet created |
| Apple Developer Account (for iOS app, if needed) | Not yet created |
| Android phones for students | Students already have Android |
| iPhone for the professor | Already available |

### Additional Features Planned for Future

- Push notifications to parents when attendance is marked
- Alerts when a student's attendance drops below 75%
- Face recognition as an additional verification method
- Integration with the college's existing LMS (Learning Management System)
- Multi-campus support if the college expands

---

## Technical Summary (For IT Team Reference)

- **Backend:** Node.js + Express running on port 5000
- **Frontend:** React web application running on port 3000
- **Database:** MongoDB Atlas (cloud-hosted)
- **Real-time updates:** Socket.io for live attendance tracking
- **Security:** JWT authentication, role-based access, encrypted passwords, rate limiting
- **Scalable:** Designed to handle 1,000+ students

---

## Current Status

| Component | Status |
|-----------|--------|
| Backend API (40+ endpoints) | Complete |
| Admin Web Dashboard | Complete |
| Teacher Web Dashboard | Complete |
| Student Web Dashboard | Complete |
| Parent Web Dashboard | Complete |
| Database with Demo Data | Complete |
| Security & Authentication | Complete |
| Real-time Live Attendance | Complete |
| CSV/Excel Export | Complete |
| Mobile App (BLE/NFC) | Phase 2 – Pending |
| Deployment to sybpt.gpcd.edu.in | Pending |

---

*For any questions or feedback, please test the system and note down what works, what doesn't, and any changes you'd like to see before we proceed to Phase 2.*

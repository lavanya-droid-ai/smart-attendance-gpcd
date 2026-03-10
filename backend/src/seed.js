require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Class = require('./models/Class');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');
const AuditLog = require('./models/AuditLog');
const {
  ROLES,
  YEARS,
  ALL_YEARS,
  DEPARTMENT,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS,
  SESSION_STATUS,
  DAYS_OF_WEEK,
} = require('./config/constants');

// ─── Helpers ────────────────────────────────────────────────────────────────

const log = (icon, msg) => console.log(`  ${icon}  ${msg}`);

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const dateNDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildTime = (baseDate, hour, minute = 0) => {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ─── Data Definitions ───────────────────────────────────────────────────────

const ADMIN_DATA = {
  name: 'Admin GPCD',
  email: 'admin@gpcd.edu.in',
  password: 'admin123',
  role: ROLES.ADMIN,
  department: DEPARTMENT,
  employeeId: 'ADM/001',
  phone: '9876543210',
};

const TEACHERS_DATA = [
  { name: 'Dr. Rajesh Sharma', subject: 'Anatomy', year: YEARS.FIRST, code: 'ANAT-1Y', empId: 'TCH/001', phone: '9876543211' },
  { name: 'Dr. Priya Patel', subject: 'Physiology', year: YEARS.FIRST, code: 'PHYS-1Y', empId: 'TCH/002', phone: '9876543212' },
  { name: 'Dr. Amit Kumar', subject: 'Biomechanics', year: YEARS.SECOND, code: 'BIOM-2Y', empId: 'TCH/003', phone: '9876543213' },
  { name: 'Dr. Neha Singh', subject: 'Exercise Therapy', year: YEARS.SECOND, code: 'EXTH-2Y', empId: 'TCH/004', phone: '9876543214' },
  { name: 'Dr. Suresh Reddy', subject: 'Electrotherapy', year: YEARS.THIRD, code: 'ELTH-3Y', empId: 'TCH/005', phone: '9876543215' },
  { name: 'Dr. Anjali Desai', subject: 'Orthopedics', year: YEARS.THIRD, code: 'ORTH-3Y', empId: 'TCH/006', phone: '9876543216' },
  { name: 'Dr. Vikram Joshi', subject: 'Rehabilitation', year: YEARS.FINAL, code: 'REHB-4Y', empId: 'TCH/007', phone: '9876543217' },
  { name: 'Dr. Meera Iyer', subject: 'Neurology', year: YEARS.FINAL, code: 'NEUR-4Y', empId: 'TCH/008', phone: '9876543218' },
];

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan',
  'Sai', 'Karthik', 'Ishaan', 'Manish', 'Pranav',
  'Harsh', 'Dhruv', 'Nikhil', 'Raghav', 'Kunal',
  'Shreyas', 'Yash', 'Varun', 'Tanmay', 'Omkar',
  'Ankit', 'Ritesh', 'Siddharth', 'Akash', 'Gaurav',
  'Piyush', 'Tushar', 'Vishal', 'Rahul', 'Abhishek',
  'Tejas', 'Sahil', 'Shubham', 'Mayank', 'Ajay',
  'Neeraj', 'Ravi', 'Deepak', 'Sunil', 'Hemant',
];

const FIRST_NAMES_FEMALE = [
  'Ananya', 'Diya', 'Saanvi', 'Isha', 'Pooja',
  'Sneha', 'Kavya', 'Priyanka', 'Nandini', 'Shruti',
  'Megha', 'Neha', 'Riya', 'Trisha', 'Jhanvi',
  'Sakshi', 'Tanvi', 'Aishwarya', 'Pallavi', 'Divya',
  'Nikita', 'Aparna', 'Swati', 'Komal', 'Bhavna',
  'Anjali', 'Shalini', 'Mrudula', 'Rashmi', 'Gauri',
  'Simran', 'Khushi', 'Tanya', 'Mansi', 'Preeti',
  'Sonali', 'Ankita', 'Chitra', 'Varsha', 'Deepa',
];

const LAST_NAMES = [
  'Patil', 'Deshmukh', 'Kulkarni', 'Joshi', 'Sharma',
  'Verma', 'Gupta', 'Singh', 'Reddy', 'Nair',
  'Pillai', 'Menon', 'Iyer', 'Rao', 'Mukherjee',
  'Chatterjee', 'Banerjee', 'Deshpande', 'Kadam', 'More',
  'Pawar', 'Chavan', 'Jadhav', 'Shinde', 'Gaikwad',
  'Thakur', 'Mishra', 'Pandey', 'Tiwari', 'Dubey',
  'Bhat', 'Hegde', 'Shetty', 'Naik', 'Prabhu',
  'Mahajan', 'Bhosale', 'Mane', 'Sawant', 'Kale',
];

const YEAR_ENROLLMENT_CODES = {
  [YEARS.FIRST]: '25',
  [YEARS.SECOND]: '24',
  [YEARS.THIRD]: '23',
  [YEARS.FINAL]: '22',
};

const SCHEDULE_SLOTS = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:15', endTime: '12:15' },
  { startTime: '12:15', endTime: '13:15' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
];

// ─── Generator Functions ────────────────────────────────────────────────────

function teacherEmail(fullName) {
  const parts = fullName.replace(/^Dr\.\s+/, '').split(' ');
  return `${parts[0].toLowerCase()}.${parts[parts.length - 1].toLowerCase()}@gpcd.edu.in`;
}

function generateStudents(year, count = 20) {
  const yearCode = YEAR_ENROLLMENT_CODES[year];
  const students = [];
  const usedNames = new Set();

  for (let i = 1; i <= count; i++) {
    let firstName, lastName;
    do {
      const isFemale = Math.random() > 0.5;
      firstName = isFemale ? randomItem(FIRST_NAMES_FEMALE) : randomItem(FIRST_NAMES_MALE);
      lastName = randomItem(LAST_NAMES);
    } while (usedNames.has(`${firstName}${lastName}`));
    usedNames.add(`${firstName}${lastName}`);

    const rollNum = `BPT/${yearCode}/${String(i).padStart(3, '0')}`;
    const emailRoll = `bpt${yearCode}${String(i).padStart(3, '0')}`;

    students.push({
      name: `${firstName} ${lastName}`,
      email: `${emailRoll}@student.gpcd.edu.in`,
      password: 'student123',
      role: ROLES.STUDENT,
      department: DEPARTMENT,
      year,
      rollNumber: rollNum,
      phone: `${randomInt(6, 9)}${String(randomInt(100000000, 999999999)).padStart(9, '0')}`,
    });
  }

  return students;
}

function buildSchedule(slotIndex) {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slot = SCHEDULE_SLOTS[slotIndex % SCHEDULE_SLOTS.length];
  return weekdays.map((day) => ({
    day,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Smart Attendance System — Database Seeder             ║');
  console.log('║   Govt. Physiotherapy College (GPCD)                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // ── Connect ──────────────────────────────────────────────────────
    await connectDB();
    log('🔗', 'Connected to MongoDB');

    // ── Clear existing data ─────────────────────────────────────────
    console.log('\n  Clearing existing data...');
    await Promise.all([
      Attendance.deleteMany({}),
      Session.deleteMany({}),
      Class.deleteMany({}),
      AuditLog.deleteMany({}),
      User.deleteMany({}),
    ]);
    log('🗑️ ', 'All collections cleared');

    // ── 1. Create Admin ─────────────────────────────────────────────
    console.log('\n  Creating admin user...');
    const admin = await User.create(ADMIN_DATA);
    log('👤', `Admin: ${admin.email}`);

    // ── 2. Create Teachers ──────────────────────────────────────────
    console.log('\n  Creating teachers...');
    const teacherDocs = [];
    for (const t of TEACHERS_DATA) {
      const teacher = await User.create({
        name: t.name,
        email: teacherEmail(t.name),
        password: 'teacher123',
        role: ROLES.TEACHER,
        department: DEPARTMENT,
        employeeId: t.empId,
        phone: t.phone,
      });
      teacherDocs.push({ ...t, doc: teacher });
      log('🧑‍🏫', `${teacher.name} — ${t.subject} (${t.year})`);
    }

    // ── 3. Create Students ──────────────────────────────────────────
    console.log('\n  Creating students (20 per year × 4 years = 80)...');
    const studentsByYear = {};
    for (const year of ALL_YEARS) {
      const batch = generateStudents(year, 20);
      const docs = [];
      for (const s of batch) {
        const doc = await User.create(s);
        docs.push(doc);
      }
      studentsByYear[year] = docs;
      log('🎓', `${year}: ${docs.length} students created`);
    }

    // ── 4. Create Parents ───────────────────────────────────────────
    console.log('\n  Creating parent accounts...');
    const allStudents = ALL_YEARS.flatMap((y) => studentsByYear[y]);
    const parentStudents = allStudents.sort(() => 0.5 - Math.random()).slice(0, 10);
    const parentDocs = [];

    for (let i = 0; i < parentStudents.length; i++) {
      const student = parentStudents[i];
      const firstName = student.name.split(' ')[0].toLowerCase();
      const parent = await User.create({
        name: `Parent of ${student.name}`,
        email: `parent.${firstName}${i + 1}@gpcd.edu.in`,
        password: 'parent123',
        role: ROLES.PARENT,
        department: DEPARTMENT,
        parentOf: student._id,
        phone: `${randomInt(6, 9)}${String(randomInt(100000000, 999999999)).padStart(9, '0')}`,
      });
      parentDocs.push(parent);
      log('👨‍👩‍👧', `${parent.name} → ${student.rollNumber}`);
    }

    // ── 5. Create Classes ───────────────────────────────────────────
    console.log('\n  Creating classes...');
    const classDocs = [];

    for (let i = 0; i < TEACHERS_DATA.length; i++) {
      const t = teacherDocs[i];
      const yearStudents = studentsByYear[t.year] || [];

      const cls = await Class.create({
        name: `${t.subject} - ${t.year} BPT`,
        code: t.code,
        department: DEPARTMENT,
        year: t.year,
        teacher: t.doc._id,
        students: yearStudents.map((s) => s._id),
        schedule: buildSchedule(i),
      });

      classDocs.push(cls);
      log('📚', `${cls.name} (${cls.code}) — ${yearStudents.length} students`);
    }

    // ── 6. Create Sessions & Attendance ─────────────────────────────
    console.log('\n  Creating sessions and attendance records...');

    const completedSessions = [];

    for (let daysAgo = 3; daysAgo >= 1; daysAgo--) {
      const sessionDate = dateNDaysAgo(daysAgo);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sessionDate.getDay()];

      if (dayName === 'Sunday') continue;

      const classForDay = classDocs[randomInt(0, classDocs.length - 1)];
      const scheduleSlot = classForDay.schedule.find((s) => s.day === dayName) || classForDay.schedule[0];

      const [startH, startM] = scheduleSlot.startTime.split(':').map(Number);
      const [endH, endM] = scheduleSlot.endTime.split(':').map(Number);
      const startTime = buildTime(sessionDate, startH, startM);
      const endTime = buildTime(sessionDate, endH, endM);

      const session = await Session.create({
        class: classForDay._id,
        teacher: classForDay.teacher,
        date: sessionDate,
        startTime,
        endTime,
        status: SESSION_STATUS.COMPLETED,
        expiresAt: endTime,
        attendeesCount: 0,
      });

      const yearStudents = studentsByYear[classForDay.year] || [];
      let attendeeCount = 0;

      for (const student of yearStudents) {
        const isAbsent = Math.random() < 0.15;
        if (isAbsent) continue;

        const methodRoll = Math.random();
        let method;
        if (methodRoll < 0.7) method = ATTENDANCE_METHODS.BLE;
        else if (methodRoll < 0.9) method = ATTENDANCE_METHODS.NFC;
        else method = ATTENDANCE_METHODS.MANUAL;

        const isLate = Math.random() < 0.12;
        const minuteOffset = isLate ? randomInt(6, 15) : randomInt(0, 4);
        const markedAt = buildTime(sessionDate, startH, startM + minuteOffset);

        await Attendance.create({
          session: session._id,
          student: student._id,
          class: classForDay._id,
          method,
          markedAt,
          markedBy: method === ATTENDANCE_METHODS.MANUAL ? classForDay.teacher : student._id,
          isLate,
          status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
          deviceId: method !== ATTENDANCE_METHODS.MANUAL ? `DEV-${student.rollNumber}` : null,
        });
        attendeeCount++;
      }

      session.attendeesCount = attendeeCount;
      await session.save();
      completedSessions.push(session);

      log('✅', `Completed session: ${classForDay.name} on ${sessionDate.toDateString()} — ${attendeeCount}/${yearStudents.length} present`);
    }

    // Two more completed sessions on different classes
    for (let extra = 0; extra < 2 && completedSessions.length < 5; extra++) {
      const daysAgo = extra + 1;
      const sessionDate = dateNDaysAgo(daysAgo);
      const classIdx = (completedSessions.length + extra) % classDocs.length;
      const classForDay = classDocs[classIdx];
      const slot = SCHEDULE_SLOTS[(completedSessions.length + extra + 2) % SCHEDULE_SLOTS.length];
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const startTime = buildTime(sessionDate, startH, startM);
      const endTime = buildTime(sessionDate, endH, endM);

      const session = await Session.create({
        class: classForDay._id,
        teacher: classForDay.teacher,
        date: sessionDate,
        startTime,
        endTime,
        status: SESSION_STATUS.COMPLETED,
        expiresAt: endTime,
        attendeesCount: 0,
      });

      const yearStudents = studentsByYear[classForDay.year] || [];
      let attendeeCount = 0;

      for (const student of yearStudents) {
        if (Math.random() < 0.1) continue;

        const methodRoll = Math.random();
        let method;
        if (methodRoll < 0.7) method = ATTENDANCE_METHODS.BLE;
        else if (methodRoll < 0.9) method = ATTENDANCE_METHODS.NFC;
        else method = ATTENDANCE_METHODS.MANUAL;

        const isLate = Math.random() < 0.1;
        const minuteOffset = isLate ? randomInt(6, 12) : randomInt(0, 3);
        const markedAt = buildTime(sessionDate, startH, startM + minuteOffset);

        await Attendance.create({
          session: session._id,
          student: student._id,
          class: classForDay._id,
          method,
          markedAt,
          markedBy: method === ATTENDANCE_METHODS.MANUAL ? classForDay.teacher : student._id,
          isLate,
          status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
          deviceId: method !== ATTENDANCE_METHODS.MANUAL ? `DEV-${student.rollNumber}` : null,
        });
        attendeeCount++;
      }

      session.attendeesCount = attendeeCount;
      await session.save();
      completedSessions.push(session);

      log('✅', `Completed session: ${classForDay.name} on ${sessionDate.toDateString()} — ${attendeeCount}/${yearStudents.length} present`);
    }

    // Active session for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeClass = classDocs[0];
    const activeStart = buildTime(today, 9, 0);
    const activeEnd = buildTime(today, 10, 0);
    const expiresAt = new Date(activeEnd.getTime() + 60 * 60 * 1000);

    const activeSession = await Session.create({
      class: activeClass._id,
      teacher: activeClass.teacher,
      date: today,
      startTime: activeStart,
      endTime: activeEnd,
      status: SESSION_STATUS.ACTIVE,
      expiresAt,
      attendeesCount: 0,
    });

    const activeStudents = studentsByYear[activeClass.year] || [];
    let activeAttendees = 0;
    const halfCount = Math.floor(activeStudents.length * 0.6);

    for (let i = 0; i < halfCount; i++) {
      const student = activeStudents[i];
      const methodRoll = Math.random();
      let method;
      if (methodRoll < 0.7) method = ATTENDANCE_METHODS.BLE;
      else if (methodRoll < 0.9) method = ATTENDANCE_METHODS.NFC;
      else method = ATTENDANCE_METHODS.MANUAL;

      const isLate = Math.random() < 0.1;
      const markedAt = buildTime(today, 9, randomInt(0, 8));

      await Attendance.create({
        session: activeSession._id,
        student: student._id,
        class: activeClass._id,
        method,
        markedAt,
        markedBy: method === ATTENDANCE_METHODS.MANUAL ? activeClass.teacher : student._id,
        isLate,
        status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
        deviceId: method !== ATTENDANCE_METHODS.MANUAL ? `DEV-${student.rollNumber}` : null,
      });
      activeAttendees++;
    }

    activeSession.attendeesCount = activeAttendees;
    await activeSession.save();
    log('🔴', `Active session: ${activeClass.name} — ${activeAttendees}/${activeStudents.length} marked so far`);

    // ── 7. Audit Logs ───────────────────────────────────────────────
    console.log('\n  Creating audit logs...');

    await AuditLog.log({
      action: 'SYSTEM_SEED',
      actor: admin._id,
      target: 'Database',
      details: { message: 'Database seeded with demo data' },
    });

    await AuditLog.log({
      action: 'USER_LOGIN',
      actor: admin._id,
      target: 'Auth',
      details: { email: admin.email, role: 'admin' },
      ipAddress: '127.0.0.1',
    });

    for (const t of teacherDocs.slice(0, 3)) {
      await AuditLog.log({
        action: 'USER_LOGIN',
        actor: t.doc._id,
        target: 'Auth',
        details: { email: t.doc.email, role: 'teacher' },
        ipAddress: '127.0.0.1',
      });
    }

    for (const session of completedSessions.slice(0, 3)) {
      await AuditLog.log({
        action: 'SESSION_STARTED',
        actor: session.teacher,
        target: `Session:${session._id}`,
        details: { classId: session.class.toString(), date: session.date },
      });
      await AuditLog.log({
        action: 'SESSION_COMPLETED',
        actor: session.teacher,
        target: `Session:${session._id}`,
        details: { attendeesCount: session.attendeesCount },
      });
    }

    await AuditLog.log({
      action: 'SESSION_STARTED',
      actor: activeSession.teacher,
      target: `Session:${activeSession._id}`,
      details: { classId: activeSession.class.toString(), status: 'active' },
    });

    log('📝', 'Audit logs created');

    // ── Summary ─────────────────────────────────────────────────────
    const counts = {
      users: await User.countDocuments(),
      classes: await Class.countDocuments(),
      sessions: await Session.countDocuments(),
      attendance: await Attendance.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
    };

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║   Seed Complete                                         ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║   Users        : ${String(counts.users).padEnd(38)}║`);
    console.log(`║   Classes      : ${String(counts.classes).padEnd(38)}║`);
    console.log(`║   Sessions     : ${String(counts.sessions).padEnd(38)}║`);
    console.log(`║   Attendance   : ${String(counts.attendance).padEnd(38)}║`);
    console.log(`║   Audit Logs   : ${String(counts.auditLogs).padEnd(38)}║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║   Demo Credentials                                     ║');
    console.log('║   Admin   : admin@gpcd.edu.in / admin123               ║');
    console.log('║   Teacher : rajesh.sharma@gpcd.edu.in / teacher123     ║');
    console.log('║   Student : bpt25001@student.gpcd.edu.in / student123  ║');
    console.log('║   Parent  : (see parent emails above) / parent123      ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n  ❌  Seed failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('  🔌  MongoDB connection closed');
    process.exit(0);
  }
}

seed();

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Initialize DB
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const initial = {
      students: [
        { id: 's001', name: 'Aanya Sharma', rollNo: 'CS2021001', class: 'CS-A', email: 'aanya@edu.in', phone: '9876543210' },
        { id: 's002', name: 'Rohan Mehta', rollNo: 'CS2021002', class: 'CS-A', email: 'rohan@edu.in', phone: '9876543211' },
        { id: 's003', name: 'Priya Patel', rollNo: 'CS2021003', class: 'CS-B', email: 'priya@edu.in', phone: '9876543212' },
        { id: 's004', name: 'Arjun Verma', rollNo: 'CS2021004', class: 'CS-B', email: 'arjun@edu.in', phone: '9876543213' },
        { id: 's005', name: 'Neha Singh', rollNo: 'CS2021005', class: 'CS-A', email: 'neha@edu.in', phone: '9876543214' },
        { id: 's006', name: 'Karan Joshi', rollNo: 'CS2021006', class: 'CS-C', email: 'karan@edu.in', phone: '9876543215' },
        { id: 's007', name: 'Divya Nair', rollNo: 'CS2021007', class: 'CS-C', email: 'divya@edu.in', phone: '9876543216' },
        { id: 's008', name: 'Vikram Das', rollNo: 'CS2021008', class: 'CS-A', email: 'vikram@edu.in', phone: '9876543217' },
      ],
      subjects: [
        { id: 'sub001', name: 'Data Structures', code: 'CS301', class: 'CS-A', teacher: 'Dr. Ramesh Kumar' },
        { id: 'sub002', name: 'Operating Systems', code: 'CS302', class: 'CS-A', teacher: 'Prof. Meera Iyer' },
        { id: 'sub003', name: 'Database Management', code: 'CS303', class: 'CS-B', teacher: 'Dr. Suresh Reddy' },
        { id: 'sub004', name: 'Computer Networks', code: 'CS304', class: 'CS-C', teacher: 'Dr. Anita Gupta' },
        { id: 'sub005', name: 'Software Engineering', code: 'CS305', class: 'CS-B', teacher: 'Prof. Vikas Bhatia' },
      ],
      attendance: [],
      feedback: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Students
app.get('/api/students', (req, res) => {
  const db = loadDB();
  res.json(db.students);
});

app.post('/api/students', (req, res) => {
  const db = loadDB();
  const student = { id: 's' + Date.now(), ...req.body };
  db.students.push(student);
  saveDB(db);
  res.json(student);
});

app.delete('/api/students/:id', (req, res) => {
  const db = loadDB();
  db.students = db.students.filter(s => s.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Subjects
app.get('/api/subjects', (req, res) => {
  const db = loadDB();
  res.json(db.subjects);
});

app.post('/api/subjects', (req, res) => {
  const db = loadDB();
  const subject = { id: 'sub' + Date.now(), ...req.body };
  db.subjects.push(subject);
  saveDB(db);
  res.json(subject);
});

// Attendance
app.get('/api/attendance', (req, res) => {
  const db = loadDB();
  let records = db.attendance;
  if (req.query.studentId) records = records.filter(r => r.studentId === req.query.studentId);
  if (req.query.subjectId) records = records.filter(r => r.subjectId === req.query.subjectId);
  if (req.query.date) records = records.filter(r => r.date === req.query.date);
  res.json(records);
});

app.post('/api/attendance/bulk', (req, res) => {
  const db = loadDB();
  const { date, subjectId, records } = req.body;
  // Remove existing records for this date+subject
  db.attendance = db.attendance.filter(r => !(r.date === date && r.subjectId === subjectId));
  records.forEach(r => {
    db.attendance.push({ id: 'att' + Date.now() + Math.random(), date, subjectId, studentId: r.studentId, status: r.status, markedAt: new Date().toISOString() });
  });
  saveDB(db);
  res.json({ success: true, count: records.length });
});

app.get('/api/attendance/stats', (req, res) => {
  const db = loadDB();
  const stats = db.students.map(student => {
    const records = db.attendance.filter(r => r.studentId === student.id);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    return {
      student,
      total,
      present,
      absent,
      late,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  });
  res.json(stats);
});

// Feedback
app.get('/api/feedback', (req, res) => {
  const db = loadDB();
  res.json(db.feedback);
});

app.post('/api/feedback', (req, res) => {
  const db = loadDB();
  const fb = { id: 'fb' + Date.now(), ...req.body, submittedAt: new Date().toISOString() };
  db.feedback.push(fb);
  saveDB(db);
  res.json(fb);
});

app.get('/api/feedback/stats', (req, res) => {
  const db = loadDB();
  const fb = db.feedback;
  const avgRating = fb.length > 0 ? (fb.reduce((s, f) => s + (f.rating || 0), 0) / fb.length).toFixed(1) : 0;
  const bySubject = {};
  fb.forEach(f => {
    if (!bySubject[f.subjectId]) bySubject[f.subjectId] = { count: 0, totalRating: 0, feedback: [] };
    bySubject[f.subjectId].count++;
    bySubject[f.subjectId].totalRating += f.rating || 0;
    bySubject[f.subjectId].feedback.push(f.comment);
  });
  res.json({ total: fb.length, avgRating, bySubject });
});

// Dashboard stats
app.get('/api/dashboard', (req, res) => {
  const db = loadDB();
  const totalStudents = db.students.length;
  const totalSubjects = db.subjects.length;
  const totalAttendance = db.attendance.length;
  const presentToday = db.attendance.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'present').length;
  const totalFeedback = db.feedback.length;
  const avgRating = db.feedback.length > 0 ? (db.feedback.reduce((s, f) => s + (f.rating || 0), 0) / db.feedback.length).toFixed(1) : 0;
  const lowAttendance = db.students.filter(student => {
    const records = db.attendance.filter(r => r.studentId === student.id);
    if (records.length === 0) return false;
    const present = records.filter(r => r.status === 'present').length;
    return (present / records.length) * 100 < 75;
  }).length;
  res.json({ totalStudents, totalSubjects, totalAttendance, presentToday, totalFeedback, avgRating, lowAttendance });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

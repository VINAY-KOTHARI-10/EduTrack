require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Models
const User = require('./models/User');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');
const Feedback = require('./models/Feedback');

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Initial Seed Data
async function seedDatabase() {
  // Seed Admin User
  const adminExists = await User.findOne({ email: 'harsha@gmail.com' });
  if (!adminExists) {
    const admin = new User({
      username: 'harsha',
      email: 'harsha@gmail.com',
      password: 'harsha@123',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user (harsha) seeded');
  }

  const studentCount = await Student.countDocuments();
  if (studentCount === 0) {
    const students = [
      { name: 'Aanya Sharma', rollNo: 'CS2021001', class: 'CS-A', email: 'aanya@edu.in', phone: '9876543210' },
      { name: 'Rohan Mehta', rollNo: 'CS2021002', class: 'CS-A', email: 'rohan@edu.in', phone: '9876543211' },
      { name: 'Priya Patel', rollNo: 'CS2021003', class: 'CS-B', email: 'priya@edu.in', phone: '9876543212' },
      { name: 'Arjun Verma', rollNo: 'CS2021004', class: 'CS-B', email: 'arjun@edu.in', phone: '9876543213' },
      { name: 'Neha Singh', rollNo: 'CS2021005', class: 'CS-A', email: 'neha@edu.in', phone: '9876543214' },
      { name: 'Karan Joshi', rollNo: 'CS2021006', class: 'CS-C', email: 'karan@edu.in', phone: '9876543215' },
      { name: 'Divya Nair', rollNo: 'CS2021007', class: 'CS-C', email: 'divya@edu.in', phone: '9876543216' },
      { name: 'Vikram Das', rollNo: 'CS2021008', class: 'CS-A', email: 'vikram@edu.in', phone: '9876543217' },
    ];
    await Student.insertMany(students);
    console.log('Students seeded');
  }

  const subjectCount = await Subject.countDocuments();
  if (subjectCount === 0) {
    const subjects = [
      { name: 'Data Structures', code: 'CS301', class: 'CS-A', teacher: 'Dr. Ramesh Kumar' },
      { name: 'Operating Systems', code: 'CS302', class: 'CS-A', teacher: 'Prof. Meera Iyer' },
      { name: 'Database Management', code: 'CS303', class: 'CS-B', teacher: 'Dr. Suresh Reddy' },
      { name: 'Computer Networks', code: 'CS304', class: 'CS-C', teacher: 'Dr. Anita Gupta' },
      { name: 'Software Engineering', code: 'CS305', class: 'CS-B', teacher: 'Prof. Vikas Bhatia' },
    ];
    await Subject.insertMany(subjects);
    console.log('Subjects seeded');
  }
}

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ error: 'User already registered.' });

    user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ _id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET);
    res.json({ token, user: { username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await user.comparePassword(password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ _id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET);
    res.json({ token, user: { username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API ROUTES (Protected) ---

app.get('/api/students', auth, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', auth, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', auth, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subjects', auth, async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subjects', auth, async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance', auth, async (req, res) => {
  try {
    let query = {};
    if (req.query.studentId) query.studentId = req.query.studentId;
    if (req.query.subjectId) query.subjectId = req.query.subjectId;
    if (req.query.date) query.date = req.query.date;
    const records = await Attendance.find(query).populate('studentId').populate('subjectId');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/bulk', auth, async (req, res) => {
  try {
    const { date, subjectId, records } = req.body;
    await Attendance.deleteMany({ date, subjectId });
    const attendanceRecords = records.map(r => ({
      date,
      subjectId,
      studentId: r.studentId,
      status: r.status
    }));
    await Attendance.insertMany(attendanceRecords);
    res.json({ success: true, count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/stats', auth, async (req, res) => {
  try {
    const students = await Student.find();
    const stats = await Promise.all(students.map(async (student) => {
      const records = await Attendance.find({ studentId: student._id });
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
    }));
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find().populate('subjectId');
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const fb = new Feedback(req.body);
    await fb.save();
    res.json(fb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback/stats', auth, async (req, res) => {
  try {
    const fb = await Feedback.find();
    const avgRating = fb.length > 0 ? (fb.reduce((s, f) => s + (f.rating || 0), 0) / fb.length).toFixed(1) : 0;
    const bySubject = {};
    fb.forEach(f => {
      const sid = f.subjectId.toString();
      if (!bySubject[sid]) bySubject[sid] = { count: 0, totalRating: 0, feedback: [] };
      bySubject[sid].count++;
      bySubject[sid].totalRating += f.rating || 0;
      bySubject[sid].feedback.push(f.comment);
    });
    res.json({ total: fb.length, avgRating, bySubject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalSubjects = await Subject.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.countDocuments({ date: today, status: 'present' });
    const totalFeedback = await Feedback.countDocuments();
    const fb = await Feedback.find();
    const avgRating = fb.length > 0 ? (fb.reduce((s, f) => s + (f.rating || 0), 0) / fb.length).toFixed(1) : 0;
    
    // Low attendance (< 75%)
    const students = await Student.find();
    let lowAttendanceCount = 0;
    for (const student of students) {
      const records = await Attendance.find({ studentId: student._id });
      if (records.length > 0) {
        const present = records.filter(r => r.status === 'present').length;
        if ((present / records.length) * 100 < 75) lowAttendanceCount++;
      }
    }

    res.json({ totalStudents, totalSubjects, totalAttendance, presentToday, totalFeedback, avgRating, lowAttendance: lowAttendanceCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));


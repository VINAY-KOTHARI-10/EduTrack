require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');
const Feedback = require('./models/Feedback');
const User = require('./models/User');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for migration');

        if (!fs.existsSync(DB_PATH)) {
            console.log('No db.json found, nothing to migrate.');
            process.exit(0);
        }

        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

        // Clear existing collections (except users) to avoid duplicates during migration
        await Student.deleteMany({});
        await Subject.deleteMany({});
        await Attendance.deleteMany({});
        await Feedback.deleteMany({});
        console.log('Cleared existing students, subjects, attendance, and feedback.');

        // 1. Migrate Students
        const studentIdMap = {}; // oldId -> new ObjectId
        for (const oldStudent of data.students) {
            const newStudent = new Student({
                name: oldStudent.name,
                rollNo: oldStudent.rollNo,
                class: oldStudent.class,
                email: oldStudent.email,
                phone: oldStudent.phone
            });
            await newStudent.save();
            studentIdMap[oldStudent.id] = newStudent._id;
        }
        console.log(`Migrated ${data.students.length} students.`);

        // 2. Migrate Subjects
        const subjectIdMap = {}; // oldId -> new ObjectId
        for (const oldSub of data.subjects) {
            const newSub = new Subject({
                name: oldSub.name,
                code: oldSub.code,
                class: oldSub.class,
                teacher: oldSub.teacher
            });
            await newSub.save();
            subjectIdMap[oldSub.id] = newSub._id;
        }
        console.log(`Migrated ${data.subjects.length} subjects.`);

        // 3. Migrate Attendance
        let attCount = 0;
        for (const oldAtt of data.attendance || []) {
            const newStudentId = studentIdMap[oldAtt.studentId];
            const newSubjectId = subjectIdMap[oldAtt.subjectId];

            if (newStudentId && newSubjectId) {
                const newAtt = new Attendance({
                    date: oldAtt.date,
                    subjectId: newSubjectId,
                    studentId: newStudentId,
                    status: oldAtt.status,
                    markedAt: oldAtt.markedAt ? new Date(oldAtt.markedAt) : new Date()
                });
                await newAtt.save();
                attCount++;
            }
        }
        console.log(`Migrated ${attCount} attendance records.`);

        // 4. Migrate Feedback
        let fbCount = 0;
        for (const oldFb of data.feedback || []) {
            const newSubjectId = subjectIdMap[oldFb.subjectId];
            if (newSubjectId) {
                const newFb = new Feedback({
                    studentName: oldFb.studentName || 'Anonymous',
                    studentRoll: oldFb.studentRoll,
                    subjectId: newSubjectId,
                    rating: oldFb.rating,
                    comment: oldFb.comment,
                    isAnonymous: oldFb.isAnonymous || false,
                    submittedAt: oldFb.submittedAt ? new Date(oldFb.submittedAt) : new Date()
                });
                await newFb.save();
                fbCount++;
            }
        }
        console.log(`Migrated ${fbCount} feedback records.`);

        console.log('Migration completed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();

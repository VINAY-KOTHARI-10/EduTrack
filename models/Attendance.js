const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    markedAt: { type: Date, default: Date.now }
});

attendanceSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);

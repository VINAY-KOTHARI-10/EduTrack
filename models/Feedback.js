const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    studentName: { type: String, default: 'Anonymous' },
    studentRoll: { type: String },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    isAnonymous: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now }
});

feedbackSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);

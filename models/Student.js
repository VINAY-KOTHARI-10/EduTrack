const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNo: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    createdAt: { type: Date, default: Date.now }
});

studentSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Student', studentSchema);

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    recordedByTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

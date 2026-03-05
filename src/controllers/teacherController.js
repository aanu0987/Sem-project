const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const getDashboard = async (req, res) => {
  const teacherId = req.session.user.id;
  const students = await Student.find({ createdByTeacher: teacherId }).sort({ createdAt: -1 });

  return res.render('teacher-dashboard', {
    title: 'Teacher Dashboard',
    teacher: req.session.user,
    students,
    error: null
  });
};

const addStudent = async (req, res) => {
  const { studentId, name, className, email } = req.body;

  try {
    const exists = await Student.findOne({ studentId });
    if (exists) {
      const students = await Student.find({ createdByTeacher: req.session.user.id }).sort({ createdAt: -1 });
      return res.status(400).render('teacher-dashboard', {
        title: 'Teacher Dashboard',
        teacher: req.session.user,
        students,
        error: 'Student ID already exists.'
      });
    }

    await Student.create({
      studentId,
      name,
      className,
      email,
      createdByTeacher: req.session.user.id
    });

    return res.redirect('/teacher/dashboard');
  } catch (error) {
    const students = await Student.find({ createdByTeacher: req.session.user.id }).sort({ createdAt: -1 });
    return res.status(500).render('teacher-dashboard', {
      title: 'Teacher Dashboard',
      teacher: req.session.user,
      students,
      error: 'Failed to add student.'
    });
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id);

  if (!student) {
    return res.redirect('/teacher/dashboard');
  }

  if (student.createdByTeacher.toString() !== req.session.user.id) {
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'You cannot delete this student.'
    });
  }

  await Attendance.deleteMany({ student: student._id });
  await Student.findByIdAndDelete(student._id);
  return res.redirect('/teacher/dashboard');
};

const markAttendance = async (req, res) => {
  const { id } = req.params;
  const { status, date } = req.body;

  const student = await Student.findById(id);
  if (!student) {
    return res.redirect('/teacher/dashboard');
  }

  if (student.createdByTeacher.toString() !== req.session.user.id) {
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'You cannot mark attendance for this student.'
    });
  }

  await Attendance.create({
    student: student._id,
    status,
    date: date ? new Date(date) : new Date(),
    recordedByTeacher: req.session.user.id
  });

  return res.redirect('/teacher/attendance');
};

const getAttendance = async (req, res) => {
  const teacherId = req.session.user.id;
  const records = await Attendance.find({ recordedByTeacher: teacherId })
    .populate('student')
    .populate('recordedByTeacher', 'name username')
    .sort({ date: -1, createdAt: -1 });

  return res.render('attendance-history', {
    title: 'Attendance History',
    teacher: req.session.user,
    records
  });
};

module.exports = {
  getDashboard,
  addStudent,
  deleteStudent,
  markAttendance,
  getAttendance
};

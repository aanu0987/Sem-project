const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');

const getDashboard = async (req, res) => {
  const teachers = await Teacher.find().sort({ createdAt: -1 });

  return res.render('admin-dashboard', {
    title: 'Admin Dashboard',
    admin: req.session.user,
    teachers,
    error: null
  });
};

const addTeacher = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existing = await Teacher.findOne({ username });
    if (existing) {
      const teachers = await Teacher.find().sort({ createdAt: -1 });
      return res.status(400).render('admin-dashboard', {
        title: 'Admin Dashboard',
        admin: req.session.user,
        teachers,
        error: 'Teacher username already exists.'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await Teacher.create({ name, username, password: hashed });
    return res.redirect('/admin/dashboard');
  } catch (error) {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    return res.status(500).render('admin-dashboard', {
      title: 'Admin Dashboard',
      admin: req.session.user,
      teachers,
      error: 'Failed to create teacher account.'
    });
  }
};

const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  await Teacher.findByIdAndDelete(id);
  return res.redirect('/admin/dashboard');
};

module.exports = {
  getDashboard,
  addTeacher,
  deleteTeacher
};

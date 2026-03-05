const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');

const getLogin = (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/teacher/dashboard');
  }

  return res.render('login', {
    title: 'Login',
    error: null
  });
};

const postLogin = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    if (role === 'admin') {
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(401).render('login', { title: 'Login', error: 'Invalid credentials.' });
      }
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).render('login', { title: 'Login', error: 'Invalid credentials.' });
      }
      req.session.user = {
        id: admin._id,
        role: 'admin',
        username: admin.username
      };
      return res.redirect('/admin/dashboard');
    }

    const teacher = await Teacher.findOne({ username });
    if (!teacher) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, teacher.password);
    if (!valid) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid credentials.' });
    }

    req.session.user = {
      id: teacher._id,
      role: 'teacher',
      username: teacher.username,
      name: teacher.name
    };

    return res.redirect('/teacher/dashboard');
  } catch (error) {
    return res.status(500).render('login', {
      title: 'Login',
      error: 'Something went wrong. Please try again.'
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  getLogin,
  postLogin,
  logout
};

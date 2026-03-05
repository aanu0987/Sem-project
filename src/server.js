require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const { requireAuth } = require('./middleware/auth');

const app = express();

const seedDefaultAdmin = async () => {
  const adminUsername = 'admin';
  const adminPassword = 'admin@123';

  const existingAdmin = await Admin.findOne({ username: adminUsername });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await Admin.create({ username: adminUsername, password: hashed });
    console.log('Default admin created (username: admin).');
  }
};

connectDB().then(seedDefaultAdmin);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get('/', requireAuth, (req, res) => {
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/teacher/dashboard');
});

app.use(authRoutes);
app.use('/admin', adminRoutes);
app.use('/teacher', teacherRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'Page not found.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

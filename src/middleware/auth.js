const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  return next();
};

const requireRole = (role) => (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== role) {
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'You are not authorized to access this page.'
    });
  }
  return next();
};

module.exports = { requireAuth, requireRole };

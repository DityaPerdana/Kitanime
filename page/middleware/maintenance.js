const { getSetting } = require('../models/database');

async function maintenance(req, res, next) {
  try {
    const isAdmin = !!(req.session && req.session.adminUser);
    res.locals.isAdmin = isAdmin;

    // Allow admin routes and assets
    if (req.path.startsWith('/admin') || req.path.startsWith('/images') || req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/favicon') || req.path.startsWith('/api')) {
      const mode = await getSetting('maintenance_mode');
      res.locals.maintenanceMode = mode === '1';
      return next();
    }

    const mode = await getSetting('maintenance_mode');
    res.locals.maintenanceMode = mode === '1';

    if (mode === '1') {
      if (isAdmin) return next();

      const message = (await getSetting('maintenance_message')) || 'Website sedang dalam maintenance. Mohon kembali lagi nanti.';
      return res.status(503).render('maintenance', {
        title: 'Maintenance - ArufaNime',
        message
      });
    }

    next();
  } catch (err) {
    console.error('Maintenance middleware error:', err);
    next();
  }
}

module.exports = maintenance;

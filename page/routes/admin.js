const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const {
  getAdminByUsername,
  getAllApiEndpoints,
  updateApiEndpoint,
  getAllAdSlots,
  addAdSlot,
  updateAdSlot,
  deleteAdSlot,
  getSetting,
  updateSetting
} = require('../models/database');

function requireAuth(req, res, next) {
  if (req.session.adminUser) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

router.get('/login', (req, res) => {
  if (req.session.adminUser) {
    return res.redirect('/admin');
  }

  res.render('admin/login', {
    title: 'Admin Login - ArufaNime',
    layout: 'admin/layout',
    error: req.query.error
  });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/admin/login?error=missing_fields');
    }

    const admin = await getAdminByUsername(username);
    if (!admin) {
      return res.redirect('/admin/login?error=invalid_credentials');
    }

  const isValidPassword = bcrypt.compareSync(password, admin.password_hash);
    if (!isValidPassword) {
      return res.redirect('/admin/login?error=invalid_credentials');
    }

    const setUserAndRedirect = () => {
      req.session.adminUser = {
        id: admin.id,
        username: admin.username,
        email: admin.email
      };
      if (typeof req.session.save === 'function') {
        req.session.save(() => res.redirect('/admin'));
      } else {
        res.redirect('/admin');
      }
    };

    if (typeof req.session.regenerate === 'function') {
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.redirect('/admin/login?error=session_error');
        }
        setUserAndRedirect();
      });
    } else {
      setUserAndRedirect();
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.redirect('/admin/login?error=server_error');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const [apiEndpoints, adSlots] = await Promise.all([
      getAllApiEndpoints(),
      getAllAdSlots()
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - ArufaNime',
      layout: 'admin/layout',
      user: req.session.adminUser,
      stats: {
        apiEndpoints: apiEndpoints.length,
        adSlots: adSlots.length,
        activeAdSlots: adSlots.filter(slot => slot.is_active).length
      },
      req: req
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('admin/error', {
      title: 'Error - Admin ArufaNime',
      layout: 'admin/layout',
      error: 'Tidak dapat memuat dashboard'
    });
  }
});

router.get('/api-endpoints', requireAuth, async (req, res) => {
  try {
    const endpoints = await getAllApiEndpoints();

    res.render('admin/api-endpoints', {
      title: 'Kelola API Endpoints - Admin ArufaNime',
      layout: 'admin/layout',
      user: req.session.adminUser,
      endpoints,
      req: req
    });
  } catch (error) {
    console.error('API endpoints page error:', error);
    res.render('admin/error', {
      title: 'Error - Admin ArufaNime',
      layout: 'admin/layout',
      error: 'Tidak dapat memuat data API endpoints'
    });
  }
});

router.post('/api-endpoints/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, is_active } = req.body;

    await updateApiEndpoint(id, url, is_active === 'on');

    res.redirect('/admin/api-endpoints?success=updated');
  } catch (error) {
    console.error('Update API endpoint error:', error);
    res.redirect('/admin/api-endpoints?error=update_failed');
  }
});

router.get('/ad-slots', requireAuth, async (req, res) => {
  try {
    const adSlots = await getAllAdSlots();

    res.render('admin/ad-slots', {
      title: 'Kelola Slot Iklan - Admin ArufaNime',
      layout: 'admin/layout',
      user: req.session.adminUser,
      adSlots,
      req: req
    });
  } catch (error) {
    console.error('Ad slots page error:', error);
    res.render('admin/error', {
      title: 'Error - Admin ArufaNime',
      layout: 'admin/layout',
      error: 'Tidak dapat memuat data slot iklan'
    });
  }
});

router.post('/ad-slots', requireAuth, async (req, res) => {
  try {
    const { name, position, type, content, is_active } = req.body;

    await addAdSlot(name, position, type, content, is_active === 'on');

    res.redirect('/admin/ad-slots?success=added');
  } catch (error) {
    console.error('Add ad slot error:', error);
    res.redirect('/admin/ad-slots?error=add_failed');
  }
});

router.post('/ad-slots/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, type, content, is_active } = req.body;

    await updateAdSlot(id, name, position, type, content, is_active === 'on');

    res.redirect('/admin/ad-slots?success=updated');
  } catch (error) {
    console.error('Update ad slot error:', error);
    res.redirect('/admin/ad-slots?error=update_failed');
  }
});

router.delete('/ad-slots/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await deleteAdSlot(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete ad slot error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.get('/settings', requireAuth, async (req, res) => {
  try {
    const [siteTitle, siteDescription, cookieConsentEnabled, adsenseEnabled, maintenanceMode, maintenanceMessage] = await Promise.all([
      getSetting('site_title'),
      getSetting('site_description'),
      getSetting('cookie_consent_enabled'),
      getSetting('adsense_enabled'),
      getSetting('maintenance_mode'),
      getSetting('maintenance_message')
    ]);

    res.render('admin/settings', {
      title: 'Pengaturan - Admin ArufaNime',
      layout: 'admin/layout',
      user: req.session.adminUser,
      settings: {
        site_title: siteTitle,
        site_description: siteDescription,
        cookie_consent_enabled: cookieConsentEnabled === '1',
        adsense_enabled: adsenseEnabled === '1',
        maintenance_mode: maintenanceMode === '1',
        maintenance_message: maintenanceMessage || ''
      },
      req: req
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.render('admin/error', {
      title: 'Error - Admin ArufaNime',
      layout: 'admin/layout',
      error: 'Tidak dapat memuat pengaturan'
    });
  }
});

router.post('/settings', requireAuth, async (req, res) => {
  try {
    const { site_title, site_description, cookie_consent_enabled, adsense_enabled, maintenance_mode, maintenance_message } = req.body;

    await Promise.all([
      updateSetting('site_title', site_title),
      updateSetting('site_description', site_description),
      updateSetting('cookie_consent_enabled', cookie_consent_enabled === 'on' ? '1' : '0'),
      updateSetting('adsense_enabled', adsense_enabled === 'on' ? '1' : '0'),
      updateSetting('maintenance_mode', maintenance_mode === 'on' ? '1' : '0'),
      updateSetting('maintenance_message', maintenance_message || '')
    ]);

    res.redirect('/admin/settings?success=updated');
  } catch (error) {
    console.error('Update settings error:', error);
    res.redirect('/admin/settings?error=update_failed');
  }
});

router.get('/preview', requireAuth, (req, res) => {
  res.render('admin/preview', {
    title: 'Preview Website - Admin ArufaNime',
    layout: 'admin/layout',
    user: req.session.adminUser
  });
});

module.exports = router;

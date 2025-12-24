const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const requireAdmin = require('../middleware/authMiddleware');

// Login Routes
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected Routes
router.get('/dashboard', requireAdmin, adminController.getDashboard);

// Product Management
const upload = require('../middleware/uploadMiddleware');

router.get('/add-product', requireAdmin, adminController.getAddProduct);
router.post('/add-product', requireAdmin, upload.array('images', 5), adminController.postAddProduct);

router.get('/edit-product/:id', requireAdmin, adminController.getEditProduct);
router.post('/edit-product/:id', requireAdmin, upload.array('images', 5), adminController.postEditProduct);

router.post('/delete-product/:id', requireAdmin, adminController.deleteProduct);

module.exports = router;

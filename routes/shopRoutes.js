const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/', shopController.getIndex);
router.get('/about', shopController.getAbout);
router.get('/terms', shopController.getTerms);
router.get('/refund', shopController.getRefund);
router.get('/contact', shopController.getContact);
router.post('/contact', shopController.postContact);
router.get('/product/:id', shopController.getProduct);

// Cart
router.get('/cart', shopController.getCart);
router.post('/cart/add', shopController.postCart);
router.post('/cart/delete-item', shopController.postCartDeleteProduct);

// Checkout
router.get('/checkout', shopController.getCheckout);
router.post('/create-order', shopController.postOrder);

// Payment
router.get('/payment/gateway', shopController.getPaymentGateway);
router.get('/payment/status', shopController.getPaymentStatus);
router.get('/payment/success', shopController.getPaymentSuccess);
router.get('/payment/failure', shopController.getPaymentFailure);

module.exports = router;

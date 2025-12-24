const Product = require('../models/Product');

exports.getIndex = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('shop/index', {
            pageTitle: 'Shop',
            layout: 'layouts/main-layout',
            products: products
        });
    } catch (err) {
        console.error(err);
        res.render('shop/index', {
            pageTitle: 'Shop',
            layout: 'layouts/main-layout',
            products: [],
            error: 'Failed to load products'
        });
    }
};

exports.getAbout = (req, res) => {
    res.render('shop/about', {
        pageTitle: 'About Us',
        layout: 'layouts/main-layout'
    });
};

exports.getTerms = (req, res) => {
    res.render('shop/terms', {
        pageTitle: 'Terms & Conditions',
        layout: 'layouts/main-layout'
    });
};

exports.getRefund = (req, res) => {
    res.render('shop/refund', {
        pageTitle: 'Refund Policy',
        layout: 'layouts/main-layout'
    });
};

exports.getContact = (req, res) => {
    res.render('shop/contact', {
        pageTitle: 'Contact Us',
        layout: 'layouts/main-layout'
    });
};

exports.postContact = (req, res) => {
    // Dummy logic for contact form submission
    console.log(req.body);
    res.redirect('/contact');
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect('/');
        }
        res.render('shop/product-details', {
            pageTitle: product.name,
            layout: 'layouts/main-layout',
            product: product
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

exports.getCart = (req, res) => {
    console.log('DEBUG: getCart session:', JSON.stringify(req.session.cart, null, 2));
    res.render('shop/cart', {
        pageTitle: 'Your Cart',
        layout: 'layouts/main-layout'
    });
};

exports.postCart = async (req, res) => {
    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantity) || 1;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.redirect('/');
        }

        const cart = req.session.cart || { items: [], totalQty: 0, totalPrice: 0 };
        const existingItemIndex = cart.items.findIndex(p => p.productId.toString() === productId.toString());

        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId: productId,
                name: product.name,
                price: product.price,
                img: product.images[0], // Store for display
                quantity: quantity
            });
        }

        cart.totalQty += quantity;
        cart.totalPrice += product.price * quantity;

        req.session.cart = cart;
        console.log(`DEBUG: postCart Session ID: ${req.session.id}`);
        console.log('DEBUG: Saving cart to session:', JSON.stringify(cart, null, 2));

        req.session.save(err => {
            if (err) {
                console.error('DEBUG: Session save error:', err);
            } else {
                console.log('DEBUG: Session saved successfully. Redirecting to /cart...');
            }
            res.redirect('/cart');
        });
    } catch (err) {
        console.error('DEBUG: postCart error:', err);
        console.log(err);
        res.redirect('/');
    }
};

exports.postCartDeleteProduct = (req, res) => {
    const productId = req.body.productId;
    const cart = req.session.cart;

    if (cart) {
        const itemIndex = cart.items.findIndex(p => p.productId == productId);
        if (itemIndex >= 0) {
            const item = cart.items[itemIndex];
            cart.totalQty -= item.quantity;
            cart.totalPrice -= item.price * item.quantity;
            cart.items.splice(itemIndex, 1);
        }
        req.session.cart = cart;
        req.session.save(err => {
            if (err) console.log(err);
            res.redirect('/cart');
        });
    } else {
        res.redirect('/cart');
    }
};

exports.getCheckout = (req, res) => {
    if (!req.session.cart || req.session.cart.items.length === 0) {
        return res.redirect('/cart');
    }
    res.render('shop/checkout', {
        pageTitle: 'Checkout',
        layout: 'layouts/main-layout'
    });
};

const Order = require('../models/Order');

const axios = require('axios');

exports.postOrder = async (req, res) => {
    if (!req.session.cart || req.session.cart.items.length === 0) {
        return res.redirect('/cart');
    }

    const {
        name, email, phone,
        street, city, state, pincode, country
    } = req.body;

    const cart = req.session.cart;

    // Create pending order
    const order = new Order({
        customer: { name, email, phone },
        address: { street, city, state, pincode, country },
        items: cart.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price
        })),
        totalAmount: cart.totalPrice,
        status: 'Pending'
    });

    try {
        const savedOrder = await order.save();
        // Clear cart
        req.session.cart = null;

        // Cashfree Integration
        const isProd = process.env.CASHFREE_ENV === 'PROD';
        const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

        const payload = {
            order_id: savedOrder._id.toString(),
            order_amount: savedOrder.totalAmount,
            order_currency: 'INR',
            customer_details: {
                customer_id: savedOrder.customer.email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40) || 'guest_' + Date.now(),
                customer_email: savedOrder.customer.email,
                customer_phone: savedOrder.customer.phone
            },
            order_meta: {
                // Cashfree requires https, even for sandbox.
                // We will force 'https' here. Note that on localhost without SSL, 
                // the return redirection might fail in browser with SSL error.
                // Use ngrok for proper testing or ignore browser SSL warning if possible.
                return_url: `https://${req.get('host')}/payment/status?order_id={order_id}`
            }
        };

        const headers = {
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
        };

        const response = await axios.post(`${baseUrl}/orders`, payload, { headers });

        if (response.data && response.data.payment_session_id) {
            // Redirect to a page where we can initiate the payment sdk or redirect to payment link
            // For simplicity, we might redirect to payment_link if available, or render a page with checkout sdk
            // The API usually returns payment_session_id. 
            // To simplify, let's use the 'payment_link' if available (only older versions) or fallback to rendering a payment page.
            // Actually, the best way for web is to use the JS SDK on frontend. 
            // But user asked to "config payment system". 
            // Let's pass the payment_session_id to the payment gateway page.
            res.redirect(`/payment/gateway?order_id=${savedOrder._id}&payment_session_id=${response.data.payment_session_id}`);
        } else {
            console.error('Cashfree Error:', response.data);
            res.redirect('/checkout?error=payment_initiation_failed');
        }

    } catch (err) {
        console.log(err.response ? err.response.data : err);
        res.redirect('/checkout?error=payment_error');
    }
};

exports.getPaymentGateway = (req, res) => {
    // Render the payment page with Cashfree SDK
    res.render('shop/payment', {
        pageTitle: 'Payment Gateway',
        layout: 'layouts/main-layout',
        orderId: req.query.order_id,
        paymentSessionId: req.query.payment_session_id,
        isProd: process.env.CASHFREE_ENV === 'PROD'
    });
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const orderId = req.query.order_id;
        const isProd = process.env.CASHFREE_ENV === 'PROD';
        const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

        const headers = {
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
        };

        const response = await axios.get(`${baseUrl}/orders/${orderId}`, { headers });
        const orderData = response.data;

        const order = await Order.findById(orderId);

        if (orderData.order_status === 'PAID') {
            if (order) {
                order.status = 'Paid';
                order.paymentId = orderData.cf_order_id; // or payment id
                await order.save();
            }
            res.redirect('/payment/success?orderId=' + orderId);
        } else {
            if (order) {
                order.status = 'Failed';
                await order.save();
            }
            res.redirect('/payment/failure?orderId=' + orderId);
        }

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

exports.getPaymentSuccess = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId);
        if (order) {
            order.status = 'Paid';
            order.paymentId = 'MOCK-' + Date.now();
            await order.save();
        }
        res.render('shop/confirmation', {
            pageTitle: 'Order Confirmed',
            layout: 'layouts/main-layout',
            order: order
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.getPaymentFailure = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId);
        if (order) {
            order.status = 'Failed';
            await order.save();
        }
        res.render('shop/index', {
            pageTitle: 'Payment Failed',
            layout: 'layouts/main-layout',
            products: [], // Or fetch products
            error: 'Payment failed for Order ID: ' + orderId + '. Please try again.'
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};


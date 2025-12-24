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
        const existingItemIndex = cart.items.findIndex(p => p.productId == productId);

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
        res.redirect('/cart');
    } catch (err) {
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
    }
    res.redirect('/cart');
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

exports.postOrder = async (req, res) => {
    if (!req.session.cart || req.session.cart.items.length === 0) {
        return res.redirect('/cart');
    }

    // In a real app, validation goes here
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

        // Redirect to a mock payment page or success
        // Simulating Payment Gateway Redirect
        res.redirect(`/payment/gateway?orderId=${savedOrder._id}`);
    } catch (err) {
        console.log(err);
        res.redirect('/checkout');
    }
};

exports.getPaymentGateway = (req, res) => {
    // Mock Payment Page
    res.render('shop/payment', {
        pageTitle: 'Payment Gateway',
        layout: 'layouts/main-layout',
        orderId: req.query.orderId
    });
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


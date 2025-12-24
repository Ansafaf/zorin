const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getLogin = (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', {
        pageTitle: 'Admin Login',
        layout: 'layouts/admin-layout' // Use admin layout
    });
};

exports.postLogin = (req, res) => {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', {
            pageTitle: 'Admin Login',
            layout: 'layouts/admin-layout',
            error: 'Invalid Email or Password'
        });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const products = await Product.find();
        const activeOrders = await Order.countDocuments({ status: 'Pending' });

        res.render('admin/dashboard', {
            pageTitle: 'Dashboard',
            layout: 'layouts/admin-layout',
            products: products,
            activeOrders: activeOrders
        });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', {
            pageTitle: 'Dashboard',
            layout: 'layouts/admin-layout',
            products: [],
            error: 'Failed to load products'
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/admin/login');
    });
};

// ... Product Operations ...

exports.getAddProduct = (req, res) => {
    res.render('admin/product-form', {
        pageTitle: 'Add Product',
        layout: 'layouts/admin-layout',
        editing: false,
        product: {}
    });
};

exports.postAddProduct = async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        const images = req.files.map(file => file.filename);

        const newProduct = new Product({
            name,
            price,
            description,
            category,
            images
        });

        await newProduct.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/product-form', {
            pageTitle: 'Edit Product',
            layout: 'layouts/admin-layout',
            editing: true,
            product: product
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.postEditProduct = async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        const productId = req.params.id;

        const product = await Product.findById(productId);

        product.name = name;
        product.price = price;
        product.description = description;
        product.category = category;

        // If new files are uploaded, append them (or replace logic depending on reqs, appending is safer)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            product.images = product.images.concat(newImages);
        }

        await product.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

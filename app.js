require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('./config/db');

// Initialize App
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
const MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
});

store.on('error', function (error) {
    console.log('Session Store Error:', error);
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    store: store, // Use MongoDB Store
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// View Engine
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layouts/main-layout'); // Set default layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global Variables Middleware (for flash messages, user session in views)
app.use((req, res, next) => {
    console.log(`DEBUG: Middleware [${req.method} ${req.url}] Session ID: ${req.session.id}`);
    res.locals.isAdmin = req.session.isAdmin || false;
    res.locals.cart = req.session.cart || { items: [], totalQty: 0, totalPrice: 0 };
    next();
});

// Routes
app.use('/admin', require('./routes/adminRoutes'));
app.use('/', require('./routes/shopRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/404' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;


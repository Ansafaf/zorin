const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
    {
        name: "iPhone 15 Pro Max",
        price: 159900,
        description: "The ultimate iPhone with Titanium design, A17 Pro chip, and the most powerful camera system.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        price: 129999,
        description: "Galaxy AI is here. Experience the new era of mobile with S24 Ultra.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Google Pixel 8 Pro",
        price: 106999,
        description: "The pro-level phone from Google with the best of Google AI and camera.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "OnePlus 12",
        price: 64999,
        description: "Smooth beyond belief. Powered by Snapdragon 8 Gen 3.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Xiaomi 14 Ultra",
        price: 99999,
        description: "Leica Summilux optical lens. Snapdragon 8 Gen 3.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "iPhone 14",
        price: 59900,
        description: "Full of fantastic features. Ceramic Shield, tougher than any smartphone glass.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Samsung Galaxy A55 5G",
        price: 39999,
        description: "Awesome design, awesome camera, awesome battery.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Nothing Phone (2)",
        price: 36999,
        description: "A new era of mindfulness. Glyph Interface.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Realme 12 Pro+",
        price: 29999,
        description: "Periscope Portrait Camera. Luxury Watch Design.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    },
    {
        name: "Vivo X100 Pro",
        price: 89999,
        description: "ZEISS APO Floating Telephoto Camera.",
        category: "Mobile Phones",
        images: ["mobile_phone_placeholder.png"]
    }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        console.log('Clearing existing products...');
        await Product.deleteMany({});

        console.log('Seeding new products...');
        await Product.insertMany(products);

        console.log('Done!');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

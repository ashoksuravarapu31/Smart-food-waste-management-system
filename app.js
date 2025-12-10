require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { Blockchain, Block } = require('./blockchain');
const crypto = require('crypto');

const app = express();

// Passport Config
require('./config/passport')(passport);

// MongoDB Connection
mongoose.connect('mongodb+srv://temp:Fgouter55%23@cluster0.bblcm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(async () => {
    console.log('MongoDB Connected');
    
    // Create default admin user if it doesn't exist
    try {
        // First, drop any existing indexes
        await User.collection.dropIndexes();
        
        const adminExists = await User.findOne({ email: 'admin@foodsystem.com' });
        if (!adminExists) {
            // Create admin user with plain password (will be hashed by pre-save hook)
            const adminUser = new User({
                name: 'Admin',
                email: 'admin@foodsystem.com',
                password: 'admin123',
                role: 'admin',
                approved: true
            });
            
            await adminUser.save();
            console.log('Default admin user created');
        } else {
            console.log('Admin user already exists');
        }
    } catch (err) {
        console.error('Error creating admin user:', err);
    }
})
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1); // Exit if cannot connect to database
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Session setup with MongoDB store
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: 'mongodb+srv://temp:Fgouter55%23@cluster0.bblcm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
        ttl: 24 * 60 * 60 // Session TTL of 1 day
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user;
    next();
});

// Middleware to check static key
function checkStaticKey(req, res, next) {
    const staticKey = 'your-static-key'; // Replace with your actual static key
    if (req.query.key !== staticKey) {
        return res.status(403).send('Forbidden');
    }
    next();
}

// Redirect root to appropriate login
app.get('/', (req, res) => {
    if (req.user) {
        if (!req.user.approved) {
            return res.redirect('/auth/pending-approval');
        }
        if (req.user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else if (req.user.role === 'restaurant') {
            return res.redirect('/restaurant/dashboard');
        } else if (req.user.role === 'charity') {
            return res.redirect('/charity/dashboard');
        }
    }
    res.render('index');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    
    if (!req.user.approved) {
        return res.redirect('/auth/pending-approval');
    }
    
    switch (req.user.role) {
        case 'admin':
            return res.redirect('/admin/dashboard');
        case 'restaurant':
            return res.redirect('/restaurant/dashboard');
        case 'charity':
            return res.redirect('/charity/dashboard');
        default:
            return res.redirect('/auth/login');
    }
});

// Route to manage user approvals
app.get('/manage-users', checkStaticKey, async (req, res) => {
    try {
        const users = await User.find({ approved: false });
        res.render('manage-users', { users, key: req.query.key });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Server Error');
    }
});

app.post('/approve-user/:id', checkStaticKey, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { approved: true });
        res.redirect('/manage-users?key=' + req.query.key);
    } catch (err) {
        console.error('Error approving user:', err);
        res.status(500).send('Server Error');
    }
});

app.post('/reject-user/:id', checkStaticKey, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/manage-users?key=' + req.query.key);
    } catch (err) {
        console.error('Error rejecting user:', err);
        res.status(500).send('Server Error');
    }
});

// Initialize the blockchain
const loginBlockchain = new Blockchain();

// Middleware to log login attempts
function logLoginAttempt(req, res, next) {
    const loginData = {
        user: req.user ? req.user.email : 'unknown',
        timestamp: new Date().toISOString(),
        ip: req.ip
    };
    const newBlock = new Block(loginBlockchain.chain.length, Date.now(), loginData);
    loginBlockchain.addBlock(newBlock);
    console.log('New login attempt logged:', newBlock);
    next();
}

// Apply the middleware to login routes
app.post('/auth/login', logLoginAttempt, (req, res, next) => {
    // ... existing login logic ...
    next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/restaurant', require('./routes/restaurant'));
app.use('/charity', require('./routes/charity'));

// Function to verify the blockchain
function verifyBlockchain() {
    if (loginBlockchain.isChainValid()) {
        console.log('Blockchain is valid.');
    } else {
        console.log('Blockchain is invalid!');
    }
}

// Call this function whenever you need to verify the blockchain
verifyBlockchain();

// Function to print the blockchain
function printBlockchain() {
    console.log('Current Blockchain:');
    loginBlockchain.chain.forEach(block => {
        console.log(block);
    });
}

// Call this function to print the blockchain
printBlockchain();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
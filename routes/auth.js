const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Login Page
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// Admin Login Page
router.get('/admin-login', (req, res) => {
    res.render('auth/admin-login', { 
        title: 'Admin Access',
        layout: 'layouts/main',
        errors: [],
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        error: req.flash('error')
    });
});

// Admin Login Handle
router.post('/admin-login', async (req, res, next) => {
    try {
        const { adminKey } = req.body;
        
        // Check if admin key matches
        if (adminKey !== 'ADMIN123') {
            req.flash('error_msg', 'Invalid admin key');
            return res.redirect('/auth/admin-login');
        }

        // Find admin user
        const admin = await User.findOne({ role: 'admin', email: 'admin@foodsystem.com' });
        
        if (!admin) {
            req.flash('error_msg', 'Admin account not found');
            return res.redirect('/auth/admin-login');
        }

        // Use passport login
        req.logIn(admin, (err) => {
            if (err) {
                console.error('Login error:', err);
                req.flash('error_msg', 'Error during login');
                return res.redirect('/auth/admin-login');
            }

            // Set session variables
            req.session.isAdmin = true;
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    req.flash('error_msg', 'Error saving session');
                    return res.redirect('/auth/admin-login');
                }
                res.redirect('/admin/dashboard');
            });
        });
    } catch (err) {
        console.error('Admin login error:', err);
        req.flash('error_msg', 'Error during login');
        res.redirect('/auth/admin-login');
    }
});

// Register Pages
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

router.get('/register-restaurant', (req, res) => {
    res.render('auth/register-restaurant', { title: 'Register Restaurant' });
});

router.get('/register-charity', (req, res) => {
    res.render('auth/register-charity', { title: 'Register Charity' });
});

// Register Handle
router.post('/register', async (req, res) => {
    const { name, email, password, password2, role, phone, address, restaurantName } = req.body;
    let errors = [];

    // Check required fields
    if (!name || !email || !password || !role) {
        errors.push({ msg: 'Please fill in all required fields' });
    }

    // Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    // Check role-specific required fields
    if (role === 'restaurant' && !restaurantName) {
        errors.push({ msg: 'Restaurant name is required for restaurant managers' });
    }
    if (role === 'charity' && !address) {
        errors.push({ msg: 'Address is required for charity managers' });
    }
    if (role !== 'admin' && !phone) {
        errors.push({ msg: 'Phone number is required' });
    }

    if (errors.length > 0) {
        // Render the appropriate form based on role
        if (role === 'restaurant') {
            res.render('auth/register-restaurant', {
                title: 'Register Restaurant',
                errors,
                name,
                email,
                phone,
                restaurantName
            });
        } else if (role === 'charity') {
            res.render('auth/register-charity', {
                title: 'Register Charity',
                errors,
                name,
                email,
                phone,
                address
            });
        } else {
            res.render('auth/register', { 
                title: 'Register',
                errors 
            });
        }
    } else {
        try {
            // Check if user exists
            const user = await User.findOne({ email });
            if (user) {
                errors.push({ msg: 'Email is already registered' });
                // Render the appropriate form based on role
                if (role === 'restaurant') {
                    res.render('auth/register-restaurant', {
                        title: 'Register Restaurant',
                        errors,
                        name,
                        email,
                        phone,
                        restaurantName
                    });
                } else if (role === 'charity') {
                    res.render('auth/register-charity', {
                        title: 'Register Charity',
                        errors,
                        name,
                        email,
                        phone,
                        address
                    });
                } else {
                    res.render('auth/register', { 
                        title: 'Register',
                        errors 
                    });
                }
            } else {
                // Create user object with only the fields needed for the role
                const userData = {
                    name,
                    email,
                    password,
                    role
                };

                // Add role-specific fields
                if (role === 'restaurant') {
                    userData.restaurantName = restaurantName;
                }
                if (role === 'charity') {
                    userData.address = address;
                }
                if (role !== 'admin') {
                    userData.phone = phone;
                }

                const newUser = new User(userData);
                await newUser.save();
                req.flash('success_msg', 'You are now registered and can log in');
                res.redirect('/auth/login');
            }
        } catch (err) {
            console.error(err);
            // Render the appropriate form based on role
            if (role === 'restaurant') {
                res.render('auth/register-restaurant', {
                    title: 'Register Restaurant',
                    errors,
                    name,
                    email,
                    phone,
                    restaurantName
                });
            } else if (role === 'charity') {
                res.render('auth/register-charity', {
                    title: 'Register Charity',
                    errors,
                    name,
                    email,
                    phone,
                    address
                });
            } else {
                res.render('auth/register', { 
                    title: 'Register',
                    errors 
                });
            }
        }
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error_msg', info.message || 'Invalid email or password');
            return res.redirect('/auth/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            if (!user.approved) {
                return res.redirect('/auth/pending-approval');
            }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
});

// Add this route for pending approval page
router.get('/pending-approval', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }
    if (req.user.approved) {
        return res.redirect('/dashboard');
    }
    res.render('auth/pending-approval', {
        title: 'Account Pending Approval',
        user: req.user,
        layout: 'layouts/main'  // Explicitly set the layout
    });
});

module.exports = router; 
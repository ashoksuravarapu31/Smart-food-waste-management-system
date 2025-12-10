const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Please log in as admin to access this page');
        return res.redirect('/auth/admin-login');
    }

    if (!req.user || req.user.role !== 'admin' || !req.session.isAdmin) {
        req.flash('error_msg', 'Access denied. Admin only.');
        req.logout((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/auth/admin-login');
        });
        return;
    }

    next();
};

// Admin Dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ approved: false });
        const approvedUsers = await User.find({ approved: true });
        res.render('admin/dashboard', {
            pendingUsers,
            approvedUsers,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading dashboard');
        res.redirect('/auth/admin-login');
    }
});

// Approve User
router.post('/approve/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/admin/dashboard');
        }

        user.approved = true;
        await user.save();
        req.flash('success_msg', 'User approved successfully');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Reject User
router.post('/reject/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/admin/dashboard');
        }

        await user.remove();
        req.flash('success_msg', 'User rejected and removed');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 
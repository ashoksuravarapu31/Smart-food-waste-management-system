const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const User = require('../models/User');

// Middleware to check if user is restaurant manager
const isRestaurantManager = (req, res, next) => {
    if (req.user && req.user.role === 'restaurant' && req.user.approved) {
        next();
    } else {
        req.flash('error_msg', 'Access denied. Approved restaurant manager only.');
        res.redirect('/');
    }
};

// Restaurant Dashboard
router.get('/dashboard', isRestaurantManager, async (req, res) => {
    try {
        const foodItems = await FoodItem.find({ restaurant: req.user._id });
        const pendingOrders = await Order.find({ 
            restaurant: req.user._id,
            status: 'pending'
        }).populate('charity');
        res.render('restaurant/dashboard', {
            foodItems,
            pendingOrders
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Food Item
router.post('/food-item', isRestaurantManager, async (req, res) => {
    try {
        const { name, quantity, unit, expiryDate, description } = req.body;
        
        // Validate required fields
        if (!name || !quantity || !unit || !expiryDate) {
            req.flash('error_msg', 'Please fill in all required fields');
            return res.redirect('/restaurant/dashboard');
        }

        // Create new date object from expiryDate
        const formattedExpiryDate = new Date(expiryDate);
        
        // Validate date
        if (isNaN(formattedExpiryDate.getTime())) {
            req.flash('error_msg', 'Invalid expiry date');
            return res.redirect('/restaurant/dashboard');
        }

        const newFoodItem = new FoodItem({
            name,
            quantity: parseFloat(quantity),
            unit,
            expiryDate: formattedExpiryDate,
            description,
            restaurant: req.user._id
        });

        await newFoodItem.save();
        req.flash('success_msg', 'Food item added successfully');
        res.redirect('/restaurant/dashboard');
    } catch (err) {
        console.error('Error adding food item:', err);
        if (err.name === 'ValidationError') {
            const errorMessages = Object.values(err.errors).map(error => error.message);
            req.flash('error_msg', errorMessages.join(', '));
        } else {
            req.flash('error_msg', 'Error adding food item. Please try again.');
        }
        res.redirect('/restaurant/dashboard');
    }
});

// Update Food Item
router.put('/food-item/:id', isRestaurantManager, async (req, res) => {
    try {
        const foodItem = await FoodItem.findOne({
            _id: req.params.id,
            restaurant: req.user._id
        });
        if (!foodItem) {
            return res.status(404).json({ msg: 'Food item not found' });
        }

        const { quantity } = req.body;
        foodItem.quantity = quantity;
        await foodItem.save();
        res.json(foodItem);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete Food Item
router.delete('/food-item/:id', isRestaurantManager, async (req, res) => {
    try {
        console.log('Attempting to delete food item:', req.params.id);
        console.log('Restaurant ID:', req.user._id);

        // First check if the item exists and belongs to the restaurant
        const foodItem = await FoodItem.findOne({
            _id: req.params.id,
            restaurant: req.user._id
        });

        if (!foodItem) {
            console.log('Food item not found or does not belong to restaurant');
            return res.status(404).json({ 
                success: false,
                msg: 'Food item not found or does not belong to your restaurant' 
            });
        }

        // Delete the item
        await FoodItem.deleteOne({ _id: req.params.id });
        
        console.log('Food item deleted successfully');
        res.json({ 
            success: true,
            msg: 'Food item deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting food item:', err);
        res.status(500).json({ 
            success: false,
            msg: 'Server Error while deleting food item',
            error: err.message 
        });
    }
});

// Accept Order
router.post('/order/accept/:id', isRestaurantManager, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            restaurant: req.user._id,
            status: 'pending'
        });
        if (!order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/restaurant/dashboard');
        }

        // Update food item quantities
        for (const item of order.items) {
            const foodItem = await FoodItem.findById(item.foodItem);
            if (foodItem.quantity < item.quantity) {
                req.flash('error_msg', 'Insufficient quantity available');
                return res.redirect('/restaurant/dashboard');
            }
            foodItem.quantity -= item.quantity;
            await foodItem.save();
        }

        order.status = 'accepted';
        await order.save();
        req.flash('success_msg', 'Order accepted successfully');
        res.redirect('/restaurant/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Reject Order
router.post('/order/reject/:id', isRestaurantManager, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            restaurant: req.user._id,
            status: 'pending'
        });
        if (!order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/restaurant/dashboard');
        }

        order.status = 'rejected';
        await order.save();
        req.flash('success_msg', 'Order rejected');
        res.redirect('/restaurant/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    charity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        foodItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    pickupAddress: {
        type: String,
        required: true
    },
    pickupTime: {
        type: Date,
        required: true
    },
    cancellationReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Add index for better query performance
orderSchema.index({ status: 1, charity: 1 });
orderSchema.index({ status: 1, restaurant: 1 });

module.exports = mongoose.model('Order', orderSchema); 
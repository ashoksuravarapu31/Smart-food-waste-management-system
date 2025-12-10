const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: [
            'White rice',
            'Dal',
            'Currys',
            'Chicken curry', 
            'Mutton curry',
            'Fruits',
            'Bread',
            'Pasta',
            'Sambar',
            'Biryani'
        ]
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'l', 'ml', 'pieces']
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodItem', foodItemSchema); 
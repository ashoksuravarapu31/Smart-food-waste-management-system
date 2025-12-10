🚀 Smart Food Waste Management System
A Blockchain-Integrated Solution to Reduce Food Waste & Support Charities

This project is a full-stack web application that connects restaurants, charity organizations, and admins to efficiently manage surplus food using blockchain for transparency, Node.js backend, MongoDB database, and EJS templates for the front-end.

The system allows restaurants to donate excess food, charities to request it, and the admin to verify users.
Every food transaction is recorded on a custom blockchain, ensuring full traceability and trust.

⭐ Features
👨‍🍳 For Restaurants

Register & login securely

Add surplus food items

Update or delete food listings

Track donation history

View blockchain logs of donated food

🏥 For Charities / NGOs

Register & login

View available food from restaurants

Request food donations

Track past requests

Transparent donation history powered by blockchain

🛡️ For Admin

Approve or reject registration requests

Manage all users

Monitor food distributions

View full blockchain ledger

🔗 Blockchain Integration

Custom blockchain implemented using JavaScript

Each donation = new block

Ensures integrity, immutability, and traceability

🏗️ Tech Stack
Layer	Technologies
Frontend	EJS, HTML5, CSS3
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
Authentication	Passport.js, bcrypt
Blockchain	Custom JS Blockchain
Session Management	express-session
Templating	EJS Views
📂 Project Folder Structure
Smart-food-waste-management-system/
│
├── config/             # Passport config, MongoDB connection
├── middleware/         # Authentication middleware
├── models/             # Mongoose DB schemas (User, FoodItem, Order)
├── public/             # CSS, JS, images
├── routes/             # All Express routes (auth, user, admin)
├── views/              # Frontend EJS templates
│
├── app.js              # Main Express server
├── blockchain.js       # Custom blockchain logic
├── base.txt            # Sample blockchain base data
├── package.json        # Project metadata & dependencies
└── README.md           # Documentation

⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/ashoksuravarapu31/smart-food-waste-management-system.git

2️⃣ Install dependencies
npm install

3️⃣ Create a .env file

Example:

MONGO_URI=mongodb://localhost:27017/foodmanagement
SESSION_SECRET=yourSecretKey
PORT=3000

4️⃣ Run the application
npm start


or

node app.js

5️⃣ Open in browser
http://localhost:3000

🔗 Blockchain Workflow
Restaurant Donates Food
        ↓
System Creates a Block
        ↓
Block Contains:
 - Food ID
 - Donor ID
 - Charity ID
 - Timestamp
 - Previous Hash
 - Current Hash
        ↓
Block Added to Chain → Immutable record


This ensures 100% transparency for food donations.

📸 Screenshots (Add yours here)
Add images like:
- Login page
- Admin dashboard
- Restaurant food upload page
- Blockchain ledger view
- Charity request page

🚀 Future Enhancements

Add email/SMS notification system

Implement real-time food tracking

Integrate live map for nearest restaurants

AI-based food demand prediction

Mobile app version

👨‍💻 Developed By

Ashok Suravarapu
BCA-A VI Semester
Guided by Dr. Abadhan Ranganath

📜 License

This project is open-source and available under the MIT License.

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/securepay';

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@securepay.com' });
        if (existingAdmin) {
            console.log('Admin user already exists:');
            console.log('  Email: admin@securepay.com');
            console.log('  Password: admin123');
            console.log('  Role:', existingAdmin.role);

            // Ensure role is admin
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('  -> Updated role to admin');
            }
        } else {
            // Create admin user
            const admin = await User.create({
                name: 'Admin',
                email: 'admin@securepay.com',
                password: 'admin123',
                role: 'admin'
            });
            console.log('Admin user created successfully!');
            console.log('  Email: admin@securepay.com');
            console.log('  Password: admin123');
            console.log('  Role: admin');
        }

        // Also create a demo regular user
        const existingUser = await User.findOne({ email: 'user@securepay.com' });
        if (!existingUser) {
            await User.create({
                name: 'Demo User',
                email: 'user@securepay.com',
                password: 'user123',
                role: 'user'
            });
            console.log('\nDemo user created:');
            console.log('  Email: user@securepay.com');
            console.log('  Password: user123');
        } else {
            console.log('\nDemo user already exists:');
            console.log('  Email: user@securepay.com');
            console.log('  Password: user123');
        }

        await mongoose.disconnect();
        console.log('\nDone! You can now login with these credentials.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedAdmin();

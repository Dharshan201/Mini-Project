/**
 * Seed script to create initial admin user
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./db/connection');

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@securepay.com' });

        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log('   Email: admin@securepay.com');
            console.log('   Password: admin123');
        } else {
            // Create admin user
            const admin = await User.create({
                name: 'Admin User',
                email: 'admin@securepay.com',
                password: 'admin123',
                role: 'admin'
            });

            console.log('✅ Admin user created successfully!');
            console.log('   Email:', admin.email);
            console.log('   Password: admin123');
        }

        // Create a demo regular user
        const existingUser = await User.findOne({ email: 'demo@securepay.com' });

        if (existingUser) {
            console.log('✅ Demo user already exists');
            console.log('   Email: demo@securepay.com');
            console.log('   Password: demo123');
        } else {
            const user = await User.create({
                name: 'Demo User',
                email: 'demo@securepay.com',
                password: 'demo123',
                role: 'user'
            });

            console.log('✅ Demo user created successfully!');
            console.log('   Email:', user.email);
            console.log('   Password: demo123');
        }

        console.log('\n🚀 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAnnouncements() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Announcement = require('./models/Announcement');
        const count = await Announcement.countDocuments();
        const active = await Announcement.find({ isActive: true });
        console.log(`Total Announcements: ${count}`);
        console.log(`Active Announcements: ${active.length}`);
        if (active.length > 0) {
            console.log('Sample Active:', JSON.stringify(active[0], null, 2));
            const now = new Date();
            console.log('Current Time:', now);
        }
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
checkAnnouncements();

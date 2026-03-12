const mongoose = require('mongoose');
require('dotenv').config();

async function checkSystemSettings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const settings = await db.collection('systemsettings').findOne();

        if (!settings) {
            console.log('No settings found');
            return;
        }

        const size = JSON.stringify(settings).length;
        console.log(`Settings Size: ${(size / 1024).toFixed(2)} KB`);

        if (settings.qrImageUrl && settings.qrImageUrl.startsWith('data:')) {
            console.log('QR Image is BASE64!');
            console.log(`QR Base64 Size: ${(settings.qrImageUrl.length / 1024).toFixed(2)} KB`);
        } else {
            console.log(`QR Image path: ${settings.qrImageUrl}`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

checkSystemSettings();

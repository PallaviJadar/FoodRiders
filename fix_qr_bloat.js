const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixQR() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const SystemSettings = require('./server/models/SystemSettings');
        const settings = await SystemSettings.findOne();

        if (settings && settings.qrImageUrl && settings.qrImageUrl.startsWith('data:')) {
            console.log('Converting QR Base64 to File...');
            const filename = `qr_payment_${Date.now()}.png`;
            const base64Data = settings.qrImageUrl.split(';base64,').pop();
            const buffer = Buffer.from(base64Data, 'base64');

            const uploadsDir = path.join(__dirname, 'server', 'uploads');
            const rootUploadsDir = path.join(__dirname, 'uploads');

            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            if (!fs.existsSync(rootUploadsDir)) fs.mkdirSync(rootUploadsDir, { recursive: true });

            fs.writeFileSync(path.join(uploadsDir, filename), buffer);
            fs.writeFileSync(path.join(rootUploadsDir, filename), buffer);

            settings.qrImageUrl = filename; // We will handle prefix in route
            await settings.save();
            console.log(`✅ QR Migration Complete: ${filename}`);
        } else {
            console.log('QR is already a path or missing.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fixQR();

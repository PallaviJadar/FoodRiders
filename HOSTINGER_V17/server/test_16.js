require('dotenv').config();
const nodemailer = require('nodemailer');

const test = async () => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'foodriders.in@gmail.com',
            pass: 'pfwtcqgjryqnavre' // Trying 16 characters
        }
    });

    try {
        await transporter.verify();
        console.log('✅ 16-char password worked!');
    } catch (e) {
        console.log('❌ 16-char password failed:', e.message);
    }
};
test();

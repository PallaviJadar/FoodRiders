const nodemailer = require('nodemailer');

const test = async () => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'foodriders.in@gmail.com',
            pass: 'pfwtcqgjryqnavrel'
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Port 587 worked!');
    } catch (e) {
        console.log('❌ Port 587 failed:', e.message);
    }
};
test();

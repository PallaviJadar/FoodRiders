const nodemailer = require('nodemailer');

const test = async () => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'foodriders.in@gmail.com',
            pass: 'fwtcqgjryqnavrel' // Trying skipping first char
        }
    });

    try {
        await transporter.verify();
        console.log('✅ fwtcqgjryqnavrel worked!');
    } catch (e) {
        console.log('❌ fwtcqgjryqnavrel failed:', e.message);
    }
};
test();

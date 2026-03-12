require('dotenv').config();
const { sendAdminOrderEmail } = require('./utils/email');

const testEmail = async () => {
    console.log('Testing email with:', process.env.EMAIL_USER);
    const result = await sendAdminOrderEmail({
        _id: 'testid123456789',
        userDetails: { name: 'Test User', phone: '1234567890' },
        totalAmount: 100,
        paymentMode: 'COD',
        items: [{ name: 'Test Item', quantity: 1, price: 100 }]
    }, 'foodriders.in@gmail.com', 'NEW_ORDER');
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
};

testEmail();

const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/delivery/login', {
            mobile: '8762037422',
            password: '0000'
        });
        console.log('Login Success:', res.data);
        const token = res.data.token;

        const verifyRes = await axios.get('http://localhost:5000/api/delivery/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Verify Success:', verifyRes.data);

        const ordersRes = await axios.get('http://localhost:5000/api/delivery/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Orders Success:', ordersRes.data);
    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}
testLogin();

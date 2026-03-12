const axios = require('axios');

async function testAuth() {
    try {
        console.log('Testing Admin Login...');
        const loginRes = await axios.post('https://www.foodriders.in/api/admin/login', {
            mobile: '8762037422',
            pin: '2026'
        });

        console.log('Login Success! Token received:', loginRes.data.token.substring(0, 20) + '...');
        const token = loginRes.data.token;

        console.log('Testing Protected Route (/api/admin/users)...');
        const usersRes = await axios.get('https://www.foodriders.in/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Protected Route Success! Users found:', usersRes.data.length);

    } catch (err) {
        console.error('Auth Test Failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

testAuth();

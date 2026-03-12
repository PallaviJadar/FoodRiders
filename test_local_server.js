const axios = require('axios');
const port = process.argv[2] || 5000;

async function checkLocalhost() {
    try {
        console.log(`Checking http://localhost:${port}/ping ...`);
        const ping = await axios.get(`http://localhost:${port}/ping`);
        console.log('Ping status:', ping.status, ping.data);

        console.log(`Checking http://localhost:${port}/uploads/test.png ...`);
        const img = await axios.head(`http://localhost:${port}/uploads/test.png`);
        console.log('Image status:', img.status);
    } catch (err) {
        console.error('Localhost check failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

checkLocalhost();

const http = require('http');

const testSound = (path) => {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:5000${path}`, (res) => {
            console.log(`Path: ${path} | Status: ${res.statusCode} | Content-Type: ${res.headers['content-type']}`);
            resolve(res.statusCode);
        });
        req.on('error', (e) => {
            console.log(`Path: ${path} | Error: ${e.message}`);
            resolve(500);
        });
        req.setTimeout(2000, () => {
            console.log(`Path: ${path} | Timeout`);
            req.destroy();
            resolve(408);
        });
    });
};

(async () => {
    await testSound('/sounds/siren_admin.mp3');
    await testSound('/public/sounds/siren_admin.mp3');
    await testSound('/assets/sounds/siren_admin.mp3');
})();

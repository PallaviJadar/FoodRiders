const express = require('express');
const app = express();

try {
    app.use(express.json());
    console.log("Express JSON Middleware added.");
} catch (e) {
    console.error("Failed to add middleware:", e);
}

app.post('/', (req, res) => {
    console.log("Body:", req.body);
    res.json(req.body);
});

app.listen(5001, () => {
    console.log("Test Server running on 5001");
});

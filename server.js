const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send(`
        <h1>Oriflame Campaign Dashboard</h1>
        <p>✔️ Successfully Sent: 45</p>
        <p>❌ Failed: 2</p>
        <p>Status: Running smoothly 🚀</p>
    `);
});

app.listen(PORT, () => {
    console.log(`📊 Dashboard is live at http://localhost:${PORT}`);
});
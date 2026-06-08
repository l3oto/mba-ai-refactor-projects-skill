const express = require('express');
const { init } = require('./models/Database');
const checkoutRoutes = require('./routes/checkoutRoutes');
const errorHandler = require('./middleware/errorHandler');
const { port } = require('./config/settings');

const app = express();
app.use(express.json());
app.use(checkoutRoutes);
app.use(errorHandler);

init().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
}).catch((err) => {
    console.error('Falha ao iniciar servidor:', err);
    process.exit(1);
});

module.exports = app;

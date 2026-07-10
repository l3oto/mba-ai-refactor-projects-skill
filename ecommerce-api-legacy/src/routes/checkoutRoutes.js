const express = require('express');
const { checkout } = require('../controllers/CheckoutController');
const { financialReport, deleteUser } = require('../controllers/ReportController');
const { login } = require('../controllers/AuthController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/api/checkout', checkout);
router.post('/api/login', login);
router.get('/api/admin/financial-report', requireAuth, financialReport);
router.delete('/api/users/:id', deleteUser);

module.exports = router;

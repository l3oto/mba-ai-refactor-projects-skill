const express = require('express');
const { checkout } = require('../controllers/CheckoutController');
const { financialReport, deleteUser } = require('../controllers/ReportController');

const router = express.Router();

router.post('/api/checkout', checkout);
router.get('/api/admin/financial-report', financialReport);
router.delete('/api/users/:id', deleteUser);

module.exports = router;

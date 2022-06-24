const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');

//router.get('/:page', controller.getNewOrders);
router.post('/create', controller.createOrder);
router.post('/update', controller.updateOrderStatus);

router.get('/', controller.index);
module.exports = router;

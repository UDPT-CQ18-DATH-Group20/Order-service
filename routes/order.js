const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');

//router.get('/:page', controller.getNewOrders);
//router.post('/createOrder', controller.createOrder);
router.post('/create', controller.createOrder);
router.post('/update', controller.updateOrderStatus);
router.get('/customerOrders', controller.loadOrdersOfCustomer);
router.get('/storeOrders', controller.loadOrdersFromStore);
router.get('/readyOrders', controller.loadReadyOrders);




// router.get('/', controller.index);
module.exports = router;

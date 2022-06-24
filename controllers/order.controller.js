const Order = require('../models/order.model');
const Item = require('../models/item.model');

const mongoose = require('mongoose');

class OrderController {
    async index(req, res) {
        res.send({
            Test: 'success'
        })
    }

    async updateOrderStatus(req, res) {
        console.log(req.body)
        update = { status: req.body.status}
        Order.updateOrderById(req.body, update)
            .then(function (result) {
                res.send({
                    result
                })
            })
            .catch(error => {
                res.status(401).send({
                    error
                })
            });
    }

    async createOrder(req, res) {
        let failed = false;
        let order = {
            _id: mongoose.Types.ObjectId(),
            account_id: req.body.account_id,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            total_amount: req.body.total_amount,
            date: req.body.date
        }

        
        await Order.addOrder(order)
            .catch(error => {
                failed = true;
                res.status(424).send({
                    error
                })
            });
        
        if(failed) return;
        items = req.body.items;

        //item handling

        items.forEach(item => {
            newItem = {
                _id: mongoose.Types.ObjectId(),
                order_id: order._id,
                goods_id: item.goods_id,
                goods_name: item.good_name,
                img_url: item.img_url,
                quantity: item.quantity,
                sum_amount: Item.sumAmount(items)
            }
            //await Item.addItem(item)
        })
    }
}

module.exports = new OrderController();
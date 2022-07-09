const Order = require('../models/order.model');
const Item = require('../models/item.model');

const superagent = require('superagent');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { request } = require('../app');

class OrderController {
    async createOrder(req, res) {
        let failed = false;
        let Authorization = req.header('Authorization')
        if (!Authorization) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            failed = true
        }

        if(failed) return
        let token = Authorization.replace('Bearer ', '')
        let data = jwt.verify(token, process.env.JWT_KEY)
        let totalPrice = 0
        await superagent
            .get('http://localhost:3002/api/cart')
            //.send({ user_id: data.user_id }) // sends a JSON post body
            .set('X-API-Key', 'foobar')
            .set('accept', 'json')
            .set('Authorization', req.header('Authorization'))
            .then(response => {
                    console.log(response.body)
                    response.body.items.forEach(item => {
                        totalPrice += item.sum_amount
                    })
            })
            .catch(err => {
                failed = true;
                console.log(err.status);
                res.status(err.status).send({
                    error: 'Failed to get items from cart'
                })
            })

        if (failed) return
        let order = {
            _id: mongoose.Types.ObjectId(),
            account_id: data._id,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            receiver_name: req.body.receiver,
            total_amount: totalPrice,
            date: new Date()
        }

        await Order.addOrder(order)
            .then(result => {
                res.send({
                    result: 'Success'
                })
            })
            .catch(error => {
                console.log(error)
                failed = true;
                res.status(424).send({
                    result: 'Error while adding order to database'
                })
            });
    }

    async updateOrderStatus(req, res) {
        console.log(req.body)
        let update = { status: req.body.status}
        Order.updateOrderById(req.body.id, update)
            .then(function (result) {
                res.send({
                    result: 'Success'
                })
            })
            .catch(error => {
                res.status(401).send({
                    error: 'Failed while updating order'
                })
            });
    }

    async index(req, res) {
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
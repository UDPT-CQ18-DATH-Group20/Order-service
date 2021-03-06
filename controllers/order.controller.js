const Order = require('../models/order.model');
// const Item = require('../models/item.model');

const superagent = require('superagent');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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

        //Role check
        if (data.user_type !== 1) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        let totalPrice = 0
        let items = []
        let goods = []
        await superagent
            .get('http://host.docker.internal:3002/api/cart')
            .set('X-API-Key', 'foobar')
            .set('accept', 'json')
            .set('Authorization', req.header('Authorization'))
            .then(response => {
                    //console.log(response.body)
                    items = response.body.items
                    response.body.items.forEach(item => {
                        totalPrice += item.sum_amount
                        let good = { }
                        good.goods_id = item.goods_id
                        good.amount = item.quantity
                        //console.log(good)
                        goods.push(good)
                    })
                    //console.log(goods)
            })
            .catch(err => {
                failed = true;
                //console.log(err.status);
                res.status(424).send({
                    error: 'Failed to get items from cart'
                })
            })
        
        if (failed) return
        let updates = []
        //Call api to get store of good
        await superagent
            .patch('http://host.docker.internal:3001/api/goods/order-transaction')
            .send(goods)
            .set('X-API-Key', 'foobar')
            .set('accept', 'json')
            .set('Authorization', req.header('Authorization'))
            .then(response => {
                    let mergeItems = items.map((item, i) => Object.assign({}, item, response.body[i]));
                    //console.log( "mergeItems", mergeItems)
                    //let storeGroup = mergeItems.group( ({ store_id }) => store_id );
                    const storeGroup = mergeItems.reduce((group, product) => {
                        const { store_id } = product;
                        group[store_id] = group[store_id] ?? [];
                        group[store_id].push(product);
                        return group;
                      }, {});

                    //console.log( "storeGroup", storeGroup)
                    for (const [key, value] of Object.entries(storeGroup)) {
                        //console.log(key, value);
                        let order = {
                            _id: mongoose.Types.ObjectId(),
                            account_id: data._id,
                            phone: req.body.phone,
                            email: req.body.email,
                            address: req.body.address,
                            receiver_name: req.body.receiver,
                            total_amount: totalPrice,
                            date: new Date(),
                            items: value,
                            order_id: key
                        }
                        updates.push(order)
                    }
                    //console.log("updates",updates)
            })
            .catch(err => {
                failed = true;
                //console.log(err.status);
                res.status(424).send({
                    error: 'Failed to get store info of items'
                })
            })

        if (failed) return
        await Order.addOrders(updates)
            .catch(error => {
                console.log(error)
                failed = true;
                res.status(424).send({
                    result: 'Error while adding order to database'
                })
            });
        
        if (failed) return
        //Empty cart
        await superagent
            .put('http://host.docker.internal:3002/api/cart/empty-cart')
            //.send({ user_id: data.user_id }) // sends a JSON post body
            .set('X-API-Key', 'foobar')
            .set('accept', 'json')
            .set('Authorization', req.header('Authorization'))
            .then(response => {
                    console.log(response.body)
                    res.send({
                        result: 'Success'
                    })
            })
            .catch(err => {
                failed = true;
                console.log(err.status);
                res.status(err.status).send({
                    error: 'Failed to get items from cart'
                })
            })
    }

    async updateOrderStatus(req, res) {
        //console.log(req.body)
        let Authorization = req.header('Authorization')
        if (!Authorization) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        //Role check
        let token = Authorization.replace('Bearer ', '')
        let data = jwt.verify(token, process.env.JWT_KEY)
        //console.log(data)
        if (data.user_type == 1 || data.user_type== 4) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        let update = { status: req.body.status}
        Order.updateOrderById({ _id: req.body.order_id }, update)
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

    async loadOrdersOfCustomer(req, res) {
        let Authorization = req.header('Authorization')
        if (!Authorization) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        //Role check
        let token = Authorization.replace('Bearer ', '')
        let data = jwt.verify(token, process.env.JWT_KEY)

        if (data.user_type !== 1) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        let options = {
            page: 1,
            limit: 30,
        }; 
        //check for pagination require.
        if(req.params.page) options['page'] = parseInt(req.params.page)

        Order.loadWithPagination({ account_id: data._id }, options)
            .then(function (result) {
                //console.log(result.docs)
                res.send(
                    result.docs
                )
            })
            .catch(error => {
                console.log(error)
                res.status(401).send({
                    error: 'Failed to find resources.'
                })
            });
    }
    
    async loadOrdersFromStore(req, res) {
        let Authorization = req.header('Authorization')
        if (!Authorization) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        //Role check
        let token = Authorization.replace('Bearer ', '')
        let data = jwt.verify(token, process.env.JWT_KEY)
        //console.log(data)
        if (data.user_type !== 2) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        await superagent
            .get('http://host.docker.internal:3001/api/store')
            .set('X-API-Key', 'foobar')
            .set('accept', 'json')
            .set('Authorization', req.header('Authorization'))
            .then(response => {
                    console.log(response.body)
                    //store_id = response.body._id
            })
            .catch(err => {
                failed = true;
                //console.log(err.status);
                res.status(424).send({
                    error: 'Failed to get store info of items'
                })
            })
            
        let options = {
            page: 1,
            limit: 30,
        }; 
        //check for pagination require.
        if(req.params.page) options['page'] = parseInt(req.params.page)

        Order.loadWithPagination({
            $or: [ { status: 'In process' },  { status: 'Submitted' } ]}, options)
            .then(function (result) {
                //console.log(result)
                res.send(
                    result.docs
                )
            })
            .catch(error => {
                res.status(401).send({
                    error: 'Failed while finding resources'
                })
            });
    }

    async loadReadyOrders(req, res) {
        //console.log(req.body)
        let Authorization = req.header('Authorization')
        if (!Authorization) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        //Role check
        let token = Authorization.replace('Bearer ', '')
        let data = jwt.verify(token, process.env.JWT_KEY)
        //console.log(data)
        if (data.user_type !== 3) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        let options = {
            page: 1,
            limit: 10,
        }; 
        //check for pagination require.
        if(req.params.page) options['page'] = parseInt(req.params.page)

        Order.loadWithPagination({ 
            $or: [ { status: 'Ready to delivery' },  { status: 'On delivery' } ] }, options)
            .then(function (result) {
                //console.log(result)
                res.send(
                    result.docs
                )
            })
            .catch(error => {
                res.status(401).send({
                    error: 'Failed while finding resources'
                })
            });
    }
    async updateIsComment(req, res) {
        //console.log(req.body)
        let Authorization = req.header('Authorization')
        if (!Authorization) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }

        //Role check
        let token = Authorization.replace('Bearer ', '')
        let data = jwt.verify(token, process.env.JWT_KEY)
        //console.log(data)
        if (data.user_type !== 1) {
            res.status(401).send({
                error: 'Not authorized for this resource.'
            })
            return
        }
        let order = await Order.getOrderById(req.body.order_id)
        let index = order.items.findIndex((e)=> e.goods_id == req.body.goods_id);
        if ( index == -1) {
            res.status(401).send({
                error: 'kh??ng t??m th???y s???n ph???m trong ho?? ????n'
            })
            return
        }
        order.items[index].is_comment = true;
        await order.save()
        res.send(true)
    }
}

module.exports = new OrderController();
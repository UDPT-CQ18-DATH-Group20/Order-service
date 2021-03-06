const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const orderSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true,
    },
    account_id: {
        type: String,
        required: true
    },
    receiver_name: {
        type: String ,
        required: true
    },
    phone: {
         type: String,
         required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    items: [{
        goods_id: {
            type: String,
            //required: true
        },
        name: {
            type: String,
            //required: true
        },
        picture: {
            type: String,
        },
        quantity: {
            type: Number,
            auto: 1
        },
        sum_amount: {
            type: Number,
            auto: 0
        },
        is_comment: {
            type: Boolean,
            default: false
        }
    }],
    store_id: {
        type: String,
        //required: true
    },
    total_amount: {
        type: Number,
        auto: 0
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String, 
        required: true, 
        default: "Submitted"
    },
});

orderSchema.plugin(mongoosePaginate);
const Order = mongoose.model('Order', orderSchema);
module.exports  = {
    async loadWithPagination(filter, options) {
        return await Order.paginate(filter, options)
    },

    async updateOrderById(id, update) {
        return await Order.findOneAndUpdate(id, update, {
            new: true,
        });
    },

    async addOrder(order) {
        return await Order.create(order);
    },

    async addOrders(orders) {
        return await Order.insertMany(orders);
    },

    async getOrderById(id) {
        return await Order.findById(id);
    },

}
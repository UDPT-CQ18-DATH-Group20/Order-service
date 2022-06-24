const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//const mongoosePaginate = require('mongoose-paginate-v2');

const itemSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true,
    },
    order_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    goods_id: {
        type: String,
        required: true
    },
    goods_name: {
        type: String,
        required: true
    },
    img_url: {
        type: String,
    },
    quantity: {
        type: Number,
        auto: 1
    },
    sum_amount: {
        type: Number,
        auto: 0
    }
});

//itemSchema.plugin(mongoosePaginate);
const Item = mongoose.model('Item', itemSchema);
module.exports  = {
    // async loadWithPagination(filter, options) {
    //     return await Order.paginate(filter, options)
    // },

    // async updateOrderById(id, update) {
    //     return await Item.findOneAndUpdate(id, update, {
    //         new: true
    //     });
    // },

    async addItem(item) {
        return await Item.create(item);
    },

    async getItemById(id) {
        return await Item.findOne(id);
    },

}
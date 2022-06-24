//Mongodb
const mongoose = require('mongoose');

var driver;

module.exports = {
    connectMongoDB(url) {
        mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
            .then((result => console.log('Connected successfully to server')))
            .catch((error) => console.log(error))
    },
}
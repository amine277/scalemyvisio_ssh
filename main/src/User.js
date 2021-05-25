const mongoose = require('mongoose');

const userShema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    email:{
        type: String,
        required: true,
        min: 4,
        max: 255
    },
    password:{
        type: String,
        required: true,
        min: 4,
        max: 20
    },
    room: {
        type: String,
        default : null
    },
    stream: {
        type: String,
        default : null
    },
    role: {
        type: Number,
        default : null
    },
    date: {
        type: Date,
        default : Date.now
    }
})


module.exports = mongoose.model('User', userShema);
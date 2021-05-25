const { Long, Double } = require('bson');
const mongoose = require('mongoose');

const roomShema = new mongoose.Schema({
    admin:{
        type: String,
    },  
    url:{
        type: String,
    },
    type:{
        type: Number,
        required: true,
        default : 0
    },
    password:{
        type: String,
        default : null,
        max: 4
    },
    name:{
        type: String,
        required: true,
        min: 1,
        max: 255
    },
    participant: {
        type: Array,
        default : []
    },

    viewers: {
        type: Array,
        default : []

    },
    streamed: {
        type: String,
        default : 0
    },

    date: {
        type: Date,
        default : Date.now
    }
})


module.exports = mongoose.model('Room', roomShema);
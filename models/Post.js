const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    categories: {
        type: [String],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    // property ('createdBy') == path
    // ref ("user") == model
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    massages: [{
        messageBody: {
            type: String,
            required: true
        },
        massageDate: {
            type: Date,
            default: Date.now
        },
        massageUser: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }]
});

module.exports = mongoose.model('Post', PostSchema);
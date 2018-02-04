"use strict";

// Project model
var mongoose = require('mongoose');
let validators = require('mongoose-validators');
var Token = mongoose.model('Token', {
    userId: {
        type: String,
        required: true
    },
    token: {
        type: String,
    },
    createdAt: {
        type: Date
    }
})

var User = mongoose.model('User', {
    fname: {
        type: String,
        required: true
    },

    lname: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }
})

var Post = mongoose.model('Post', {
    poster: {
        type: Object
    },
    content: {
        type: String
    },
    likes: {
        type: Array
    },
    comments: {
        type: Array,
    },
    createdAt: {
        type: Date
    }
})

module.exports = {
    Post: Post,
    User: User,
    Token: Token
}

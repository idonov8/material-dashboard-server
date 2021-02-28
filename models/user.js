const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    company: String,
    email: String,
    firstName: String,
    lastName: String,
    city: String,
    country: String,
    postalCode: String,
    aboutMe: String
})

module.exports = mongoose.model('User', userSchema)
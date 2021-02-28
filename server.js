require('dotenv').config()

const port = 4000;
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/user.js')

mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@workaway-proj.xqvyp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

app.use(express.json())
app.use(cors())

let refreshTokens = [] // TODO: Move to mongoDB

app.post('/users', async (req,res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const { username, company, email, firstName, lastName, city, country, postalCode, aboutMe } = req.body
        const user = new User({ 
            username,
            password: hashedPassword,
            company, email, firstName, 
            lastName, city, country, postalCode, aboutMe
        })
        user.save().then(() => {
            console.log("Created user: ", username)
            res.status(201).send()
        })
        .catch(()=> {
            res.status(409).send('Username taken')
        })
    } catch(err) {
        console.log(err.message)
        res.status(500).send()
    }
})
app.post('/login', (req, res) => {
    User.findOne({username: req.body.username})
    .then(async (user) => {
        if (user===null) return res.status(400).send('Cannot find user')
        try {
            if(await bcrypt.compare(req.body.password, user.password)){
                const accessToken = generateAccessToken(user)
                const refreshToken = jwt.sign({user}, process.env.REFRESH_TOKEN_SECRET)
                refreshTokens.push(refreshToken) // TODO: Move to MongoDB
                res.json({user, accessToken, refreshToken})
            } else {
                res.json({error: 'Wrong Password'})
            }
        } catch(err) {
            console.log(err.message)
            res.status(500).send()
        }
    })
    .catch(() => {
        return res.status(500)
    })
})

app.post('/token', (req, res) => {
    console.log("Got here")
    const refreshToken = req.body.refreshToken
    if (refreshToken == null) return res.sendStatus(401)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403) // TODO: Check from MongoDB
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken(user)
        res.json({ user, accessToken })
    })
})

app.delete('/logout', (req, res) => {
    // TODO: delete from MongoDB
    refreshTokens = refreshTokens.filter(token => token !== req.body.refreshToken)
    res.sendStatus(204)
})
app.get('/auto_login', authenticateToken, (req, res) => {
    res.json( { user: req.user, accessToken: req.token})
})

function authenticateToken(req, res, next){
    const authHeader = req.header('Authorization')
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, {user})=> {
        if (err) return res.sendStatus(403)
        req.user = user
        req.token = token
        next()
    })
}

function generateAccessToken(user) {
    return jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' })
}

app.listen(port)
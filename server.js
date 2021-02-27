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

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Test'
    })
})

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
    } catch {
        res.status(500).send()
    }
})
app.post('/login', (req, res) => {
    User.findOne({username: req.body.username})
    .then(async (user) => {
        if (user===null) return res.status(400).send('Cannot find user')
        try {
            if(await bcrypt.compare(req.body.password, user.password)){
                const accessToken = jwt.sign(user.username, process.env.ACCESS_TOKEN_SECRET)
                res.json({user, accessToken})
            } else {
                res.json({error: 'Wrong Password'})
            }
        } catch {
            res.status(500).send()
        }
    })
    .catch(() => {
        return res.status(500)
    })
    
})

app.get('/auto_login', authenticateToken, (req, res) => {
    console.log(req.user)
    res.json( { user: req.user, accessToken: req.token})
})

function authenticateToken(req, res, next){
    const authHeader = req.header('Authorization')
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, username)=> {
        if (err) return res.sendStatus(403)
        req.user = await User.findOne({username: username}).exec()
        req.token = token
        next()
    })
}

app.listen(port)
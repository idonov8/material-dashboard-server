require('dotenv').config()

const port = 4000;
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')

app.use(express.json())
app.use(cors())

const users = []

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Test'
    })
})

app.post('/users', async (req,res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = { username: req.body.username, password: hashedPassword }
        users.push(user)
        console.log("created user ", user)
        res.status(201).send()
    } catch {
        res.status(500).send()
    }
})
app.post('/login', async (req, res) => {
    const user = users.find( user => user.username === req.body.username)
    if (user == null) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)){
            //res.send('Success')
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.json( { accessToken: accessToken})
        } else {
            res.json({error: 'Wrong Password'})
        }
    } catch {
        res.status(500).send()
    }
})

app.get('/auto_login', authenticateToken, (req, res) => {
    res.json( { accessToken: req.token})
})

function authenticateToken(req, res, next){
    const authHeader = req.header('Authorization')
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401)
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=> {
        if (err) return res.sendStatus(403)
        req.user = user
        req.token = token
        next()
    })
}

app.listen(port)
require('dotenv').config()

const port = 4000;
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

app.use(express.json())

const users = []

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Test'
    })
})

app.post('/users', async (req,res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = { name: req.body.name, password: hashedPassword }
        users.push(user)
        console.log("created user ", user)
        res.status(201).send()
    } catch {
        res.status(500).send()
    }
})
app.post('/login', async (req, res) => {
    const user = users.find( user => user.name === req.body.name)
    console.log(user)
    if (user == null) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)){
            //res.send('Success')
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.json( { accessToken: accessToken})
        } else {
            res.send('Wrong Password')
        }
    } catch {
        res.status(500).send()
    }
})

app.get('/auto_login', authenticateToken, (req, res) => {
    res.send('Token is valid :)')
})

function authenticateToken(req, res, next){
    const authHeader = req.header['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401)
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=> {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

app.listen(port)
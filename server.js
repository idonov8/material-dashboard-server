const port = 4000;
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Test'
    })
})

app.post('login', (req, res) => {

})

app.listen(port)
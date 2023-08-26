const express = require('express')
const routes = require('./routes')
var cors = require('cors')
const app = express()
const PORT = 80

app.use(express.json())
app.use(routes)
app.use(cors({
    origin: 'https://haveal-frontend.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.post('/', (req, res) => {
    const { numero1, numero2 } = req.body
    res.status(200).json(numero1 + numero2)
})

app.listen(PORT, () => {
    console.log("listening on port 3001")
})
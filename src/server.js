const express = require('express')
const routes = require('./routes')
var cors = require('cors')
const app = express()
const PORT = 3001

app.use(express.json())
//const corsOptions = {
//    origin: 'http://localhost:3000'
//  };
//  
//  app.use(cors(corsOptions));
app.use(cors())
app.use(routes)

app.post('/', (req, res) => {
    const { numero1, numero2 } = req.body
    res.status(200).json(numero1 + numero2)
})

app.listen(PORT, () => {
    console.log("listening on port 3001")
})
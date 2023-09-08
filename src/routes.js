const express = require('express')
const multer = require("multer")
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const routes = express.Router()
const jwt = require("jsonwebtoken")
const cors = require('cors')


const Multer = multer({
    storage: multer.memoryStorage(),
    limits: 1024 * 1024 * 1024,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
          cb(null, true);
        } else {
          cb(new Error('Only JPG and PNG images are allowed'));
        }
      }
})

routes.use(cors({
  origin: process.env.FRONTEND,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

const insert = require("./controllers/uploadController")
const deletes = require("./controllers/deleteController")
const { login } = require("./controllers/registerController")
const getitencar = require('./controllers/getitemarraycontroller')

const uploadImage = require("./services/firebase")
const { app } = require('firebase-admin')
const payment = require("./controllers/payController")
const confirmpayment = require("./controllers/comfirmpayController")
const products = require('./controllers/searchItensController')
const getshops = require("./controllers/getshopsController")
const getshopsbyadm = require("./controllers/getshopsbyadmController")
const getshop = require("./controllers/getshopController")
const deleteorder = require("./controllers/deleteorderController")
const rastreioupdate = require("./controllers/rastreioupdateController")

//public route

routes.post("/getitemcar", getitencar)
routes.post("/login", login)

routes.get("/products", products)
routes.post("/product", async (req, res) => {
  const { slug } = req.body
  const product = await prisma.produtos.findMany({
    where: {
      slug:slug
    }
  })
  if(product){
    return res.send(product)
  }else{
    return res.status(422).json({ error: 'Erro ao consultar' });
  }

})
routes.post('/auth/verify/user', async (req, res) => {
  const { slug } = req.body;

  try {
    const existingUser = await prisma.users.findFirst({
      where: {
        VSlug: slug,
        status: "1",
      },
    });

    if (existingUser) {
      return res.status(422).json({ error: 'Usuário já verificado' });
    }

    // Atualize o status do usuário
    const updatedUser = await prisma.users.update({
      where: {
        VSlug: slug,
      },
      data: {
        status: "1",
      },
    });

    if (updatedUser) {
      const user = {
        id: updatedUser.id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        jwt: "cavalo",
      };
      return res.status(200).json({ user });
    } else {
      return res.status(422).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Ocorreu um erro no servidor' });
  }
});

//private route 1
routes.put("/order/rastreioupdate",checkToken, rastreioupdate)

routes.delete("/order/delete",checkToken, deleteorder)

routes.get("/getshops",checkToken, getshops)

routes.post("/getshop",checkToken, getshop)

routes.post("/pay",checkToken, payment)

routes.post("/confirmpay",checkToken, confirmpayment)

routes.get('/getuser',checkToken, async (req,res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Token de autorização ausente' });
  }
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).json({ msg: "Acesso negado!" })
  }
  const token = authHeader && authHeader.split(" ")[1]

  if(!token){
    return res.status(401).json({ msg: "Acesso negado!" })
  }
  let id = ""
  try{
    const secrets = process.env.SECRET

    const decoded = jwt.verify(token, secrets);

    id = decoded.id;

  }catch(error){
    return res.status(400).json({ msg: "token invalido!" })
  }

    const emailDB = await prisma.users.findMany({
        where: {
            id: id,
        },
    })
    if(emailDB.length <= 0){//email nao existe
      return res.status(422).json({ error: 'Usuário não encontrado' });
    }else{
      user = {
        id: emailDB[0].id,
        nome: emailDB[0].nome,
        email: emailDB[0].email
      }
      return res.status(200).json({user})
    }
})
function checkToken(req, res, next){
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Token de autorização ausente' });
  }
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]

  if(!token){
    return res.status(401).json({ msg: "Acesso negado!" })
  }
  try{
    const secrets = process.env.SECRET

    const usuario = jwt.verify(token, secrets)
    if (!usuario || !usuario.data) {
      return res.status(400).json({ msg: "Token inválido!" })
    }

    const dataCriacaoCookie = new Date(usuario.data);
    const dataAtual = new Date();
    const diferencaEmDias = Math.floor((dataAtual - dataCriacaoCookie) / (1000 * 60 * 60 * 24));

    if (diferencaEmDias >= 12) {
      return res.status(400).json({ msg: "token invalido!" })
    }else{
      next()
    }
  }catch(error){
    return res.status(400).json({ msg: "token invalidod!" })
  }
}



//private route 2
routes.get("/getshopsbyadm",checkToken, getshopsbyadm)

routes.get('/getuseradm',checkToken, async (req,res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Token de autorização ausente' });
  }
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).json({ msg: "Acesso negado!" })
  }
  const token = authHeader && authHeader.split(" ")[1]

  if(!token){
    return res.status(401).json({ msg: "Acesso negado!" })
  }
  let id = ""
  try{
    const secrets = process.env.SECRET

    const decoded = jwt.verify(token, secrets);

    id = decoded.id;

  }catch(error){
    return res.status(400).json({ msg: "token invalido!" })
  }

    const emailDB = await prisma.users.findMany({
        where: {
            id: id,
        },
    })
    const admemailDB = await prisma.adms.findMany({
      where: {
          email: emailDB[0].email,
      },
    })
    if(emailDB.length <= 0 || admemailDB.length <= 0){//email nao existe
      return res.status(422).json({ error: 'Usuário não encontrado' });
    }else{
      user = {
        id: emailDB[0].id,
        nome: emailDB[0].nome,
        email: emailDB[0].email
      }
      return res.status(200).json({user})
    }
})

routes.post("/insertproduct", checkToken, Multer.single("file"), uploadImage, insert)

routes.delete("/deleteproduct", checkToken, deletes)


module.exports = routes
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
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

const insert = require("./controllers/uploadController")
const deletes = require("./controllers/deleteController")
const { login, loginProvider } = require("./controllers/registerController")
const getitencar = require('./controllers/getitemarraycontroller')

const uploadImage = require("./services/firebase")
const { app } = require('firebase-admin')




//public route
routes.post("/getitemcar", getitencar)
routes.post("/login", login)
routes.post("/login/provider", loginProvider)

routes.get("/products", async (req, res) => {
    const allproducts = await prisma.produtos.findMany()
    res.send(allproducts)
})
routes.post("/product", async (req, res) => {
  const { slug } = req.body
  const product = await prisma.produtos.findMany({
    where: {
      slug:slug
    }
  })
  res.send(product)
})
routes.post('/auth/verify/user', async (req, res) => {
  const { slug } = req.body;

  try {
    // Verifique se o usuário já possui status "1"
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
        VSlug: slug, // Defina VSlug com o valor correto
      },
      data: {
        status: "1",
      },
    });

    if (updatedUser) {
      // Faça o que precisa com updatedUser
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
routes.get('/getuser/',checkToken, async (req,res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Token de autorização ausente' });
  }
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.send(401).json({ msg: "Acesso negado!" })
  }
  const token = authHeader && authHeader.split(" ")[1]

  if(!token){
    return res.send(401).json({ msg: "Acesso negado!" })
  }
  let id = ""
  try{
    const secrets = process.env.SECRET

    const decoded = jwt.verify(token, secrets);

    id = decoded.id;

  }catch(error){
    return res.send(400).json({ msg: "token invalido!" })
  }

  const emailDBProvider = await prisma.usersProvider.findMany({
    where: {
        id: id,
    },
    })
    const emailDB = await prisma.users.findMany({
        where: {
            id: id,
        },
    })
    if(emailDB.length <= 0){//email nao existe
        if(emailDBProvider.length <= 0){//email nao existe
          return res.status(422).json({ error: 'Usuário não encontrado' });
        }else{
          user = {
            id: emailDBProvider[0].id,
            nome: emailDBProvider[0].nome,
            email: emailDBProvider[0].email
          }
          return res.status(200).json({user})
        }
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
    return res.send(401).json({ msg: "Acesso negado!" })
  }
  try{
    const secrets = process.env.SECRET

    jwt.verify(token, secrets)

    next()

  }catch(error){
    return res.send(400).json({ msg: "token invalido!" })
  }
}

//private route 2

routes.post("/insertproduct", Multer.single("file"), uploadImage, insert)

routes.post("/deleteproduct",  deletes)


module.exports = routes
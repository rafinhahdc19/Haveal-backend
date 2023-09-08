const uuid = require('uuid');
const prisma = require("../services/prisma")

const insert = async (req, res)  => {
    if (req.file){

    }else{
        console.log(req)
    }
    const imgurl = req.file.firebaseUrl
    const { nome, desc, value, link } = req.body
    const uuidValue = uuid.v4();
    const uuidFirstPart = uuidValue.split('-')[0];

    // Obtém a data atual
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  
    // Cria a slug no formato {nome-uuid-diamesanohorasminutossegundos}
    const slug = `${nome.replace(/\s+/g, '-')}-${uuidFirstPart}-${dateFormatted}`;
    const produto = await prisma.produtos.create({data:{ nome, desc, imgurl, value, link, data:now, slug}})
    res.json(produto)
}

module.exports = insert
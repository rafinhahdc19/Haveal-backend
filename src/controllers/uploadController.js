const uuid = require('uuid');
const prisma = require("../services/prisma")

const insert = async (req, res)  => {
    if (req.file){

    }else{
        return res.status(500).json({msg: "foto ausente"})
    }
    const cleanToken = (token) => {
        if (token.startsWith("Bearer ")) {
          return token.substring(7);
        }
        return token;
      };
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Token de autorização ausente' });
    }
    const authHeaderB = req.headers.authorization;
    const authHeader = cleanToken(authHeaderB);
    if (!authHeader) {
        return res.status(401).json({ msg: "Acesso negado!" });
    }
    
    try {
        const response = await axios.get(process.env.BACKEND+"/getuser", {
            headers: {
                Authorization: `Bearer ${authHeader}`,
                'Content-Type': 'application/json',
            },
        });
    
        if (response.data.user) {
            
                const admConsult = await prisma.adms.findMany({
                    where:{
                        email:response.data.user.email
                    }
                })
                if(admConsult.length > 0){
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
        }
    }catch (error) {
        return res.status(500).json({ error: 'Acesso negado!'});
    }
}

module.exports = insert
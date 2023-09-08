const prisma = require("../services/prisma");
const axios = require('axios')

const rastreioupdateController = async (req, res) => {
    const { slug, codigo } = req.body
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
            const orders = await prisma.orders.findMany({
                where:{
                    slug:slug
                }
            })
            if(orders.length <= 0){
                return res.status(401).json({ error: 'Produto não encontrado!' });
            }else{
                const admConsult = await prisma.adms.findMany({
                    where:{
                        email:response.data.user.email
                    }
                })
                if(admConsult.length > 0){
                    const responseUp = await prisma.orders.update({data: {rastreio: codigo, statusInterno: "1"}, where:{slug:slug}})
                    if(responseUp){
                        return res.status(200).json('Código de rastreio adicionado!');
                    }else{
                        return res.status(401).json({ error: 'Erro ao adicionar codigo!' });
                    }
                }else{
                    return res.status(401).json({ error: 'Você não tem permisão para isso!' });
                }
            }
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Acesso negado!:'+error});
    }
}

module.exports = rastreioupdateController
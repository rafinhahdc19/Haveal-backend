const prisma = require("../services/prisma");
const axios = require('axios')

const deletes = async (req, res) => {
    const { slug } = req.body
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

                    const deleteOrder = await prisma.produtos.delete({
                        where:{
                            slug:slug
                        }
                    })
                    if(deleteOrder){
                        return res.status(200).json("O produto foi apagado");
                    }
                }
            
        }
    } catch (error) {
        return res.status(500).json({ error: 'Acesso negado!'});
    }
}   
module.exports = deletes
const axios = require("axios");
const prisma = require("../services/prisma");
const getshops = async (req, res) => {
    const { limit, offset} = req.query
    const offsetValue = parseInt(offset, 10) || 0;
    const limitValue = parseInt(limit, 10) || 24;
    if(
        limitValue > 50
    ){
        return res.status(401).json({message:"O valor limit alcançado"})
    }
    const cleanToken = (token) => {
        if (token.startsWith("Bearer ")) {
          return token.substring(7); // Remove os primeiros 7 caracteres (o "Bearer ").
        }
        return token; // Se não começar com "Bearer", retorne o token original.
      };
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Token de autorização ausente' });
    }
    const authHeaderB = req.headers.authorization;
    const authHeader = cleanToken(authHeaderB);
    const getItens = async (email) => {
        const shops = await prisma.orders.findMany({
            where: {
                email: email,
            },
            skip: offsetValue,
            take: limitValue,
            orderBy: { id: 'desc' }
        });
    
        if (shops) {
            return shops;
        } else {
            return null;
        }
    }
    
    if (!authHeader) {
        return res.status(401).json({ msg: "Acesso negado!" });
    }
    
    try {
        const response = await axios.get("/getuser", {
            headers: {
                Authorization: `Bearer ${authHeader}`,
                'Content-Type': 'application/json',
            },
        });
    
        if (response.data.user) {
            const itemsS = await getItens(response.data.user.email);
            if(itemsS){
                return res.status(200).json({itemsS})
            }
        } else {
            return res.status(401).json({ msg: "Acesso negado!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Erro ao obter dados do usuário" });
    }
}

module.exports = getshops
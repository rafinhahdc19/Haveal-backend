const axios = require("axios");
const prisma = require("../services/prisma");
const getshop = async (req, res) => {
    const { slug } = req.body
    if(!slug){
        return res.status(401).json({ message: 'Slug ausente' });
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
    const itensDBfromArray = async (data) => {
        const Products = data[0].itens
        const productSlugs = Products.map((item) => item.slug);

        const productsFromDB = await prisma.produtos.findMany({
            where: {
              slug: {
                in: productSlugs,
              },
            },
          });

          const result = Products.map((item) => {
            const product = productsFromDB.find((dbProduct) => dbProduct.slug === item.slug);
            if (product) {
                product.quantity = item.quantity;
              return product
            }
            return null;
          });
        return result
    }
    const getItens = async (email) => {
        const shops = await prisma.orders.findMany({
            where: {
                slug:slug,
            }
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
        const response = await axios.get(process.env.BACKEND+"/getuser", {
            headers: {
                Authorization: `Bearer ${authHeader}`,
                'Content-Type': 'application/json',
            },
        });
    
        if (response.data.user) {
            
            const itemsS = await getItens(response.data.user.email);
            if(itemsS){
                if(response.data.user && response.data.user.email && itemsS[0].email  && response.data.user.email == itemsS[0].email){
                    const itensDBfromArrayV = await itensDBfromArray(itemsS)
                    itemsS[0].itens = itensDBfromArrayV;
                    return res.status(200).json({ itemsS });
                } else{
                    const admConsult = await prisma.adms.findMany({
                        where:{
                            email:response.data.user.email
                        }
                    })
                    if(admConsult.length > 0){
                        const itensDBfromArrayV = await itensDBfromArray(itemsS)
                        itemsS[0].itens = itensDBfromArrayV;
                        return res.status(200).json({ itemsS });
                    }else{
                        return res.status(401).json({ msg: "Acesso negado!" });
                    }
                }
            
                
            }
        } else {
            return res.status(401).json({ msg: "Acesso negado!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Erro ao obter dados do usuário" });
    }
}

module.exports = getshop
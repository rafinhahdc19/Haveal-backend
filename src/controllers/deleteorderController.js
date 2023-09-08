const prisma = require("../services/prisma");
const axios = require('axios')
const stripe = require('../services/stripe')

const deleteorderController = async (req, res) => {
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
                if(orders[0].email == response.data.user.email || admConsult.length > 0){
                    if(orders[0].statusInterno == "1"){
                        return res.status(401).json({ error: 'O pedido ja foi processado e não pode ser apagado'});
                    }else{
                        if(orders[0].status == "1"){
                            const refund = await stripe.refunds.create({
                                payment_intent: orders[0].paytoken,
                            });
                            if(refund){
                                const deleteOrder = await prisma.orders.delete({
                                    where:{
                                        slug:slug
                                    }
                                })
                                if(deleteOrder){
                                    return res.status(200).json("A ordem foi apagada");
                                }else{
                                    const updateOrderPay = await prisma.orders.update({
                                        data:{
                                            status:"0"
                                        },
                                        where:{
                                            slug:slug
                                        }
                                    })
                                    return res.status(401).json({ error: 'Erro a apagar a ordem'});
                                    
                                    
                                }
                            }
                        }else{
                            const deleteOrder = await prisma.orders.delete({
                                where:{
                                    slug:slug
                                }
                            })
                            if(deleteOrder){
                                return res.status(200).json("A ordem foi apagada");
                            }else{
                                const updateOrderPay = await prisma.orders.update({
                                    data:{
                                        status:"0"
                                    },
                                    where:{
                                        slug:slug
                                    }
                                })
                                return res.status(401).json({ error: 'Erro a apagar a ordem'});
                                
                                
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ error: 'Acesso negado!: '+error});
    }
}

module.exports = deleteorderController
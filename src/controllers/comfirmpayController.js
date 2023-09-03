const { default: axios } = require("axios");
const prisma = require("../services/prisma");
const stripe = require("../services/stripe")

const confirmpayment = async (req, res) => {
    const { paymentid } = req.body;
    if (!paymentid){
        return res.status(400).json({ message: 'paymentid não mencionado na requisição' });
    }
    
        const verifyOrder = await prisma.orders.update({data: {status: "1"}, 
        where:{
            paytoken:paymentid
        },})
        if(verifyOrder){
            return res.status(200).json({ message: 'Pagamento bem-sucedido' });
        }else{
            return res.status(401).json({ message: 'Erro ao atulizar ordem' });
        }
      
    
}

module.exports = confirmpayment
const { default: axios } = require("axios");
const { verify } = require("jsonwebtoken");
const prisma = require("../services/prisma");
const stripe = require("../services/stripe")

const confirmpayment = async (req, res) => {
    const { paymentid } = req.body;
    try {
    const payment = await stripe.paymentIntents.retrieve(paymentid);

    
        
    if (payment.status === 'succeeded') {
      const verifyOrder = await prisma.orders.update({data: {status: "1"}, 
      where:{
        paytoken:paymentid
      },})
      if(verifyOrder){
        res.status(200).json({ success: true, message: 'Pagamento bem-sucedido' });
      }else{
        res.status(400).json({ success: false, message: 'Pagamento bem sucedido, porem, a ordem não foi verificada. Volte novamento mais tarde' });
      }
      
    } else {
      res.status(400).json({ success: false, message: 'Pagamento falhou, ou não foi efetuado' });
    }
  } catch (error) {
    console.error('Erro ao verificar o pagamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar o pagamento' });
  }
}

module.exports = confirmpayment
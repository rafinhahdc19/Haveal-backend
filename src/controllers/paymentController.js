const mercadopago = require('../services/mercadopago');

const payment = async (req, res) => {
    
    try {
        var payment_data = {
            transaction_amount: 100,
            description: 'Título do produto',
            payment_method_id: 'pix',
            payer: {
              email: 'test@gmil.com',
              first_name: 'Test',
              last_name: 'User',
              identification: {
                  type: 'CPF',
                  number: '19119119100'
              },
              address:  {
                  zip_code: '06233200',
                  street_name: 'Av. das Nações Unidas',
                  street_number: '3003',
                  neighborhood: 'Bonfim',
                  city: 'Osasco',
                  federal_unit: 'SP'
              }
            }
          };
          
          const paydata = mercadopago.payment.create(payment_data).then(function (data) {
            console.log(data)
            return res.status(200).json({ paydata });
          }).catch(function (error) {
          
          });
    
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar preferência de pagamento' });
    }
      
  
}

module.exports = payment
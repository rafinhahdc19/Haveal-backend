const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: process.env.ACESSTOKENMP,
});

module.exports = mercadopago;

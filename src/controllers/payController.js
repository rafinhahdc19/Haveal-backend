const stripe = require("../services/stripe")
const axios = require('axios');
const prisma = require("../services/prisma");
const jwt = require("jsonwebtoken");

const payment = async (req,res) => {
    const {cpf, cep, contato, nome, numero, complemento, itens } = req.body;
    function isValidCPF(cpf) {
      if (typeof cpf !== "string") return false
      cpf = cpf.replace(/[\s.-]*/igm, '')
      if (
          !cpf ||
          cpf.length != 11 ||
          cpf == "00000000000" ||
          cpf == "11111111111" ||
          cpf == "22222222222" ||
          cpf == "33333333333" ||
          cpf == "44444444444" ||
          cpf == "55555555555" ||
          cpf == "66666666666" ||
          cpf == "77777777777" ||
          cpf == "88888888888" ||
          cpf == "99999999999" 
      ) {
          return false
      }
      var soma = 0
      var resto
      for (var i = 1; i <= 9; i++) 
          soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i)
      resto = (soma * 10) % 11
      if ((resto == 10) || (resto == 11))  resto = 0
      if (resto != parseInt(cpf.substring(9, 10)) ) return false
      soma = 0
      for (var i = 1; i <= 10; i++) 
          soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i)
      resto = (soma * 10) % 11
      if ((resto == 10) || (resto == 11))  resto = 0
      if (resto != parseInt(cpf.substring(10, 11) ) ) return false
      return true
  }
  if(isValidCPF(cpf)){

  }else{
    return res.status(401).json({ message: 'Cpf invalido' });
  }
    let itensDB = null
    let estado = null
    let cidade = null
    let bairro = null
    let rua = null
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`).then(function (data) {
          if(data.data.erro){
            return res.send(401).json({ msg: "Erro na busca de Cep!" })
          }
          rua = data.data.logradouro
          cidade = data.data.localidade
          bairro = data.data.bairro
          const siglaParaEstado = {
            AC: 'Acre',
            AL: 'Alagoas',
            AM: 'Amazonas',
            AP: 'Amapá',
            BA: 'Bahia',
            CE: 'Ceará',
            DF: 'Distrito Federal',
            ES: 'Espírito Santo',
            GO: 'Goiás',
            MA: 'Maranhão',
            MT: 'Mato Grosso',
            MS: 'Mato Grosso do Sul',
            MG: 'Minas Gerais',
            PA: 'Pará',
            PB: 'Paraíba',
            PR: 'Paraná',
            PE: 'Pernambuco',
            PI: 'Piauí',
            RJ: 'Rio de Janeiro',
            RN: 'Rio Grande do Norte',
            RS: 'Rio Grande do Sul',
            RO: 'Rondônia',
            RR: 'Roraima',
            SC: 'Santa Catarina',
            SP: 'São Paulo',
            SE: 'Sergipe',
            TO: 'Tocantins',
          };
          const siglaRecebida = data.data.uf;
          estado = siglaParaEstado[siglaRecebida];
          }).catch(function (error){
            return res.send(401).json({ msg: "Endereço não autorizado" })
          })
    
    let user = null;
      if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Token de autorização ausente' });
      }
      const authHeader = req.headers.authorization;
      if(!authHeader){
        return res.status(401).json({ msg: "Acesso negado!" })
      }
      const token = authHeader && authHeader.split(" ")[1]
    
      if(!token){
        return res.status(401).json({ msg: "Acesso negado!" })
      }
      let id = ""
      try{
        const secrets = process.env.SECRET
        
        const decoded = jwt.verify(token, secrets);
    
        id = decoded.id;
    
      }catch(error){
        return res.status(400).json({ msg: "token invalido!" })
      }
    
        const emailDB = await prisma.users.findMany({
            where: {
                id: id,
            },
        })
        if(emailDB.length <= 0){//email nao existe
          return res.status(422).json({ error: 'Usuário não encontrado' });
        }else{
          user = {
            id: emailDB[0].id,
            nome: emailDB[0].nome,
            email: emailDB[0].email
          }
          user = user
        }

        try {
          const response = await axios.post(process.env.BACKEND+"/getitemcar", {
            slugs:itens
          }).then(function (data){
            itensDB = data.data.itens
          }).catch(function (error){
            console.log(error)
          })
          
        } catch (error) {
          console.error('Erro ao buscar itens:', error);
          return res.status(500).json({ error: 'Erro ao buscar itens' });
        }
    const now = new Date()
    const calcularResultado = (itensDB) => {
      let total = 0;
  
      itensDB.forEach((item) => {
        const { quantity, value } = item;
        const resultadoItem = quantity * value;
        total += resultadoItem;
      });
  
      return total;
    };
    const value = calcularResultado(itensDB).toString()
    const valueInt = parseInt(calcularResultado(itensDB), 10)
    const descriptionPay = btoa(encodeURIComponent(JSON.stringify(itens)))
    if(estado == null || cidade == null || rua == null || bairro == null){
      return res.status(500).json({ error: 'Erro ao criar ordem' });
    }else{
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount:valueInt,
          description:descriptionPay,
          currency:"BRL",
        });
        const order = await prisma.orders.create({data: {nome:nome, email: user.email, contato, status: "0", statusInterno: "0", data:now, itens:itens, estado, cidade, rua, cep, bairro, numero, complemento, cpf, value: value, paytoken: paymentIntent.id}})
        if(order){
          return res.status(200).json({ clientSecret: paymentIntent.client_secret, idPay: paymentIntent.id });
        }else{
          return res.status(500).json({ error: 'Erro ao criar ordem' });
        }
        
      } catch (error) {
        
        console.error(error);
  
        return res.status(500).json({ error: 'Erro ao criar pagamento' });
      }
    
    
    
    
    }

    /*
      try {
    // Lista todos os pagamentos
    const paymentList = await stripe.paymentIntents.list({ limit: 1796 }); // Aumente o limite conforme necessário

    // Exclui cada pagamento individualmente
    for (const payment of paymentList.data) {
      await stripe.paymentIntents.cancel(payment.id);
      console.log(`Pagamento com ID ${payment.id} excluído.`);
    }

    console.log('Todos os pagamentos foram excluídos com sucesso.');
  } catch (error) {
    console.error('Erro ao excluir os pagamentos:', error.message);
  }
    */
}


module.exports = payment

const prisma = require("../services/prisma")
const products = async (req, res) => {
    const { limit, offset, search } = req.query
    const offsetValue = parseInt(offset, 10) || 0;
    const limitValue = parseInt(limit, 10) || 24;
    if(
        limitValue > 50
    ){
        return res.status(401).json({message:"O valor limit alcançado"})
    }
    if(search && search != '' && search.length < 200){
        const allProducts = await prisma.produtos.findMany({
            where: {
                OR: [
                  {
                    nome: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  },
                  {
                    desc: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  }
                ]
            },
            skip: offsetValue,
            take: limitValue,
            orderBy: { id: 'desc' }
        });
        if(allProducts){
            return res.send(allProducts)
        }else{
            return res.status(422).json({ error: 'Erro ao consultar' });    
        }
        
    }else{
        const allProducts = await prisma.produtos.findMany({
            skip: offsetValue,
            take: limitValue,
            orderBy: { id: 'desc' }
        });
        if(allProducts){
            return res.send(allProducts)
        }else{
            return res.status(422).json({ error: 'Erro ao consultar' });
        }
    }
    
        
}

module.exports = products
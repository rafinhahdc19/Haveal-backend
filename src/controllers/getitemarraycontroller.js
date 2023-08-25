const prisma = require("../services/prisma")

const getitencar = async (req, res) => {
    try {
        const { slugs } = req.body; 
    
        // Extrair apenas os slugs da array de objetos
        const slugValues = slugs.map((item) => item.slug);
    
        const itensFromDB = await prisma.produtos.findMany({
          where: {
            slug: {
              in: slugValues, 
            },
          },
        });
    
        const itensComQuantidade = itensFromDB.map((itemDB) => {
        const { slug } = itemDB;
  
        // Encontre o objeto correspondente na array de slugs enviada na requisição
        const itemRequisicao = slugs.find((item) => item.slug === slug);
  
        if (itemRequisicao) {
          const { quantity } = itemRequisicao;
  
          // Retorne o item do banco de dados com a quantidade
          return {
            ...itemDB,
            quantity,
          };
        }
  
        return itemDB; // Se não for encontrado na requisição, retorne o item do banco de dados sem quantidade
      });
  
      res.json({ itens: itensComQuantidade });
      } catch (error) {
        console.error('Erro ao buscar itens:', error);
        res.status(500).json({ error: 'Erro ao buscar itens' });
      }
}

module.exports = getitencar
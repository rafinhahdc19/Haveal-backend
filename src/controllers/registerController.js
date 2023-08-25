require("dotenv").config()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const prisma = require("../services/prisma")
const uuid = require('uuid');
const nodemailer = require('nodemailer')


const emailctt = "havealoficial@outlook.com"
const emailcttpwd = process.env.PWDMAIL
const transporter = nodemailer.createTransport({
    host:"smtp.office365.com",
    port: 587,
    auth: {
        user: emailctt,
        pass: emailcttpwd, 
    }
})


const secret = process.env.SECRET
const now = new Date();

const login = async (req, res) => {
    const { nome, email, senha } = req.body
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let login = false
    if(!email || !emailRegex.test(email)){
        return res.status(422).json({msg:"Email invalido"})
    }
    else if(!senha){
        return res.status(422).json({msg:"Senha invalida"})
    }else if(!nome){
        login = true
    }
    
    
    const emailVerify = async (email) =>{
        //db verify
        
        const emailDBProvider = await prisma.usersProvider.findMany({
            where: {
                email: email,
            },
        })
        const emailDB = await prisma.users.findMany({
            where: {
                email: email,
            },
        })
        if(login){
            if (emailDB && emailDB.length > 0 && emailDB[0].status === "1"){
                const checkpwddb = await bcrypt.compare(senha, emailDB[0].senha)
                if(checkpwddb){
                    const token = jwt.sign({
                        id: emailDB[0].id
                    }, secret,)
                    return res.status(200).json({
                        user: {
                            id: emailDB[0].id,
                            email: emailDB[0].email,
                            nome: emailDB[0].nome,
                            jwt: token,
                        },
                        
                        verify:true
                    });
                }else{
                    return res.status(422).json("O nome ou senha incorreto")
                }
            }else if(emailDBProvider && emailDBProvider.length > 0){
                return res.status(422).json("Você ja fez o login anteriormente por outro meio")
            }
            else if(emailDB && emailDB.length > 0 && emailDB[0].status === "0"){
                return res.status(422).json("Essa conta nao está verificada, por favor, verifique o seu email.")
            }
            else{
                return res.status(422).json("Não encontramos essa conta, por favor, registre-se")
            }
        }
        if(emailDBProvider.length <= 0){//email nao existe
            if(emailDB.length <= 0){//email nao existe
                
                const salt = await bcrypt.genSalt(12)
                const senhaCrypt = await bcrypt.hash(senha, salt)
                const status = "0"
                const uuidFirstPart = uuid.v4(); 
                
                const dateFormatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

                const slug = `${email.replace(/\s+/g, '-')}-${uuidFirstPart}-${dateFormatted}`;
                const user = await prisma.users.create({data: {nome, email, senha:senhaCrypt, status, data:now, VSlug:slug, car: [] }, 
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    } })
                if(user){
                    transporter.sendMail({
                        from: emailctt,
                        to: user.email,
                        subject: "haveal autentication",
                        html: `<p>Clique no link abaixo para autenticar:</p><a href='http://localhost:3000/auth/emailverify/verify/${slug}'>Link de Autenticação</a>`
                    }, async function(error, info){
                        if (error) {
                            await prisma.users.delete({
                                where: {
                                    email: user.email
                                }
                            })
                            res.status(422).json({msg:"Erro na verificação do email, tente fazer login por outro meio"})
                        } else {
                            return res.status(200).json({ verify:false })
                        }
                    })
                }
                
                
            }
            else {
                const userdbs = emailDB[0]

                const dataatual = new Date(); // Obtém a data atual
                const createdAt = new Date(userdbs.data); // Obtém a data de criação do usuário do banco de dados

                // Calcula a diferença de tempo em milissegundos
                const diffMilliseconds = dataatual - createdAt;

                // Converte a diferença de tempo para minutos
                const diffMinutes = diffMilliseconds / (1000 * 60);
                if (diffMinutes >= 20 && userdbs.status == "0" ) {
                    const salt = await bcrypt.genSalt(12)
                    const senhaCrypt = await bcrypt.hash(senha, salt)
                    const status = "0"
                    const uuidFirstPart = uuid.v4(); 
                    
                    const dateFormatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

                    const slug = `${email.replace(/\s+/g, '-')}-${uuidFirstPart}-${dateFormatted}`;
                    const user = await prisma.users.update({data: {nome, email, senha:senhaCrypt, status, data:now, VSlug:slug, car: [] }, 
                        where:{
                            email:userdbs.email
                        },
                        select: {
                            id: true,
                            nome: true,
                            email: true
                        } })
                        if(user){
                            transporter.sendMail({
                                from: emailctt,
                                to: user.email,
                                subject: "haveal autentication",
                                html: `<p>Clique no link abaixo para autenticar:</p><a href='http://localhost:3000/auth/emailverify/verify/${slug}'>Link de Autenticação</a>`
                            }, async function(error, info){
                                if (error) {
                                    await prisma.users.delete({
                                        where: {
                                            email: user.email
                                        }
                                    })
                                    res.status(422).json({msg:"Erro na verificação do email, tente fazer login por outro meio"})
                                } else {
                                    return res.status(200).json({verify:false})
                                }
                            })
                        }
                }else if(userdbs.status == "1"){
                    const checkpwddb = await bcrypt.compare(senha, userdbs.senha)
                    if(checkpwddb){
                        const token = jwt.sign({
                            id: userdbs.id
                        }, secret,)
                        return res.status(200).json({
                            
                            user: {
                                id: userdbs.id,
                                email: userdbs.email,
                                nome: userdbs.nome,
                                jwt: token,
                            },
                            verify:true
                        });
                    }else{
                        return res.status(422).json("O nome ou senha incorreto")
                    }
                }else{
                    return res.status(422).json("Você ja fez o registro antes, porem, não verificou o email. Se não fez o registro então volte mais tarde")
                }
                
                
            }
        }else{
            return res.status(422).json("o email ja esta em uso")
        }
    }
    emailVerify(email)
}
const loginProvider = async (req, res) => {
    const { email, nome } = req.body
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if(!email || !emailRegex.test(email)){
        return res.status(422).json({msg:"Email invalido"})
    }
    else if(!nome){
        return res.status(422).json({msg:"Nome invalida"})
    }

    const emailVerify = async (email) =>{
        //db verify
        
        const emailDBProvider = await prisma.usersProvider.findMany({
            where: {
                email: email,
            },
        })
        const emailDB = await prisma.users.findMany({
            where: {
                email: email,
            },
        })
        if(emailDB.length <= 0){//email nao existe
            if(emailDBProvider.length <= 0){//email nao existe
                
                const user = await prisma.usersProvider.create({data: {nome, email, data:now, car: []}, 
                select: {
                    id: true,
                    nome: true,
                    email: true
                }})
                const token = jwt.sign({
                    id: user[0].id
                }, secret,)
                user[0].jwt = token;
                return res.status(200).json({user:user})
            }
            else{
                const user = await prisma.usersProvider.findMany({
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                      },
                })
                const token = jwt.sign({
                    id: user[0].id
                }, secret,)
                user[0].jwt = token;
                return res.status(200).json({user:user})
            }
        }else{
            const user = await prisma.users.findMany({
                select: {
                    id: true,
                    nome: true,
                    email: true,
                  },
            })
            
            const token = jwt.sign({
                id: user[0].id
            }, secret,)
            user[0].jwt = token;
            return res.status(200).json({user:user})
            
            
            
            
            
        }
    }
    emailVerify(email)
    
}

module.exports = {
    login,
    loginProvider
};
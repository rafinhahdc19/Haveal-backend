var admin = require("firebase-admin");

const serviceAccount = {
  "type": process.env.TYPE,
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY, // Add this line for the private_key
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN,
};

const Bucket = "haveal-6ddb6.appspot.com"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://"+Bucket,
});

const bucket = admin.storage().bucket()

const uploadImage = async (req, res, next) => {
    if(!req.file) return next()

    const file = req.file

    const nomearquivo = Date.now() + "." + file.originalname.split().pop()

    const files = bucket.file("produto/"+nomearquivo)

    const stream = files.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      }
    })

    stream.on("error", (e) => {
      console.error(e);
    })
    stream.on("finish", async () => {
      await files.makePublic()

      req.file.firebaseUrl = `https://storage.googleapis.com/${Bucket}/produto/${nomearquivo}`

      next()
    })

    stream.end(file.buffer)

    
}

module.exports = uploadImage;
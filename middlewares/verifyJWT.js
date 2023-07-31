import jwt from 'jsonwebtoken' 

const verifyJWT = (req, res, next)=>{
    const authHeader = req.headers.authorization || req.headers.Authorization
    if(!authHeader.startsWith('Bearer ')) return resStatus(401)
    const token = authHeader.split(" ")[1]
    jwt.verify(
        token, 
        process.env.ACCESS_JWT_TOKEN, 
        (error, decode)=> {
            if(error) {
                console.log("error *****", error)
                res.sendStatus(403)
            }
            req.userId = decode.id 
            req.roles = decode.roles 
            next()
        }
    )
}

export default verifyJWT
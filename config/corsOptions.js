import allowedOrigins from "./allowedOrigins.js"; 

const corsOptions = {
    origin:(origin, callback) => {
        if(allowedOrigins.indexOf(origin) !== -1 || !origin){
            callback(null, true)
        }else{
            callback(new Error('Not Allowed By CORS'))
        }
    }, 
    optionsSuccessStatus: true
}

export default corsOptions
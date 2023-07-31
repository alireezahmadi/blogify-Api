import {body} from 'express-validator' 
import User from '../models/userModel.js' 

const registerValidator = () => {
    return [ 
        body("first_name")
            .isLength({min:4})
            .withMessage('نام کاربری حداکثر 4 کاراکاتر باید باشد'),
        body("last_name")
            .isLength({min:4})
            .withMessage('نام خانوادگی حداکثر 4 کاراکاتر باید باشد'),
        body("email")
            .not()
            .isEmpty()
            .isEmail()
            .withMessage('ایمیل موردنظر معتبر نیست')
            .custom(async(value)=>{
                return User.findOne({email:value}).then(user =>{
                    if(user){
                        return Promise.reject("ایمیل قبلا استفاده شده است")

                    }
                })
            }), 
        body("password") 
            .isLength({min:6})
            .withMessage('گذرواژه حداکثر 8 کاراکاتر باید باشد')
            .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)/)
            .withMessage("گذرواژه باید شامل حداقل یک حرف لاتین کوچک و بزرگ و عدد و حروف ویژه باشد"),
       
        ]   
}

export default registerValidator
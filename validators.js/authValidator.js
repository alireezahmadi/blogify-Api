import {body} from 'express-validator' 

const authValidator = () => {
    return [
        body("email")
            .not()
            .isEmpty()
            .isEmail()
            .withMessage('ایمیل موردنظر معتبر نیست'),
        body("password")
            .not()
            .isEmpty()
            .withMessage("گذرواژه معتبر نیست")
    ]
}

export default authValidator
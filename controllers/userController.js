import { validationResult } from 'express-validator'
import UserModel from '../models/userModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendVerificationEmail, sendResetPasswrodCode } from '../utilities/mailer.js'
import codeModel from '../models/codeModel.js'
import randomString from 'randomstring'


class UserController {
    constructor() { }

    // register new user 
    async register(req, res) {
        try {
          
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                res.status(400).json({ message: errors.array() })
            }
            const newUser = await new UserModel({
                ...req.body,
                username: req.body.first_name + req.body.last_name
            })
           
            newUser.username = await newUser.generateUsername()
            const mailVerificationToken = jwt.sign(
                { id: newUser._id.toString() },
                process.env.MAIL_JWT_TOKEN,
                { expiresIn: '30m' }
            )
          console.log(' token:\n', mailVerificationToken )
            const url = `${process.env.BASE_URI}/activate/${mailVerificationToken}`
            sendVerificationEmail(newUser.email, newUser.first_name, url)
            await newUser.save()
            res.json({ message: 'حساب شما با موفقیت ایجاد شد' })
        }
        catch (err) {
            res.status(500).json({ message: err.message })
        }
    }

    // login & authenticated user
    async login(req, res) {
        const cookies = req.cookies
        let errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ message: errors.array() })
        }
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).json({ message: 'ایمیل یا گذرواژه نباید خالی باشد' })
        }
        const foundUser = await UserModel.findOne({ email })
        if (!foundUser) res.status(400).json({ message: "کاریری یافت نشد" })
        const matchPass = await bcrypt.compare(password, foundUser.password)
        if (!matchPass) res.sendStatus(401)

        const roles = Object.values(foundUser.roles).filter(Boolean)

        const accessToken = jwt.sign(
            { id: foundUser.id, roles },
            process.env.ACCESS_JWT_TOKEN,
            { expiresIn: "20m" }
        )
        const newRefreshToken = jwt.sign(
            { id: foundUser.id },
            process.env.REFRESH_JWT_TOKEN,
            { expiresIn: "15m" }
        )

        let newRefreshTokenArray = !cookies.jwt
            ? foundUser.refreshToken
            : foundUser.refreshToken.filter(rt => rt !== cookies.jwt)

        if (cookies?.jwt) {
            const refreshToken = cookies.jwt
            const foundUser = await UserModel.findOne({ refreshToken })
            if (!foundUser) {
                newRefreshTokenArray = []
            }
            res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
        }

        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken]
        await foundUser.save()
        res.cookie("jwt", newRefreshToken, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 1000 * 60 * 60 * 24  * 15
        })
        const userInfo = {
            first_name:foundUser.first_name,
            last_name:foundUser.last_name,
            username:foundUser.username,
            email:foundUser.email,
            picture:foundUser.picture,
            verified:foundUser.verified,
            roles
        }
        res.json({ userInfo ,accessToken })


    }

    // logout 
    async logout(req, res){
        const cookies = req.cookies 
        if(!cookies?.jwt) return res.sendStatus(204) 
        const refreshToken = cookies.jwt 
        const foundUser = await UserModel.findOne({refreshToken})
        if(!foundUser){
            res.clearCookie("jwt",{httpOnly:true, sameSite:"None", secure:true})
            res.sendStatus(204)
        }
        foundUser.refreshToken = foundUser.refreshToken.filter(
            rt => rt !== refreshToken
        )
        await foundUser.save()
        res.clearCookie("jwt",{httpOnly:true, sameSite:"None", secure:true}) 
        return res.sendStatus(204)

    }

    // refreh token 
    async refresh(req, res) {
        const cookies = req.cookies
        if (!cookies?.jwt) return res.sendStatus(401)
        const refreshToken = cookies.jwt
        res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })

        const foundUser = await UserModel.findOne({ refreshToken })
        if (!foundUser) {
            jwt.verify(
                refreshToken,
                process.env.REFRESH_JWT_TOKEN,
                async (error, decode) => {
                    if (error) return
                    const hackedUser = await UserModel.findOne({ id: decode.id })
                    if (hackedUser) {
                        hackedUser.refreshToken = []
                        hackedUser.save()
                    }

                }
            )
            return res.sendStatus(403)
        }

        let newRefreshTokenArray = foundUser.refreshToken.filter(rt => rt !== refreshToken)
        jwt.verify(
            refreshToken,
            process.env.REFRESH_JWT_TOKEN,
            async (error, decode) => {
                if (error) {
                    foundUser.refreshToken = [...newRefreshTokenArray]
                    await foundUser.save()
                }
                if(error || foundUser.id !== decode.id) return res.sendStatus(400)
                const roles = Object.values(foundUser.roles).filter(Boolean)
                const accessToken = jwt.sign(
                    { id: decode.id, roles },
                    process.env.ACCESS_JWT_TOKEN,
                    { expiresIn: "20m" }
                )

                const newRefreshToken = jwt.sign(
                    { id: decode.id },
                    process.env.REFRESH_JWT_TOKEN,
                    { expiresIn: "15m" }
                )

                foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken]
                await foundUser.save() 
                res.cookie("jwt", newRefreshToken, {
                    httpOnly:true, 
                    sameSite:"None", 
                    secure:true, 
                    maxAge: 1000 * 60 * 60 * 24 * 15
                })
                const userInfo = {
                    first_name:foundUser.first_name,
                    last_name:foundUser.last_name,
                    username:foundUser.username,
                    email:foundUser.email,
                    picture:foundUser.picture,
                    verified:foundUser.verified,
                    roles
                } 

                res.json({userInfo, accessToken})


            }

        )
    }

    // activate account 
    async activateAccount(req, res){
        const {token} = req.body 
        if(!token) return res.status(400).json({message:"توکنی یافت نشد"})
        
        jwt.verify(
            token, 
            process.env.MAIL_JWT_TOKEN, 
            async(error, decode) => {
                if (error) return res.status(401).json({message:"توکن معتبر نیست"}) 
                const foundUser = await UserModel.findById(decode.id)
                
                if(!foundUser) return res.status(402).json({message:"توکن معتبر نیست"}) 
                
                if(foundUser.id !== req.userId) return res.status(403).json({message:"توکن معتبر نیست"}) 
                
                if(foundUser.verified == true){
                    return res.status(400).json({message:"این ایمیل قبلا فعال شده است"}) 
                }else{
                    await UserModel.findByIdAndUpdate(decode.id, {verified:true})
                    return res.status(200).json({message:"اکانت شما با موفقیت فعال شد"})
                }



            }
        )
    }

    // resend verification Email 
    async sendVerificationEmail(req, res){
       try{
        const id = req.userId  
        const user = await UserModel.findById(id) 
        if(user.verified == true){
            return res.status(400).json({message:"این ایمیل قبلا فعال شده است"}) 
        }
        const mailVerificationToken = jwt.sign(
            {id:id.toString()}, 
            process.env.MAIL_JWT_TOKEN, 
            {expiresIn:"30m"}
        )
        const url = `${process.env.BASE_URI}/activate/${mailVerificationToken}`
        sendVerificationEmail(user.email, user.first_name, url) 
        return res.status(200).json({message:"لینک  فعال سازی اکانت به ایمیل تان ارسال شده است"})
        }
       catch(error){
        res.status(500).json({message:error.message})
       }
    }

    // send reset password 
    async sendResetPassword(req, res){
        const {email} = req.body 
        if(!email) return res.status(400).json({message:"ایمیل نباید خالی باشد"})
        try{
            const user = await UserModel.findOne({email})
            if(!user) return res.status(400).json({message:"کاریری  یافت نشد"})
            await codeModel.findOneAndRemove({user:user.id}) 
            const code = randomString.generate(5)
            await new codeModel({
                user:user.id, 
                code 
            }).save() 

            sendResetPasswrodCode(user.email, user.first_name, code)
            res.status(200).json({message:"کدبازیابی گذرواژه به ایمیل شما ارسال شده است"})
        }
        catch(error){
            res.status(500).json({message:error.message})
        }
    }

    // verification reset code
    async verificationCode(req, res){
        const {email, code} = req.body 
        if(!email || !code) return res.status(400).json({message:"ایمیل یا کدبازیابی نباید خالی باشد"})
        try{
            const user = await UserModel.findOne({email})
            if(!user) return res.status(400).json({message:"کاریری  یافت نشد"})
            const dbCode = await codeModel.findOne({user:user.id})
            if(dbCode.code !== code){
                res.status(400).json({message:"کدبازیابی معتبر نیست"})
            }
            res.status(200).json(code)
        }
        catch(error){
            res.status(500).json({message:error.message})
        }
    } 

    // change password 
    async changePassword(req, res){
        const {email, code, password} = req.body 
        if(!email || !code || !password){
            return res.status(400).json({message:"ایمیل یا کدبازیابی یا گذرواژه نباید خالی باشد"})
        
        }
        try{
            const user = await UserModel.findOne({email})
            if(!user) return res.status(400).json({message:"کاریری  یافت نشد"})
            const dbCode = await codeModel.findOne({user:user.id})
            if(dbCode.code !== code){
                res.status(400).json({message:"کدبازیابی معتبر نیست"})
            }
            user.password = password 
            await user.save() 
            await dbCode.deleteOne() 
            res.status(200).json({message:"گذرواژه با موفقیت تغییر کرد"})

        }
        catch(error){
            res.status(500).json({message:error.message})
        }
    }

    // get profile 
    async getProfile(req, res){
        try{
            const {userId} = req
            if(!userId) return res.status(400).json({message:"نام کاربری یافت نشد"})
            const profile = await UserModel.findById(userId).select('-password -_id -refreshToken -roles -createdAt -updatedAt')
           
            if(!profile) return res.status(400).json({message:" کاربر یافت نشد"})
            
            res.json(profile)
        }
        catch(error){
            res.status(500).json({message:error.message})
        }
    }

}

export default new UserController()
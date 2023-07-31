import nodemailer from 'nodemailer' 
import {google} from 'googleapis' 

const {OAuth2} = google.auth 

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    OAUTH_LINK,
    EMAIL
} = process.env

const auth = new OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    OAUTH_LINK
)

export const sendVerificationEmail = (email, name, url) => {

    auth.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN
    }) 
    const accessToken = auth.getAccessToken() 
    const stmp = nodemailer.createTransport({
        service:'gmail',
        auth: {
            type:'OAUTH2', 
            user: EMAIL, 
            clientId: GOOGLE_CLIENT_ID, 
            clientSecret: GOOGLE_CLIENT_SECRET, 
            accessToken, 
            refreshToken: GOOGLE_REFRESH_TOKEN
        }
    })  

    const mailOptions = { 
        from: EMAIL, 
        to: email, 
        subject:'احراز هویت کاربر',
        html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img src="https://res.cloudinary.com/dvyswgcpm/image/upload/v1690223655/ce56j2omlnjgqh4xsyln.jpg" alt="" style="width:30px"><span>:فعالـ کردن اکانت وبلاگی</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>سلام ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">شما یک حساب در "وبلاگی" ثبت کرده اید، قبل از اینکه بتوانید از حساب خود استفاده کنید، باید با کلیک کردن در اینجا تأیید کنید که این آدرس ایمیل شماست: </span></div><a href=${url} style="width:200px;padding:10px 15px;background:#FF5722;color:#fff;text-decoration:none;font-weight:600">احراز هویت حساب کاربری</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">با احترام،وبــلاگی</span></div></div>`
    }

    stmp.sendMail(mailOptions, (err, res) => {
        if(err) return err
        return res
    })
}

export const sendResetPasswrodCode = (email, name, code) => {
    auth.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN
    })
    const accessToken = auth.getAccessToken() 
    const stmp = nodemailer.createTransport({
        service:'gmail', 
        auth:{
            type:'OAUTH2', 
            user: EMAIL, 
            clientId: GOOGLE_CLIENT_ID, 
            clientSecret: GOOGLE_CLIENT_SECRET, 
            accessToken, 
            refreshToken: GOOGLE_REFRESH_TOKEN
        }
    }) 

    const mailOptions = { 
        from: EMAIL, 
        to: email, 
        subject:'ریست گذرواژه وبلاگی', 
        html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img src="https://res.cloudinary.com/dvyswgcpm/image/upload/v1690223655/ce56j2omlnjgqh4xsyln.jpg" alt="" style="width:30px"></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>سلام ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">شما اخیراً درخواست کرده اید رمز عبور حساب "وبلاگی" خود را بازنشانی کنید. </span></div><button style="width:200px;padding:10px 15px;background:#FF5722;color:#fff;text-decoration:none;font-weight:600">${code}</button><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">اگر درخواست بازنشانی رمز عبور نکرده اید، لطفاً این ایمیل را نادیده بگیرید یا به ما اطلاع دهید. این پیوند بازنشانی رمز عبور فقط برای 30 دقیقه آینده معتبر است.</span></div></div>`
    }
    stmp.sendMail(mailOptions, (err, res)=>{
        if (err) return err 
        return res
    })
}
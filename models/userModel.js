import mongoose from "mongoose"; 
import bcrypt from 'bcrypt' 
import randomstring from "randomstring"; 
import UserModel from '../models/userModel.js'


const userSchema = mongoose.Schema({

    first_name: {
        type:String, 
        required: [true, 'first name is required'], 
        trim: true, 
        text:true
    },
    last_name: {
        type: String, 
        required: [true, 'last name is required'],
        trim: true, 
        text: true
    }, 
    username: {
        type: String, 
        required: [true, 'username is required'], 
        trim: true, 
        text: true, 
        uinque: true
    },
    email: {
        type: String, 
        required: [true, 'E-mail is required'],
        trim: true
    },
    password: {
        type: String, 
        required: [true, 'password is required'], 
        trim: true
    }, 
    picture: {
        type: String, 
        trim: true, 
        default: "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?w=2000"
    },
    roles: {
        User:{type:Number, default:1004}, 
        Admin:Number,
        Editor:Number,
        Author:Number
    },
    verified:{
        type:Boolean,
        default:false
    },
    refreshToken: [String]
},
{timestamps: true}
)

userSchema.pre('save', async function(next){
    let user = this
    if(!user.isModified('password')) return next() 
    try{
        const salt = await bcrypt.genSalt(12)
        user.password = await bcrypt.hash(user.password, salt)
        return next()
    }
    catch(err){
        return next(err)
    }
})

userSchema.methods.generateUsername = async function(){
    let user = null 
    let username = this.username 
    do{
        user = await UserModel.findOne({username})
        if(user) username += randomstring.generate(4)
    }
    while(user)
    
    return username
} 

export default mongoose.model('User', userSchema)
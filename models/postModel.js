import mongoose from "mongoose";
import randomstring from "randomstring";
import PostModel from '../models/postModel.js' 
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
const { ObjectId } = mongoose.Schema

const postSchema = new mongoose.Schema({
    serialNumber:{
        type:String,
        required: [true, 'serialNumber is required'],
        trim: true,
        text: true
    },
    title: {
        type: String,
        required: [true, 'title is required'],
        trim: true,
        text: true
    },
    descriptions: {
        type: String,
        required: [true, 'descriptions is required'],
        trim: true,
        text: true
    },
    status: {
        type: String,
        enum: ["puplished", "pending", "unPuplished", "delete"],
        default:"unPuplished"
    },
    categories: [
        {
            type: ObjectId,
            ref: 'Category'
        }
    ],
    author: {
        type: ObjectId,
        ref: 'User'
    },
    picture: {
        type: String,
        required: [true, 'picture is required']
    },
    background: { type: String },
    comments: [
        {
            comment: { type: String },
            commentBy: {
                type: ObjectId,
                ref: 'User'
            },
            commentAt: {
                type: Date,
                default: new Date()
            }
        }
    ]
}, { timestamps: true }
)

postSchema.methods.uniqueSerialNumber = async function(){
    let post = null 
    let serialNumber = this.serialNumber 
    do{
        post = await PostModel.findOne({serialNumber}) 
        if (post) serialNumber += randomstring.generate(6) 

    }
    while(post)
    return serialNumber

}
postSchema.plugin(aggregatePaginate) 
export default mongoose.model('Post', postSchema)


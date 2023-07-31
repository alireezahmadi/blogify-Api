import mongoose from "mongoose";

const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema

const categorySchema = new Schema({
    parent: {
        type: ObjectId,
        ref: 'Category',
        default: null
    },
    title: {
        type: String,
        required: [true, 'title is required'],
        trim: true,
        text: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
    },
    { timestamps: true }
)

export default mongoose.model('Category', categorySchema)
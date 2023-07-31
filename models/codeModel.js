import mongoose from "mongoose"; 


const {ObjectId} = mongoose.Schema 

const codeShema = new mongoose.Schema({
    code: { type: String, required: [true, 'code is required']},
    user: { type: ObjectId, ref: "User", required: true}
})

export default mongoose.model('Code', codeShema)
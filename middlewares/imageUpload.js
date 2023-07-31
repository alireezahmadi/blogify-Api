import fs from 'fs' 

const imageUpload = async (req, res, next) =>{
    try{
        if(!req.files || Object.values(req.files).flat().length ==0 ){
            return res.status(400).json({message:"فایلی انتخاب نشد"})
        }
        const files = Object.values(req.files).flat() 
        const fileTypes = ['png', 'jpeg', 'gif', 'webp']
        files.forEach(file => {
            if(!fileTypes.includes(file.mimetype.split('/')[1])){
                removeTemp(file.tempFilePath)
                return res.status(400).json({message:"فرمت فایل صحیح نیست"})
            }
            if(file.size > 1024 * 1024 * 5){
                removeTemp(file.tempFilePath)
                return res.status(400).json({message:"سایز فایل بزرگ هست"})
            }
        })
        next()
    }
    catch(error){
        res.status(500).json({message:error.message})
    }
}

const removeTemp = (path) => {
    fs.unlink(path, (err) => {
        if (err) throw error
    })
}

export default imageUpload
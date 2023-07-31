import fs from 'fs'
import cloudinary from 'cloudinary'
import autoBind from 'auto-bind'



class UploadController {
    constructor() {
        autoBind(this)
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        });

    }
    async upalodImages(req, res) {
        const { path } = req.body
        if (!path) return res.status(400).json({ message: "نام فایل انتخاب نشده است" })
        let files = Object.values(req.files).flat()
        let images = []
        for (const file of files) {
            const url = await this.#uploadToCloudinary(file, path)
            images.push(url)
            this.#removeTemp(file.tempFilePath)
        }
        res.json({ images })
    }

    #removeTemp(path) {
        fs.unlink(path, (error) => {
            if (error) {
                console.log("error for removeTemp", error)
            }
        })
    }

    async #uploadToCloudinary(file, path) {
        return new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload(
                file.tempFilePath,
                {
                    folder: path
                },
                (err, res) => {
                    if (err) {
                        this.#removeTemp(file.tempFilePath)
                        console.log('error for upload to cloudinay', err)
                        return reject(err)
                    }
                    resolve({
                        url: res.secure_url
                    })

                }
            )
        })
    }

    async getListImages(req, res) {
        const { path, sort, max } = req.body
        cloudinary.v2.search
            .expression(`${path}`)
            .sort_by("created_at", `${sort}`)
            .max_results(max)
            .execute()
            .then((result) => {
                let images = []
                if(result.resources.length > 0){
                    images = result.resources.map((item) => {
                        return {
                            puplic_id: item.public_id, 
                            url: item.secure_url
                        }
                    })
                }
                res.json({ images })
            })
            .catch((error) => {
                console.log(error)
                res.status(500).json({message:"Error in get images"})
            })
    }
}

export default new UploadController
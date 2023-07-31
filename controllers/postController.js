import PostModel from '../models/postModel.js'
import CategoryModel from '../models/categoryModel.js'
import UserModel from '../models/userModel.js'

class PostController {
    constructor() { }

    async createPost(req, res) {
        try {
            const data = req.body
            console.log(data)
            if (!data.title && !data.descriptions && !data.picture) {
                return res.status(400).json({ message: "عنوان یا توضیحات یا تصویر زمینه نباید خالی باشد" })

            }
            const oldPost = await PostModel.findOne({serialNumber:data.title}) 
            if(oldPost) return res.status(400).json({message:"این از قبل ایجاد شده است"})
            let categories = []
            let DoseNotExistCategories = []
            if (data.categories) {
                for (const category of data.categories) {
                    const categoryExe = await CategoryModel.findOne({ title: category })
                    if (categoryExe) {

                        categories.push(categoryExe.id)
                    } else {
                        let _category = {};
                        _category[category] = `${category} وجود ندارد`
                        DoseNotExistCategories.push(_category)
                    }
                }
            }
            const post = await new PostModel({
                ...req.body,
                author: req.userId,
                categories: categories,
                serialNumber: data.title
            })
            post.serialNumber = await post.uniqueSerialNumber()
            await post.save()
            if(DoseNotExistCategories.length > 0){
                return res.status(400).json({message:DoseNotExistCategories})
            }
            res.json(
                await post.populate([
                    {
                        path:"author", 
                        select: "first_name last_name email picture"
                    }, 
                    {
                        path:'categories', 
                        select:['title']
                    }
                ])
            )
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    }

    async getPosts(req, res){
        try{
            const pageNum = parseInt(req.query.pageNum) || 1
            const pageLimit = parseInt(req.query.pageLimit) || 3 
            const options = {
                page:pageNum,
                limit:pageLimit
            } 
            const postModelAggregate = PostModel.aggregate([
                
                {
                    $lookup:{
                        from:'users', 
                        localField:"author", 
                        foreignField: "_id", 
                        as:'author', 
                        pipeline:[
                            {
                                $project:{
                                    first_name: 1,
                                    last_name: 1,
                                    username: 1,
                                    email: 1,
                                    picture: 1,
                                }
                            }
                        ]
                    }
                }, 
                {
                    $lookup:{
                        from:'categories', 
                        localField:'categories', 
                        foreignField:"_id",
                        as: 'categories',
                        pipeline:[
                            {
                                $project:{
                                    title: 1, 
                                  
                                }
                            }
                        ]
                    }
                },
                {
                    $sort:{ createAt: -1 }
                }
            ]) 
            const posts = await PostModel.aggregatePaginate(
                postModelAggregate, 
                options
            )
            res.json(posts)
        }
        catch(error){
            if(error) res.status(500).json({message:error.message})
        }
    }

    async getAllPostAuthort(req, res){
        try{
            const pageNum = parseInt(req.query.pageNum) || 1
            const pageLimit = parseInt(req.query.pageLimit) || 3
            const options = {
                page: pageNum, 
                limit: pageLimit
            }
            const author = req.param('author') 
            if(!author)return res.status(400).json({message:"نام نویسنده مشخص نیست !"})
            const userExec = await UserModel.findOne({username:author}).exec()
            if(!userExec) return res.status(400).json({message:"مقاله ای با این نویسنده یافت نشد"})
            const postModelAggregate = PostModel.aggregate([
                {
                    $lookup:{
                        from:"users", 
                        localField:"author", 
                        foreignField: "_id", 
                        as:'author',
                        pipeline:[
                            {
                                first_name: 1,
                                last_name: 1,
                                username: 1,
                                email: 1,
                                picture: 1,
                            }
                        ]
                    }, 
                    $lookup:{
                        from:"categories", 
                        localField:"categories", 
                        foreignField: "_id", 
                        as:'categories',
                        pipeline:[
                            {
                                title: 1
                            }
                        ]
                    } 
                    
                }, 
                {
                    $sort:{createdAt: -1}
                }

            ]) 
            const posts = await PostModel.aggregatePaginate(
                postModelAggregate, 
                options
            )
            res.json(posts)
        }
        catch(error){
            res.status(500).json({message:error.message})
        }
    }

    async updatePost(req, res){
        try{
            const serialNum = req.param('serialNum') 
            const userRoles = req.roles
           
            const data = req.body 
            let infos = {...data}
            let editeCategory = []
            let DoseNotExistsCategory = [] 
            const postExec = await PostModel.findOne({serialNumber: serialNum})
            if(!postExec) return res.status(400).json({message:"مقاله ای یافت نشد"})

            if(data.author){

                const username = data.author
                const userExec = await UserModel.findOne({username: username})
                
                if(!userExec) return res.status(400).json({message:"کاربر وجود ندارد"})
               
                infos = {...infos, author:userExec.id}
            }
            if(data.categories){
                for(const category of data.categories){
                    const categoryExec = await CategoryModel.findOne({title:category})
                    if(categoryExec){
                        editeCategory.push(categoryExec.id)
                        
                    }else{
                        let _category = {}
                        _category[category] = `${category} وجود ندارد`
                        DoseNotExistsCategory.push(_category)
                    }
                    infos = {...infos, ["categories"]:editeCategory}
                }
            }
            if(data.status){ 
                const statusType = userRoles.includes(1001)
                                ? ["puplished", "pending", "unPuplished", "delete"] 
                                :
                                 userRoles.includes(1003) 
                                ?  ["pending", "unPuplished"]
                                : []
                               
                if(statusType.length > 0 && statusType.includes(data.status)){
                    
                    infos = {...infos, ["status"]:data.status}
                }
 
            }

            const post = await PostModel.findOneAndUpdate({serialNumber:serialNum},{...infos},{new:true})

            if(DoseNotExistsCategory.length > 0) return res.status(400).json(DoseNotExistsCategory)

            res.json(
                await post.populate([
                    {
                        path:'author',
                        select:['first_name', 'last_name', 'username', 'picture']
                    }, 
                    {
                        path:'categories',
                        select:['title']
                    }
                ])
            )
        }
        catch(error){
            res.status(500).json({message:error.message})
        }   
    }

    async deletePost(req, res){
        try{
            const serialNum = req.param('serialNum')  
            if(!serialNum) return res.status(400).json({message:`"${serialNum}" مشخص نیست`})

            const post = await PostModel.findOne({serialNumber:serialNum}) 
            if(!post) return res.status(400).json({message:"مقاله ای با این مشخصات یافت نشد"})
            await post.deleteOne()
            res.sendStatus(200)
        }
        catch(error){
            res.status(500).json({message:error.message})
        }
    }

}
export default new PostController
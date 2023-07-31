import CategoryModel from '../models/categoryModel.js'

class CategoryController {
    constructor() { }

    async createCategory(req, res) {
        try {
            const { title, parent } = req.body
            let newCategory = null
            if (!title) return res.status(400).json({ message: "نام دسته بندی قید نشده هست" })
            const categoryExec = await CategoryModel.findOne({ title })
            if (categoryExec) return res.status(400).json({ message: "نام دسته بندی از قبل وجود دارد" })
            if (parent) {
                const subCategory = await CategoryModel.findOne({ title: parent })
                if (!subCategory) return res.status(400).json({ message: `"${parent}" وجود ندارد` })
                newCategory = await new CategoryModel({
                    ...req.body,
                    parent: subCategory
                }).save()
            } else {
                newCategory = await new CategoryModel({
                    title: title,
                    ...req.body
                }).save()
            }
            res.json({ data: newCategory })
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    }

    async updateCategory(req, res) {
        try {
            const { title, infos } = req.body
            let updateItem = { ...infos }

            if (!title) return res.status(400).json({ message: "نام دسته بندی قید نشده هست" })
            const categoryExec = await CategoryModel.findOne({ title })
            if (!categoryExec) return res.status(400).json({ message: `"${title}" وجود ندارد` })
            if (infos.title) {
                const titleInfos = infos.title
                const categoryExec = await CategoryModel.findOne({ title: titleInfos })
                if (categoryExec) return res.status(400).json({ message: `"${titleInfos}" این فیلد از قبل وجود دارد` })
                updateItem = { ...infos, title: titleInfos }
            }
            if (infos.parent) {
                const titleParent = infos.parent
                const categoryExec = await CategoryModel.findOne({ title: titleParent })
                if (!categoryExec) return res.sendStatus(400).json({ message: `"${titleParent}" این فیلد وجود ندارد` })
                updateItem = { ...infos, parent: categoryExec.id }
            }
            const updateCategory = await CategoryModel.findOneAndUpdate({ title: title }, { ...updateItem }, { new: true })
            res.json({ data: updateCategory })
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    }

    async deleteCategory(req, res) {
        try {
            const { title } = req.body
            if (!title) return res.status(400).json({ message: "نام دسته بندی قید نشده هست" })
            const targetCategory = await CategoryModel.findOne({ title })
            if (targetCategory) {
                const childsCategory = await CategoryModel.find()
                for (const child of childsCategory) {
                    if (child.parent == targetCategory.id) {
                        await child.deleteOne()
                    }

                    await targetCategory.deleteOne()
                }
            }

            res.status(200)
        }
        catch (error) {
            res.status(500).json({ message: error.message })
        }
    }

}

export default new CategoryController
import express from 'express' 
import categoryController from '../controllers/categoryController.js'

const router = express.Router() 

router.post('/create', categoryController.createCategory),
router.post('/update', categoryController.updateCategory),
router.post('/delete', categoryController.deleteCategory)
export default router
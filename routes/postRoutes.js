import express from 'express' 
import uploadController from '../controllers/uploadController.js'
import imageUpload from '../middlewares/imageUpload.js'  
import postController from '../controllers/postController.js'
import ROLES_LIST from '../config/roleList.js'
import verifyRoles from '../middlewares/verifyRoles.js'
import roleList from '../config/roleList.js'

const router = express.Router() 

router.get('/getAll', postController.getPosts)
router.post('/uploadImages', imageUpload, uploadController.upalodImages)
router.post('/getListImages', uploadController.getListImages)
router.post('/create', postController.createPost)
router.get('/getPosts/:author', postController.getAllPostAuthort)

// verify roles 
router.post('/editPost/:serialNum',verifyRoles(ROLES_LIST.Admin, roleList.Author), postController.updatePost)
router.post('/deletePost/:serialNum',verifyRoles(ROLES_LIST.Admin), postController.deletePost)

export default router
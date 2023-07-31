import express from 'express' 
import userController from '../controllers/userController.js'
import registerValidators from '../validators.js/registerValidator.js'
import authValidators from '../validators.js/authValidator.js'
import verifyJWT from '../middlewares/verifyJWT.js'

const router = express.Router() 

// puplic routes 
 router.post('/regiser', registerValidators(), userController.register)
 router.post('/login', authValidators(), userController.login)
 router.get('/refresh', userController.refresh)
 router.post('/sendResetPassword',  userController.sendResetPassword)
 router.post('/verificationResetCode', userController.verificationCode)
 router.post('/changePassword', userController.changePassword)

// protected routes 
router.use(verifyJWT)
router.post('/activate', userController.activateAccount)
router.post('/sendVerificationEmail', userController.sendVerificationEmail)
router.get('/logout', userController.logout)
router.get('/profile', userController.getProfile)

export default router

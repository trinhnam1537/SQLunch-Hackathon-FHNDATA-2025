const express = require('express')
const router = express.Router()
const flash = require('connect-flash');
const session = require('express-session')
const empAuthenticationController = require('../../app/controllers/auth/empAuthenticationController')

router.use(session({ 
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
router.use(flash())
router.get('/sign-in'           , empAuthenticationController.signIn )
router.post('/checking-account' , empAuthenticationController.checkingAccount )

router.get('/reset-password'                  , empAuthenticationController.resetPassword )
router.post('/reset-password/verifying-email' , empAuthenticationController.verifyingEmail )
router.post('/reset-password/verifying-code'  , empAuthenticationController.verifyingCode )
router.post('/resetting-password'             , empAuthenticationController.resettingPassword )

module.exports = router
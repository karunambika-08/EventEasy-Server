const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController");
 //Routes relevant for User Registration and login
router.post('/signin', userController.signIn) //Sign in
router.post('/signup', userController.post) //signup
router.get('/user/:id', userController.getUserDetails) // get particular user details
router.patch('/user/:id', userController.patch) //update user details
router.delete('/user/:id', userController.delete) //delete the user details

module.exports = router;
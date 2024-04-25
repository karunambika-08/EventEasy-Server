let {v4:uuid} = require('uuid');
const dbOperations = require('../database/dbOperations');
const moment = require('moment');
const { validateSignin, validateSignup } = require('../util/validation');
const { hashPassword, comparePassword } = require('../util/helpers');


// Function to handle user signin 
async function signInUser(req,res) {
    const {error, value} = validateSignin(req.body)
    if(error){
        console.log(error);
        return res.send(error.details);
    }
    let userDetailsArray = (await getUserByEmail(value.email));

    if(userDetailsArray.length >0){
        let emailInput = value.email
        let userDetails = userDetailsArray[0]
        console.log("emailInput",emailInput, emailInput ===userDetails.email);
        let passwordInput = value.password
        console.log("passwordInput",passwordInput, passwordInput ===userDetails.password);
        if(
            emailInput === userDetails.email 
            &&
            comparePassword(passwordInput,userDetails.password) 
        )
        {
            res.cookie('userId', userDetails.userId,{maxAge : 60000*60})
            return res.status(200).json({
                userDetails : {
                    userId : userDetails.userId,
                    username : userDetails.userName,
                    email : userDetails.email,
                    type : userDetails.type
                } 
            })
        }
        else{
           return  res.status(404).json({message: "Incorrect UserName and Password"})
        }
    }
    else{
       return res.status(200).json({userDetails : {}})
    }
}

/**
 * Signing up a new User
 */
async function signUpUser(req,res) {
    console.log("Comming into signup user ");
    const {error, value} = validateSignup(req.body)
    if(error){
        console.log(error);
        return res.send(error.details);
    }
     // Function to append User Id in User Request Input
    function appendUserID(){
        let userId = uuid()
        let userInput= value;
        userInput.password = hashPassword(userInput.password);
        console.log("user Input", value);
        userInput.userId = userId;
        userInput.createdAt = moment().valueOf();
        userInput.updatedAt = moment().valueOf();
        return userInput;
        }
       const existingUser = (await getUserByEmail(value.email));
       console.log("Existing User: " , existingUser);
        if(!existingUser){
            console.log("Comming into a new user");
            let newUserData = appendUserID() ;
            console.log("New User Data",newUserData);
            let userdataParams = {
                TableName : 'UserDetails',
                Item : newUserData
            }
            await dbOperations.addItemInTable('UserDetails',userdataParams)
            .then(()=>{
                    return res.status(201).json({userExists: false , userId :newUserData.userId })
            })
            .catch(()=>{
                res.status(404).send("Failed to add user in database")
            })
        }
        else{
            res.status(409).json({});
        }
}

async function getUserByEmail(email){
    const userParam = {
        TableName : 'UserDetails',
        KeyConditionExpression : "email = :email",
        ExpressionAttributeValues: {
            ":email": email
        }
      
    };
    let response = await dbOperations.queryItemsinTable(userParam)
    .then((items)=>{
        if(items.ScannedCount > 0){
            console.log("Items------>",items);
            return items.Items
        }
        else {
            return false; //User Not found
         }
    })
    .catch((err)=>{
        return err
    });

    return (response);
}

//Function to get user details
async function getUserDetails(req,res){
    let email = req.params.id;
    await getUserByEmail(email)
    .then((items)=>{
        console.log('getUserDetails',items);
        return res.status(200).json( {
               userName: items[0].userName,
           type:items[0].type,
           userId: items[0].userId,
           email: items[0].email
            }
        )
    } 
    ).catch((err)=>{
        
        message = err.message
    })
}



/**
 * Function to update user data
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */

async function updateUserData(req,res) {
    let updateDataParams = {
        TableName : "UserDetails",
        Key : {
            email: req.params.id

        },
        UpdateExpression: "set userName= :userName , password = :password",
        ExpressionAttributeValues: {
            ":userName": req.body.userName,
            ":password": req.body.userPassword
          },
        ReturnValues: "ALL_NEW",
    }
    dbOperations.updateAnItemInTable(updateDataParams)
    res.status(200).send("User has been edited in" )
}

//Function to delete userdata
async function deleteUserData(req,res) {
    console.log(req.params.id);
    let userDeleteParams = {
        TableName : "UserDetails",
        Key : {
            email : req.params.id
        }
    }
    let userDetails = await getUserByEmail(userDeleteParams.Key.email)
        console.log("User details: " ,userDetails);
        if(userDetails.length>0){
            console.log("Comming ----------------");
            await dbOperations.deleteAnItemInTable(userDeleteParams)
        .then((items)=>{
            return res.status(200).json({
                message : "User Deleted Successfully",
                items : items.Items} 
                )
        }).catch((error)=>{
            res.status(500).json({
                message : error.message
            })
        })
        }
        else{
            return res.status(404).json({
                message : "User Not Found"
            })
        }

   
    console.log("Delete user details",userDetails );
    
}

module.exports ={
    signIn : signInUser,
    post: signUpUser,
    patch : updateUserData,
    delete : deleteUserData,
    getUserDetails : getUserDetails
}
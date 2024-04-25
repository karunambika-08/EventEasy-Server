const bcrypt = require('bcrypt')

const saltRounds = 10;
 const hashPassword = (password)=>{
    const salt = bcrypt.genSaltSync(saltRounds);
    console.log(salt)
     return bcrypt.hashSync(password, salt);
}


 const comparePassword = (plain,hashed) =>{
    return bcrypt.compareSync(plain,hashed)
}

module.exports = {hashPassword , comparePassword};
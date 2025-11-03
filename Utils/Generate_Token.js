const jwt = require('jsonwebtoken')
const Refresh = require('../models/Refresh');

const Generate_token = async (user) => { 
    const accessToken =  jwt.sign({
        userId : user._id
    },process.env.Prab_key, {expiresIn : '50m'})
  
    const refreshToken = crypto.randomBytes(40).toString("hex")
    const   ExpireAt = new Date()
     ExpireAt.setDate( ExpireAt.getDate()  + 7)   //! refresh token expires in 7d

    await Refresh.create({
        token : refreshToken,
        user : user._id,
         ExpireAt
    })
     
    return {accessToken,refreshToken}

}
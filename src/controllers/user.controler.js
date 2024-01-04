import {asyncHandler}  from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/coludinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
const registerUser=asyncHandler(async (req,res)=>{
//get user detials from frontend
//validation-not empty
//check user  alerady exist-username email
//check for imges ,check for avtar 
//upload them to cloudniary,avtar check
//create user object -create entry in db
//remove password andr refresh token filed from response
//check for user creation
//return res

const {fullname,email,username,password}=req.body
console.log("email:",email);
if([fullname,email,username,password].some((field)=>field?.trim()==="")){
throw new ApiError(400,"All field is required")
}
User.findOne({
    $or:[{username} ,{email}]
})

if(existedUser){
    throw new ApiError(409,"User with mail and usermname already exist")
}

const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){
    throw new ApiError(400,"Avtar file is required")
    }

 const avatar= await  uploadOncloudinary(avatarLocalPath)
const coverImage=await uploadOncloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avtar file is required")
}

User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
})

const createUser=await User.findById(User._id).select(
    "-password -refreshToken"
)

if(!createUser){
    throw new ApiError(500,"something went wrong whikle registering user")
}


return res.status(201).json(
    new Apiresponse(200,createUser,"mesage registered sucessfully")
)



  
 
})

export {registerUser}
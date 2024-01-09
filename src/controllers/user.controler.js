import {asyncHandler}  from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/coludinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import  jwt  from "jsonwebtoken";

const generateAcessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        if (!user) {
            // Handle user not found
            throw new ApiError(404, "User not found");
        }
      const accessToken =  user.generateAccessToken()
      const refreshToken =  user.generateRefreshToken()
      user.refreshToken=refreshToken
    await  user.save({validateBeforeSave:false});

   return {accessToken,refreshToken};


    } catch (error) {
        console.error("Unhandled error:", error);
        throw new ApiError(500,"something went wrong while generating refresh and acess token")
    }
}


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
const existedUser=await User.findOne({
    $or:[{username} ,{email}]
})

if(existedUser){
    throw new ApiError(409,"User with mail and usermname already exist")
}
console.log(req.files);

const avatarLocalPath=req.files?.avatar[0]?.path;
//const coverImageLocalPath=req.files?.coverImage[0]?.path;
let coverImageLocalPath;
if (req.files&&Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0) {
    coverImageLocalPath=req.files.coverImage[0].path
    
}
if(!avatarLocalPath){
    throw new ApiError(400,"Avtar file is required")
    }

 const avatar= await  uploadOncloudinary(avatarLocalPath)
const coverImage=await uploadOncloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avtar file is required")
}

const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
})

const createUser=await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createUser){
    throw new ApiError(500,"something went wrong while registering user")
}


return res.status(201).json(
    new Apiresponse(200,createUser,"mesage registered sucessfully")
)



  
 
})
const loginUser=asyncHandler(async(req,res)=>{
    //req body ->data
    //username or email
    //find the user
    //password check
    //acess and refreshtoken
    //send coookies
    
    const {email,username,password}=req.body
    if(!username&& !email){
        throw new ApiError(400,"username or email is required" )

    }

   const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user not find")

    }
   const ispasswordValid= await user.isPasswordCorrect (password)

   if(!ispasswordValid){
    throw new ApiError(404,"password is not correct")

    }
     const {accessToken,refreshToken}=await generateAcessAndRefreshTokens(user._id)

     const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

     const options={
        httpOnly:true,
        secure:true
     }

     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new Apiresponse(
            200,
            {
                user:loggedInUser,accessToken,
                refreshToken
            },"User logged in sucessfull"
        )
     )
})

const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate( req.user._id ,
    {
      $set:{
        refreshToken:1
      }  
    },
    {
        new:true
    })
    const options={
        httpOnly:true,
        secure:true
     }

     return res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new Apiresponse(200,{},"user loged out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
     const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken 
     
     if(incomingRefreshToken){
        throw new ApiError(401,"unauthrized request")

     }

   try {
    const decodedToken=  jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )
 
      const user=await User.findById(decodedToken?._id)
 
      if(!user){
         throw new ApiError(401,"invalid refresh token")
 
      }
      if(incomingRefreshToken!== user?.refreshToken) {
         throw new ApiError(401,"refresh tpken is expired or used")
      }
 
      const options={
         httpOnly:true,
         secure:true
      }
 
  const {accessToken,newrefreshToken} = await  generateAcessAndRefreshTokens(user._id)
 
    return  res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
     new Apiresponse(
     200,
     {accessToken,refreshToken:newrefreshToken},
     "Acess token refreshed"
      )
     )
   } catch (error) {
    throw new ApiError(401,error?.message||"invald refresh token")
   }


})

export {registerUser,
loginUser,
logoutUser,
refreshAccessToken}
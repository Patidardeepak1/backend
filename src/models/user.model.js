import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema=new Schema({
username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true
},
email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true

},
fullname:{
    type:String,
    required:true,
    trim:true,
    index:true
},
avatr:{
    type:String,//cloudnary url
    required:true,
    
},
coverimage:{
    type:String,
},
watchhistory:[{
   type:Schema.Types.ObjectId,
   ref:"Video"
}],
password:{
    type:String,
    required:[true,'password is required']
},
refreshToken:{type:String}
},{timestamps:true})


userSchema.pre("save",async function (next) {
    if(!this.isModified("password"))return next();
    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async  function
(password){
return  await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
  return jwt.sign({
    _id:this.id,
    email:this.email,
    username:this.username,
    fullname:this.fullname

   },
   procee.env.ACESS_TOKEN_SECRET,
   {
    expiresIn:process.env.ACESS_TOKEN_EXPIRY
   })
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this.id,
        
    
       },
       procee.env.REFRESH_TOKEN_SECRET,
       {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
       })
}

export const User=mongoose.model("User",userSchema)
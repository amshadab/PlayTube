import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isValidEmail } from "../utils/validation.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const generateAcessAndRefreshTokens = async (userId)=>{
      try {
        const user = await User.findById(userId);
        const accessToken=user.generateAccessToken();
       const refreshToken= user.generateRefreshToken();
       user.refreshToken = refreshToken;
       await user.save({validateBeforeSave: false});
       return {accessToken,refreshToken}

      
      } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token");
      }
}

 const registerUser = asyncHandler(async(req,res)=>{
    // get user detail from frontend
    // validation - not empty
    // check if user already exist - username , email
    // check for images check for avatar
    // upload then to cloudinary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response

   const {fullName,email,userName,password}= req.body
  //  console.log(fullName,email,userName);

  if([fullName,email,userName,password].some((field)=>field?.trim()==="")){
     if (req.files?.avatar?.[0]?.path) {
  fs.unlinkSync(req.files.avatar[0].path);
}
if (req.files?.coverImage?.[0]?.path) {
  fs.unlinkSync(req.files.coverImage[0].path);
}
    throw new ApiError(400,"All fields are required");
  }
  if(!isValidEmail(email)){
    if (req.files?.avatar?.[0]?.path) {
  fs.unlinkSync(req.files.avatar[0].path);
}
if (req.files?.coverImage?.[0]?.path) {
  fs.unlinkSync(req.files.coverImage[0].path);
}
    throw new ApiError(400,"Email should be in correct format");
  }
  
  const existedUser= await User.findOne({
    $or:[{userName},{email}]
  });

  if(existedUser){
    if (req.files?.avatar?.[0]?.path) {
  fs.unlinkSync(req.files.avatar[0].path);
}
if (req.files?.coverImage?.[0]?.path) {
  fs.unlinkSync(req.files.coverImage[0].path);
}
    throw new ApiError(409,"User Already Exist")
  }

  // console.log(req.files);
  // console.log("🧾 Avatar File:", req.files?.avatar);
  // console.log("Rquest.files: ",req.files);
  
  const avatarLocalPath=req.files?.avatar[0]?.path;
  // const coverImageLocalPath=req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
  }

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar image is required");
  }
  
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if(!avatar){
    throw new ApiError(400,"Avatar image is required");
  }

const user=  await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    password,
    email,
    userName:userName.toLowerCase()
  });

  const cretedUser= await User.findById(user._id).select("-password -refreshToken");

  if(!cretedUser){
    throw new ApiError(500,"Something went wrong while registering user");
  }

  return res.status(201).json(new ApiResponse(200,cretedUser,"User Registered Successfully")); 
});

const loginUser = asyncHandler(async(req,res)=>{
      // Take data from req.body
      // username or email
      // validation
      // find the user
      // check password
      // access and refresh token
      // send cookies
// console.log(req.body);

      const {email,userName,password} = req.body;
     
      

      if(!(userName || email)){
        throw new ApiError(400,"Username or Email is required")
      }

     const user= await User.findOne({
        $or:[{userName},{email}]
      });

      if(!user){
        throw new ApiError(404,"User does not exist");
      }

      const isPasswordValid=  await user.ispasswordCorrect(password);

      if(!isPasswordValid){
        throw new ApiError(401,"Password is incorrect");
      }

      const {accessToken,refreshToken} = await generateAcessAndRefreshTokens(user._id);

      const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

      //make cookie modifiable only by server not frontend
      const options = {
        httpOnly:true,
        secure:true
      }

      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(new ApiResponse(200,{
        user:loggedInUser,accessToken,refreshToken
      },
    "User logged in successfully"));

});

const logoutUser= asyncHandler(async(req,res)=>{
   const loggedOutUser=await User.findByIdAndUpdate(req.user._id,{$set: {refreshToken:undefined}},{new:true});

   const options = {
        httpOnly:true,
        secure:true
      }

      return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"User logged out"))

});

const refrshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

   if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized Request")
   }

  try {
     const decodedToken = jwt.verify(incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
     );
  
    const user =  await User.findById(decodedToken?._id);
  
     if(!user){
      throw new ApiError(401,"Invalid Refresh Token");
     }
  
     if(await user.refreshToken !== incomingRefreshToken){
        throw new ApiError(401,"Refresh token is expired or Used");
     }
    
     const options ={
      httpOnly:true,
      secure:true
     }
  
   const newTokens = await generateAcessAndRefreshTokens(user._id);

   const newAccessToken = newTokens.accessToken;
const newRefreshToken = newTokens.refreshToken;
  
    return res
    .status(200)
    .cookie("accessToken",newAccessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{newAccessToken,newRefreshToken},"Access token refresh"));
  
    
  } catch (error) {
    throw new ApiError(401,error?.message||"Invalid refresh token");
    
  }

});

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword,confirmPassword} = req.body;

  if(confirmPassword != newPassword){
    throw new ApiError(400,"Confirm Password and New Password should be same");
  }

 const user = await User.findById(req.user?._id);
 const isValidPassword= await user.ispasswordCorrect(oldPassword);

 if(!isValidPassword){
  throw new ApiError(400,"Invalid password");
 }
 user.password=confirmPassword;
 await user.save({validateBeforeSave:false});

 return res.status(200).json(new ApiResponse(200,"Password changed successfully"));

});


const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,"Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body;

  if(!fullName || !email){
    throw new ApiError(400,"All fields are required");
  }

  const updatedUser = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {new:true}).select("-password");

    return res.status(200)
    .json(new ApiResponse(200,updatedUser,"Account details updated successfully"));

});

const updateAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path
  console.log(avatarLocalPath);
  
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading avatar");
  }

  const updatedAvatar=await User.findByIdAndUpdate(req.user?._id,{
   $set:{
     avatar:avatar.url
   }
  },{new:true}).select("-password");

  if(!updateAvatar){
    throw new ApiError(200,"Error while saving avatar in db")
  }

  return res.status(200)
  .json(new ApiResponse(200,updatedAvatar,"Avatar updated successfully"))

});

const updateCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path;

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image file is missing")
  }

  const coverImage=await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage){
    throw new ApiError(400,"Error while uploading cover image")
  }

  const updatedCoverImage=await User.findByIdAndUpdate(req.user?._id,{
    $set:{
      coverImage:coverImage.url
    }
  },{new:true}).select("-password");

  
if(!updatedCoverImage){
    throw new ApiError(400,"Error while saving cover image in db")
  }
  
 return res.status(200)
  .json(new ApiResponse(200,updatedCoverImage,"Cover image updated successfully"))

})

export{
    registerUser,
    loginUser,
    logoutUser,
    refrshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage
}
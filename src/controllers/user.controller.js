import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isValidEmail } from "../utils/validation.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";



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


export{
    registerUser,
    loginUser,
    logoutUser
}
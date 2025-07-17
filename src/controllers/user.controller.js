import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isValidEmail } from "../utils/validation.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
   console.log(fullName,email,userName);

  if([fullName,email,userName,password].some((field)=>field?.trim()==="")){
    throw new ApiError(400,"All fields are required");
  }
  if(!isValidEmail(email)){
    throw new ApiError(400,"Email should be in correct format");
  }
  
  const existedUser= await User.findOne({
    $or:[{userName},{email}]
  });

  if(existedUser){
    throw new ApiError(409,"User Already Exist")
  }

  const avatarLocalPath=req.files?.avatar[0]?.path;
  const coverImageLocalPath=req.files?.coverImage[0]?.path;

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



export{
    registerUser
}
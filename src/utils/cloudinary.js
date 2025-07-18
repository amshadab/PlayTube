import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
    
const uploadOnCloudinary = async (filePath)=> {

    try {
        if(!filePath) return null;

     const response=  await cloudinary.uploader.upload(filePath,{resource_type:"auto"});

        // console.log("File Successfully uploaded on Cloudinary",response.url);
        // console.log("cloudinary response: ",response);
        
        fs.unlinkSync(filePath);

        return response;
        
    } catch (error) {
        fs.unlinkSync(filePath) //Remove the locally save temp. file if the upload operation failed
        return null;
        
    }
}

export{
    uploadOnCloudinary
}
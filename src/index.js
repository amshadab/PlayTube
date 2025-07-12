// require('dotenv').config({path:'./env'});
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({path:'./.env'});

connectDB();





// import dotenv from "dotenv";
// dotenv.config({ path: "./.env" });

// console.log("✅ ENV PORT:", process.env.PORT);
// console.log("✅ ENV MONGODB_URI:", process.env.MONGODB_URI);













// import express from "express";

// const app = express();


// ;(async ()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//        app.on("error",(e)=>{
//         console.log("ERROR: ",e);
//         throw error;
//        });

//        app.listen(process.env.PORT,()=>{
//         console.log(`Server is start at port ${process.env.PORT}`);
        
//        })
//     } catch (error) {
//         console.error("Error: ",error);
//         throw error
        
//     }
// })()
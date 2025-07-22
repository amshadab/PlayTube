import { Router } from "express";
import {loginUser, logoutUser, registerUser,refrshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logoutUser);

router.route("/refreshToken").post(refrshAccessToken);

router.route("/changePassword").post(verifyJWT,changeCurrentPassword);

router.route("/getUser").get(verifyJWT,getCurrentUser);

router.route("/updateAccountDetails").patch(verifyJWT,updateAccountDetails);

router.route("/updateAvatar").put(verifyJWT,upload.single("avatar"),updateAvatar);
router.route("/updateCoverImage").put(verifyJWT,upload.single("coverImage"),updateCoverImage);
export default router;
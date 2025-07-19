import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Extract token from cookie or header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // NOTE: fix spacing

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 2. Decode & verify token
    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodeToken || !decodeToken._id) {
      throw new ApiError(401, "Invalid token payload");
    }

    // 3. Find user
    const user = await User.findById(decodeToken._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verify Error:", error.message);
    throw new ApiError(401, "Invalid access token");
  }
});

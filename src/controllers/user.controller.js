import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.services.js"
import { ApiResponce } from "../utils/ApiResponce.js";





const registerUser = asyncHandler( async (req, res) => {
    // Algorithm for user register

    // get user details from frontend or postman
    // validation - not empty
    // check if user already exists: email and password 
    // get images and avatar (avatar is compulsory)
    // upload them on cloudinary, avatar (check)
    // create user object - create entry in db
    // remove password and refresh token field from responce
    // check for user creation
    // return responce

   const {username, email, password, fullName} = req.body

    // if (fullName === "") { 
    //     throw new ApiError(400, "fullname is required")
    // } 

    // You check all condition like that or use new method some()
    if (
        [username, fullName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exist in db use user models has direact connection with db
    const existedUser = await User.findOne({
        // operator 
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists! ")
    }

    // get files from locally using multer, multer add superpowers in req. 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload files() on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // check properlly avatar is uploaded on cloudinary
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user and entry in db
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email, 
        password, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })
    
    // remove password and refreshToken from res
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
   
    return res.status(201).json(
        new ApiResponce(200, createdUser, "User registered succesfully")
    )


})

export {registerUser}

// 
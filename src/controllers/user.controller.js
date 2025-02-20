import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.services.js"
import { ApiResponce } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

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
        throw new ApiError(409, "User with the same email ID or username already exists!")
    }
 
    // get files from locally using multer, multer add superpowers in req. 
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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

const loginUser = asyncHandler( async (req, res) => {
    // Algorithm:
    // access data from req.body
    // username or email
    // find the user from db
    // check password
    // generate access and refresh token for user
    // send user credintials and tokens in form of cookie

    const {username, email, password} = req.body

   if (!username && !email) {
    throw new ApiError(400, "email or username is required! ")
   } 

    // if user exists return 
    const user = await User.findOne({
        // mongoose operator just like if else
        $or: [{username}, {email}]
    })
    
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // this user is return from db
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // Specifies which document fields to include or exclude
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        // reason is access for only backend enginners, but frontend can view but can't modified
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponce(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this remove the field from the document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponce(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expires or used")
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }

        return res 
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponce(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                    "Access token refreshed",
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentUserPassword = asyncHandler( async (req, res) => {
    // Algorithm:
    // set three two fields old password, new password (optionlly we add 3rd field confirm password)
    // check user is logged in or not (use middleware at endpoint)
    // get user from auth.middleware -> req.user
    // check user old password
    // set user new password and save
    // send responce

    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponce(200, {}, "Password changed succesfully"))
})

const getCurrentUser = asyncHandler( async (req, res) => {
   return res
   .status(200)
   .json(new ApiResponce(200, req.user, "User fetched succesfully"))
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullName} = req.body;

    if (!fullName) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponce(200, user, "Account details updated successfully")) 

})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar to Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res 
    .status(200)
    .json(new ApiResponce( 
        200,
        user,
        "Avatar image updated successfully")
    )

})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path
    
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res 
    .status(200)
    .json(
        new ApiResponce (
        200,
        user,
        "Cover image updated successfully")
    )

})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    // profile link
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        // pipelines
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        { 
            // my subscribers (subscriberCount)
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" 
            }
        },
        {
            // my subscribers channel list (channelsSubscribedToCount)
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },

                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },

                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscribers"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
                coverImage: 1,
                avatar: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponce(
        200,
        channel[0],
        "User channel fetched successfully"
    ))

})

const getUserWatchHistory = asyncHandler( async (req, res) => {

    
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(req.user._id))
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // nested pipeline 
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponce(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}


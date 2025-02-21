import { Router } from "express";
import { registerUser,
     loginUser,
      logoutUser,
       refreshAccessToken,
        changeCurrentUserPassword,
         getCurrentUser,
         updateAccountDetails,
          updateUserAvatar,
           updateUserCoverImage, getUserChannelProfile, getUserWatchHistory  } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()


// post use when we call database operations  
// get use no need to call database operations
router.route("/register").post(
     upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
     ]),
     registerUser
)

router.route("/login").post(loginUser)

// secured routes section
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentUserPassword)

router.route("/current-user").post(verifyJWT, getCurrentUser)

// patch update only allowed fields once.
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getUserWatchHistory)


export default router
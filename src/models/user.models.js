import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video" 
        }
    ],
    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true, // index used for inhance the search optimization. like we search YT chaneel name on YT
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, 
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refereshToken: {
        type: String
    }

}, {timestamps: true})

// Use defalut function, we have to access this keyword. Arrow()=>{} has not access of this keyword.
// It helps to encrpt the password with the help of bcrypt.
userSchema.pre("save", async function(next) {
        if (!this.isModified("password"))  return next();

        this.password = bcrypt.hash(this.password, 10)
        next()
})

// custom method
userSchema.methods.isPasswordCorrect = async function(password){
    // return true or false
    return await bcrypt.compare(password, this.password)
}

userSchema.generateAccessToken = function(){
    // payload
    return jwt.sign(
    {
        _id: this._id,
        email: this.email,
        fullName: this.fullName,
        username: this.username
    },
      process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES
    }
)
}

userSchema.generateRefreshToken = function(){
    // payload
    return jwt.sign(
        {
            _id: this._id,
        },
          process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
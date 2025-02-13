import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET
});
    
    
// upload file on cloudinary.
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null 
        // upload the file on cloudinary
        const responce = await cloudinary.uploader.upload(localFilePath, {
           resource_type: "auto" 
        })
        console.log("File is uploaded sucessfullt on cloudinary", responce.url);
        
        return responce
    } catch (error) {
        // fs file storage
        fs.unlinkSync(localFilePath) // remove the saved locally temporary file as the upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}

    
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({ 
    path: './env'
});

// ConnectDB provide by default Promises to handle errors
connectDB()
.then(() => {
    app.on("Error", (error) => {
        console.log("DB CONNECTION ERROR: ", error);
        throw error;
    })
    app.listen(process.env.PORT, () => {
        console.log(`Server is running at PORT ${process.env.PORT}`);
        
    })
})
.catch((error) => {
    console.log("MONGODB connection failed !! ", error);
    
})


/*
import express from "express"
const app = express()
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("DB CONNECTION ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listen on a PORT ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error("ERROR DB_CONNECTION: ", error)
        throw error
    }
} )() 

*/
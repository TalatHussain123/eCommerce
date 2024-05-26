import mongoose from "mongoose";
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import { loadRoutes } from './routes.js';
import passport from "passport";

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: '123456asdfgh',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
dotenv.config();

// Set port from environment variables
const port = process.env.PORT || 3000;

// Connect to MongoDB
const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB!");
    } catch (error) {
        throw error;
    }
};


// Define routes
loadRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went wrong!";
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack,
    });
});

// Start server
app.listen(port, async () => {
    try {
        await connectToMongoDB();
        console.log('Server listening on port:', port);
    } catch (error) {
        console.error('Failed to start server:', error);
    }
});

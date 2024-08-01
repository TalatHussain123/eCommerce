import mongoose from 'mongoose';


const Otpverfication = new mongoose.Schema({
    email: {
        type: String,
        default: null,
    },
    otp: String,
    otpExpires: Date
}, { timestamps: true })


export default mongoose.model("OTP", Otpverfication)
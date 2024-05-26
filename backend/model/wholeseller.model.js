import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const wholeSellerSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactPersonName: { type: String, required: true },
    email: { type: String, required: true },
    businessType: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    countryAddress: { type: String, required: true },
    loggedIn: Boolean,
    userBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    avatar: {
        type: String,
        default: null,
    },
});

wholeSellerSchema.plugin(passportLocalMongoose, {
    usernameUnique: false,
    usernameField: 'email',
});

export default mongoose.model("Whole", wholeSellerSchema)
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const supplierSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    businessType: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    countryAddress: { type: String, required: true },
    loggedIn: Boolean,
    userBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    shippingAddress: {
        address: {
            type: String,
            default: null,
        },
        country: {
            type: String,
            default: null,
        },
        city: {
            type: String,
            default: null,
        },
        postalCode: {
            type: String,
            default: null,
        },
        contactInfo: {
            phoneNo: {
                type: Number,
                default: null,
            },
            email: {
                type: String,
                default: null,
            }
        },
    },
});

supplierSchema.pre('save', function (next) {
    this.shippingAddress.contactInfo.email = this.email;
    this.shippingAddress.contactInfo.phoneNo = this.phoneNumber;
    next();
});

supplierSchema.plugin(passportLocalMongoose, {
    usernameUnique: false,
    usernameField: 'email',
});

export default mongoose.model("Supplier", supplierSchema)
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const factorySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactPersonName: { type: String, required: true },
    email: { type: String, required: true },
    industryType: { type: String, required: true },
    taxID: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    countryAddress: { type: String, required: true },
    loggedIn: Boolean,
    userBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    shippingAddress: {
        address: {
            type: String,
            // required: true,
            default: null,
        },
        country: {
            type: String,
            // required: true,
            default: null,
        },
        city: {
            type: String,
            // required: true,
            default: null,
        },
        postalCode: {
            type: String,
            // required: true,
            default: null,
        },
        contactInfo: {
            phoneNo: {
                type: Number,
                // required: true,
                default: null,
            },
            email: {
                type: String,
                // required: true,
                default: null,
            }
        },
    },
});

factorySchema.pre('save', function (next) {
    this.shippingAddress.contactInfo.email = this.email;
    this.shippingAddress.contactInfo.phoneNo = this.contactPersonName;
    next();
});

factorySchema.plugin(passportLocalMongoose, {
    usernameUnique: false,
    usernameField: 'email',
});

export default mongoose.model("Factory", factorySchema)
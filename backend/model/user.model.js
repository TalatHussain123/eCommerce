import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
const { ObjectId } = mongoose;

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['Supplier', 'WholeSeller', 'Factory', 'User'],
        default: 'User'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    loggedIn: Boolean,
    avatar: {
        type: String,
        default: null,
    },
    wishlist: [{
        type: ObjectId,
        ref: 'Product',
        default: null,
    }],
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
}, { timestamps: true })

UserSchema.pre('save', function (next) {
    this.shippingAddress.contactInfo.email = this.email;
    next();
});

UserSchema.plugin(passportLocalMongoose, {
    usernameUnique: false,
    usernameField: 'email',

});

export default mongoose.model("User", UserSchema)
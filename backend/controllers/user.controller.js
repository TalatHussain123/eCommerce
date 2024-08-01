import User from "../model/user.model.js";
import Product from "../model/product.model.js";
import Supplier from "../model/supplier.model.js";
import Whole from "../model/wholeseller.model.js";
import Factory from "../model/factory.model.js";
import { generateToken } from "../auth/auth.js";
import { findUserByIdInModels } from "../common/common.js";
import nodemailer from 'nodemailer';
import otpModel from "../model/otp.model.js";

export const register = async (req, res, next) => {
    try {
        const {
            username,
            email,
            password,
            confirmPassword,
            role,
            companyName,
            businessType,
            industryType,
            countryAddress,
            contactPersonName,
            phoneNumber,
            taxID,
            ...userData
        } = req.body;

        if (!role) return res.status(400).json({ error: "Role is required" });

        const existingUser = await checkExistingUser(role, email, username, phoneNumber);
        if (existingUser) return res.status(400).json({ error: existingUser });

        if (role !== "User" && password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });

        const otp = generateSixDigitNumber();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        const tempUser = new otpModel({
            email,
            otp,
            otpExpires
        });

        await tempUser.save();
        await sendEmail(email, otp);

        res.status(201).json({ success: true, message: "OTP sent. Please verify your email to complete registration." });
    } catch (err) {
        next(err);
    }
};

export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp, username, password, role, companyName, businessType, industryType, countryAddress, contactPersonName, phoneNumber, taxID, ...userData } = req.body;

        const tempUser = await otpModel.findOne({ email, otp });

        if (!tempUser || tempUser.otpExpires < new Date()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const newUser = createUserInstance(role, { username, email, password, companyName, businessType, industryType, countryAddress, contactPersonName, phoneNumber, taxID, ...userData });
        if (!newUser) return res.status(400).json({ error: "Invalid role" });

        await newUser.setPassword(password);
        const savedUser = await newUser.save();

        await otpModel.deleteOne({ email, otp });

        res.status(201).json({ success: true, message: "User has been registered!", data: savedUser });
    } catch (err) {
        next(err);
    }
};

async function checkExistingUser(role, email, username, phoneNumber) {
    let user;
    switch (role) {
        case 'User':
            if (email || username) {
                user = await User.findOne({ $or: [{ email }, { username }] });
                if (user) return "Username or email already exists";
            } else {
                return "Email or username is required for User role";
            }
            break;
        case 'Supplier':
            if (email && phoneNumber) {
                user = await Supplier.findOne({ $or: [{ email }, { phoneNumber }] });
                if (user) return "Phone number or email already exists";
            }
            break;
        case 'WholeSeller':
            if (email && phoneNumber) {
                user = await Whole.findOne({ $or: [{ email }, { phoneNumber }] });
                if (user) return "Phone number or email already exists";
            }
            break;
        case 'Factory':
            if (email && phoneNumber) {
                user = await Factory.findOne({ $or: [{ email }, { phoneNumber }] });
                if (user) return "Phone number or email already exists";
            }
            break;
        default:
            return null;
    }
}

function createUserInstance(role, userData) {
    switch (role) {
        case 'User':
            const { username, email, password } = userData;
            return new User({ username, email, password, role, ...userData });
        case 'Supplier':
            const { email: supplierEmail, companyName, businessType, countryAddress, phoneNumber } = userData;
            return new Supplier({ email: supplierEmail, role, companyName, businessType, countryAddress, phoneNumber, ...userData });
        case 'WholeSeller':
            const { email: wholeSellerEmail, companyName: wsCompanyName, businessType: wsBusinessType, countryAddress: wsCountryAddress, contactPersonName, phoneNumber: wsPhoneNumber } = userData;
            return new Whole({ email: wholeSellerEmail, role, companyName: wsCompanyName, businessType: wsBusinessType, countryAddress: wsCountryAddress, contactPersonName, phoneNumber: wsPhoneNumber, ...userData });
        case 'Factory':
            const { email: factoryEmail, companyName: fCompanyName, industryType, countryAddress: fCountryAddress, contactPersonName: fContactPersonName, phoneNumber: fPhoneNumber, taxID } = userData;
            return new Factory({ email: factoryEmail, role, companyName: fCompanyName, industryType, countryAddress: fCountryAddress, contactPersonName: fContactPersonName, phoneNumber: fPhoneNumber, taxID, ...userData });
        default:
            return null;
    }
}

function generateSixDigitNumber() {
    const number = Math.floor(Math.random() * 1000000);
    return number.toString().padStart(6, '0');
}

export const sendEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        auth: {
            user: process.env.Node_Mailer_Email,
            pass: process.env.Node_Mailer_Pass
        }
    });
    await transporter.sendMail({
        from: process.env.Node_Mailer_Email,
        to: email,
        subject: 'Eshop Verification OTP',
        text: `Your OTP is: ${otp}`,
        html: `<b>Your OTP is: ${otp}</b>`
    });
};

export const login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ error: "missing fields!" });
        }

        let user;
        switch (role) {
            case 'Supplier':
                user = await Supplier.findByUsername(email);
                break;
            case 'WholeSeller':
                user = await Whole.findByUsername(email);
                break;
            case 'Factory':
                user = await Factory.findByUsername(email);
                break;
            case 'User':
                user = await User.findByUsername(email);
                break;
            default:
                return res.status(400).json({ error: "Invalid role" });
        }

        if (!user) {
            return res.status(404).json({ error: "Not found in database" });
        }

        const isValidPassword = await user.authenticate(password);
        if (!isValidPassword.user) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // if (user.loggedIn) {
        //     return res.status(429).json({ error: "User already logged in" });
        // } else {
        user.loggedIn = true;
        await user.save();
        // }

        const tokenExpiryTime = '30d'; // 1 month
        const token = generateToken(user, tokenExpiryTime);
        res.status(200).json({
            token, data: {
                _id: user._id,
                // username: user.username,
                email: user.email,
                role: user.role,
            }, success: true, message: "User logged In successfully!",
        });
        console.log("login api ended")
    } catch (err) {
        next(err)
    }
}

export const changePassword = async (req, res, next) => {
    try {
        const user = await findUserByIdInModels(req.user._id)
        if (!user) {
            return res.status(404).json({ error: "user not found!" });
        } else {
            await user.changePassword(req.body.oldPassword, req.body.newPassword);
        }
        res.status(200).json({ success: true, message: "Password change successfully!", });
    } catch (err) {
        next(err);
    }
};

export const forgetPassword = async (req, res, next) => {
    try {
        const user = await checkExisting(req.body.email);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        const otp = generateSixDigitNumber();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        const tempUser = new otpModel({
            email: req.body.email,
            otp,
            otpExpires
        });

        await tempUser.save();
        await sendEmail(req.body.email, otp);

        res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (err) {
        next(err);
    }
};

export const verifyOTPAndResetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const tempUser = await otpModel.findOne({ email, otp });
        if (!tempUser || tempUser.otpExpires < new Date()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }
        const user = await checkExisting(email);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }
        await user.setPassword(newPassword);
        await user.save();
        await otpModel.deleteOne({ email, otp });
        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (err) {
        next(err);
    }
};

async function checkExisting(email) {
    if (!email) {
        throw new Error("Email is required");
    }

    let user = await User.findOne({ email });
    if (user) return user;

    user = await Supplier.findOne({ email });
    if (user) return user;

    user = await Whole.findOne({ email });
    if (user) return user;

    user = await Factory.findOne({ email });
    if (user) return user;

    return null;
}

//only for user
export const updateUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const { username, email, country, address, city, postalCode } = req.body;
        const avatar = req.file;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        if (username !== undefined || email !== undefined) {
            user.username = username || user.username;
            user.email = email || user.email;
        }

        if (country || address || city || postalCode) {
            user.shippingAddress = {
                country: country || user.shippingAddress.country,
                address: address || user.shippingAddress.address,
                city: city || user.shippingAddress.city,
                postalCode: postalCode || user.shippingAddress.postalCode
            };
        }
        if (avatar) {
            user.avatar = avatar.buffer;
        }
        await user.save();
        res.status(200).json({ success: true, message: "User updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "An error occurred while updating the user." });
    }
};

export const addToWishlist = async (req, res) => {
    const userId = req.user._id;
    const productId = req.body.productId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
            res.status(201).json({ message: 'Product added to wishlist successfully' });
        } else {
            res.status(400).json({ message: 'Product is already in the wishlist' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeFromWishlist = async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.productId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.wishlist.includes(productId)) {
            return res.status(404).json({ message: 'Product not found in the wishlist' });
        }

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateShippingAddress = async (req, res) => {
    const userId = req.user._id;
    const { country, address, city, postalCode, phoneNo, email } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Order not found for this user' });
        }

        if (country) user.shippingAddress.country = country;
        if (address) user.shippingAddress.address = address;
        if (city) user.shippingAddress.city = city;
        if (postalCode) user.shippingAddress.postalCode = postalCode;
        if (phoneNo) user.shippingAddress.contactInfo.phoneNo = phoneNo;
        if (email) user.shippingAddress.contactInfo.email = email;
        await user.save();

        res.status(200).json({ message: 'Shipping address updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const logout = async (req, res) => {
    try {
        const user = await findUserByIdInModels(req.user._id)
        if (!user) {
            return res.status(404).json({ error: "user not found!" });
        }
        user.logoutAt = new Date();
        user.loggedIn = false;
        await user.save();
        res.status(200).json({ message: 'user logout successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        let user;
        switch (req.user.role) {
            case 'Supplier':
                user = await Supplier.findById(req.params.id);
                break;
            case 'WholeSeller':
                user = await Whole.findById(req.params.id);
                break;
            case 'Factory':
                user = await Factory.findById(req.params.id);
                break;
            case 'User':
                user = await User.findById(req.params.id);
                break;
            default:
                return res.status(400).json({ error: "Invalid role" });
        }
        if (!user) {
            return res.status(404).json({ error: "Not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserStats = async (req, res) => {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const [
            userCount,
            supplierCount,
            wholesellerCount,
            factoryCount,
            oneDayUserCount
        ] = await Promise.all([
            User.countDocuments(),
            Supplier.countDocuments(),
            Whole.countDocuments(),
            Factory.countDocuments(),
            User.countDocuments({ createdAt: { $gte: oneDayAgo } })
        ]);

        const totalCount = userCount + supplierCount + wholesellerCount + factoryCount;

        const stats = {
            userCount,
            supplierCount,
            wholesellerCount,
            factoryCount,
            oneDayUserCount,
            totalCount
        };
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
}
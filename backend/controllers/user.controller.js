import User from "../model/user.model.js";
import Product from "../model/product.model.js";
import Supplier from "../model/supplier.model.js";
import Whole from "../model/wholeseller.model.js";
import Factory from "../model/factory.model.js";
import { generateToken } from "../auth/auth.js";
import { findUserByIdInModels } from "../common/common.js";

export const register = async (req, res, next) => {
    try {
        const { username, email, password, confirmPassword, role, ...userData } = req.body;

        if (password && confirmPassword) {
            if (password !== confirmPassword) {
                return res.status(400).json({ error: "Passwords do not match" });
            }
        }

        let newUser;

        switch (role) {
            case 'Supplier':
                newUser = new Supplier({ email, role, ...userData });
                break;
            case 'WholeSeller':
                newUser = new Whole({ email, role, ...userData });
                break;
            case 'Factory':
                newUser = new Factory({ email, role, ...userData });
                break;
            case 'User':
                newUser = new User({ username, email, password });
                break;
            default:
                return res.status(400).json({ error: "Invalid role" });
        }
        await newUser.setPassword(password);
        const savedUser = await newUser.save();
        res.status(201).json({ success: true, message: "User has been registered!", data: savedUser });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
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

        if (user.loggedIn) {
            return res.status(429).json({ error: "User already logged in" });
        } else {
            user.loggedIn = true;
            await user.save();
        }

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
        const user = await findUserByIdInModels(req.user._id)
        if (!user) {
            return res.status(404).json({ error: "user not found!" });
        } else {
            //after verify otp
            await user.setPassword(req.body.password, () => {
                user.save();
            });
        }
    } catch (err) {
        next(err)
    }
};

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
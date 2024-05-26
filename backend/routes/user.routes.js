import multer from 'multer';
import { errorMiddleware } from "../common/common.js";
import { userValMiddleware } from "../middleware/user.middleware.js";
import * as userController from '../controllers/user.controller.js';
import { verifyAdmin, verifyUser } from "../auth/auth.js";
const storage = multer.memoryStorage();
const imageUpload = multer({ storage });

const resource = '/user'
export const defineRoutes = (app, baseurl) => {
    app.post(
        `${baseurl}${resource}/register`,
        // userValMiddleware.validateSignupParams,
        errorMiddleware,
        userController.register
    );
    app.post(
        `${baseurl}${resource}/login`,
        userValMiddleware.valdiateLoginParams,
        errorMiddleware,
        userController.login
    );
    app.patch(
        `${baseurl}${resource}/changePassword`,
        userValMiddleware.validateChangePasswordParams,
        errorMiddleware,
        verifyUser,
        userController.changePassword
    );
    app.post(
        `${baseurl}${resource}/forgetPassword`,
        userValMiddleware.validateForgetPasswordParams,
        errorMiddleware,
        userController.forgetPassword
    );
    app.get(
        `${baseurl}${resource}/stats`,
        errorMiddleware,
        verifyAdmin,
        userController.getUserStats
    );
    app.post(
        `${baseurl}${resource}/wishlist`,
        // userValMiddleware.validateAddToWishlistParams,
        errorMiddleware,
        verifyUser,
        userController.addToWishlist
    )
    app.delete(
        `${baseurl}${resource}/wishlist/:productId`,
        errorMiddleware,
        userController.removeFromWishlist
    );
    app.get(
        `${baseurl}${resource}/:id`,
        errorMiddleware,
        verifyUser,
        userController.getUser
    );
    app.patch(
        `${baseurl}${resource}/edit`,
        verifyUser,
        imageUpload.single('avatar'),
        userController.updateUser
    );
    app.put(
        `${baseurl}${resource}/shipping-address`,
        verifyUser,
        errorMiddleware,
        userController.updateShippingAddress
    );
    app.get(
        `${baseurl}${resource}/logout`,
        verifyUser,
        errorMiddleware,
        userController.logout
    );
};
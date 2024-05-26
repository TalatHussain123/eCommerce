import multer from 'multer';
import { errorMiddleware } from "../common/common.js";
import * as sellerController from '../controllers/seller.controller.js';
import { checkPermissions, verifyUser } from "../auth/auth.js";
const storage = multer.memoryStorage();
const imageUpload = multer({ storage });

const resource = '/user/seller'
export const defineRoutes = (app, baseurl) => {
    app.patch(
        `${baseurl}${resource}/edit`,
        errorMiddleware,
        verifyUser,
        checkPermissions(['WholeSeller']),
        imageUpload.single('avatar'),
        sellerController.updateSeller
    );
}
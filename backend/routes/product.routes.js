import { errorMiddleware } from "../common/common.js";
import * as productController from '../controllers/product.controller.js';
import { verifyUser, checkPermissions } from "../auth/auth.js";

const resource = '/user/product'
export const defineRoutes = (app, baseurl) => {
    app.post(
        `${baseurl}${resource}/add`,
        errorMiddleware,
        verifyUser,
        checkPermissions(['Supplier', 'Factory', 'WholeSeller']),
        productController.addProduct
    );
    app.put(
        `${baseurl}${resource}/update/:id`,
        errorMiddleware,
        verifyUser,
        checkPermissions(['Supplier', 'Factory', 'WholeSeller']),
        productController.updateProduct
    );
    app.delete(
        `${baseurl}${resource}/delete/:id`,
        errorMiddleware,
        verifyUser,
        checkPermissions(['Supplier', 'Factory', 'WholeSeller']),
        productController.deleteProduct
    );
    app.get(
        `${baseurl}${resource}/find/:id`,
        errorMiddleware,
        verifyUser,
        productController.getProduct
    );
    app.get(
        `${baseurl}${resource}/`,
        errorMiddleware,
        verifyUser,
        productController.getAllProduct
    );
    app.delete(
        `${baseurl}${resource}/remove-history`,
        errorMiddleware,
        verifyUser,
        productController.removeFromSearchHistory
    );
    app.get(
        `${baseurl}${resource}/filter`,
        errorMiddleware,
        verifyUser,
        productController.filterProducts
    );
};
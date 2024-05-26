import { errorMiddleware } from "../common/common.js";
import * as cartController from '../controllers/cart.controller.js';
import { ordercheckPermissions, verifyAdmin, verifyUser } from "../auth/auth.js";

const resource = '/user/cart';
const resources = '/user/carts'
export const defineRoutes = (app, baseurl) => {
    app.post(
        `${baseurl}${resource}/`,
        errorMiddleware,
        verifyUser,
        ordercheckPermissions(['Supplier', 'Factory', 'User']),
        cartController.addToCart
    );
    app.put(
        `${baseurl}${resource}/:id`,
        errorMiddleware,
        verifyUser,
        ordercheckPermissions(['Supplier', 'Factory', 'User']),
        cartController.updateCart
    );
    app.delete(
        `${baseurl}${resource}/:id`,//roleid
        errorMiddleware,
        verifyUser,
        ordercheckPermissions(['Supplier', 'Factory', 'User']),
        cartController.deleteAllCarts
    );
    app.delete(
        `${baseurl}${resources}/:pid`,//productid
        errorMiddleware,
        verifyUser,
        ordercheckPermissions(['Supplier', 'Factory', 'User']),
        cartController.deleteProductFromCart
    );
    app.get(
        `${baseurl}${resource}/`,
        errorMiddleware,
        verifyAdmin,
        cartController.getProduct
    );
}
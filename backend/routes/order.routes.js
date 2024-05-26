import { errorMiddleware } from "../common/common.js";
import * as orderController from '../controllers/order.controller.js';
import { ordercheckPermissions, verifyAdmin, verifyUser } from "../auth/auth.js";

const resource = '/user/order'
const resources = '/user/orders'
export const defineRoutes = (app, baseurl) => {
    app.get(
        `${baseurl}${resources}/topproduct`,
        errorMiddleware,
        verifyUser,
        orderController.topOrderProduct
    );
    app.get(
        `${baseurl}${resources}/getMonthlyRevenue`,
        errorMiddleware,
        // verifyAdmin,
        orderController.getMonthlyRevenue
    );
    app.post(
        `${baseurl}${resource}`,
        errorMiddleware,
        verifyUser,
        ordercheckPermissions(['Supplier', 'Factory', 'User']),
        orderController.createOrder
    );
    app.delete(
        `${baseurl}${resource}/:id`,
        errorMiddleware,
        verifyAdmin,
        orderController.deleteOrder
    );
    app.get(
        `${baseurl}${resource}`,
        errorMiddleware,
        verifyAdmin,
        orderController.getAllOrders
    );
    app.get(
        `${baseurl}${resources}/:orderId`,
        errorMiddleware,
        verifyUser,
        orderController.orderDetails
    );
    app.put(
        `${baseurl}${resource}/status/:id`,
        errorMiddleware,
        verifyUser,
        orderController.updateOrderStatus
    );
    // app.put(
    //     `${baseurl}${resource}/:id`,
    //     errorMiddleware,
    //     verifyUser,
    //     // verifyAdmin,
    //     ordercheckPermissions(['Supplier', 'Factory', 'User']),
    //     orderController.updateOrder
    // );
    // app.get(
    //     `${baseurl}${resource}/find`,
    //     errorMiddleware,
    //     verifyAdmin,
    //     // ordercheckPermissions(['Supplier', 'Factory', 'User']),
    //     orderController.getOrders
    // );
}
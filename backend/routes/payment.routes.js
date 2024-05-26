import { errorMiddleware } from "../common/common.js";
import * as paymentController from '../controllers/payment.controller.js';
import { verifyUser } from "../auth/auth.js";

const resource = '/user/cart'
export const defineRoutes = (app, baseurl) => {
    app.post(
        `${baseurl}${resource}/create-payment`,
        errorMiddleware,
        verifyUser,
        paymentController.payment
    );
}
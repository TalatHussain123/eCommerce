import { validationResult } from 'express-validator';
import userModel from '../model/user.model.js';
import wholesellerModel from '../model/wholeseller.model.js';
import supplierModel from '../model/supplier.model.js';
import factoryModel from '../model/factory.model.js';

const errorFormatter = ({ msg }) => msg;
export const errorMiddleware = (req, res, next) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        const err = errors.mapped();
        return next({ name: 'ValidationError', errors: err, status: 400 });
    }
    return next();
};


export const passwordValidator = (password) => {
    return new RegExp('^.{6,16}$').test(password);
};

export const findUserByIdInModels = async (userId) => {
    let user = await userModel.findById(userId).exec();
    if (!user) user = await wholesellerModel.findById(userId).exec();
    if (!user) user = await supplierModel.findById(userId).exec();
    if (!user) user = await factoryModel.findById(userId).exec();
    return user;
};
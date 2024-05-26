import { check } from 'express-validator';
import { passwordValidator } from '../common/common.js';

export const userValMiddleware = {
    validateSignupParams: [
        check('username', 'USERNAME_UNAVAILABLE').exists(),
        check('email', 'EMAIL_UNAVAILABLE').exists(),
        check('password', 'PASSWORD_REQUIRED').exists(),
        check('password', 'INVALID_PASSWORD').custom(passwordValidator),
    ],
    valdiateLoginParams: [
        check('email', 'EMAIL_UNAVAILABLE').exists(),
        check('password', 'PASSWORD_REQUIRED').exists(),
    ],
    validateChangePasswordParams: [
        check('oldPassword', 'OLD_PASSWORD_REQUIRED').exists(),
        check('newPassword', 'NEW_PASSWORD_REQUIRED').exists()
    ],
    validateForgetPasswordParams: [
        check('email', 'EMAIL_NOT_VALID').exists(),
    ],
}
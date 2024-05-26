import passport from 'passport';
import passportJwt from 'passport-jwt';
import JWT from 'jsonwebtoken';
import User from '../model/user.model.js';
import dotenv from 'dotenv';
import wholesellerModel from '../model/wholeseller.model.js';
import supplierModel from '../model/supplier.model.js';
import factoryModel from '../model/factory.model.js';
dotenv.config();

const jwtStrategy = passportJwt.Strategy;
const extractToken = passportJwt.ExtractJwt;

passport.use('local-user', User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// options for setting the JWT Tokens
const opts = {};
opts.jwtFromRequest = extractToken.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.secretKey

const sendErrorResponse = (res, msgCode, status, message) => {
    return res.status(status).json({
        msgCode,
        status,
        message,
    });
};

passport.use(
    'jwt-user',
    new jwtStrategy(opts, async (jwtPayload, done) => {
        try {
            let user;

            user = await User.findById(jwtPayload._id).exec();
            if (!user) {
                user = await wholesellerModel.findById(jwtPayload._id).exec();
            }
            if (!user) {
                user = await supplierModel.findById(jwtPayload._id).exec();
            }
            if (!user) {
                user = await factoryModel.findById(jwtPayload._id).exec();
            }

            if (user) {
                return done(null, user, jwtPayload);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err, false);
        }
    }));

export const generateToken = (user, tokenExpiryTime = null) =>
    JWT.sign(
        {
            _id: user._id,
            role: user.role,
            isAdmin: user.isAdmin,
            username: user.username || '',
        },
        process.env.secretKey,
        { expiresIn: tokenExpiryTime }
    );

export const verifyUser = (req, res, next) => {
    passport.authenticate('jwt-user', async (err, user) => {
        try {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(403).json({
                    msgCode: 'UNAUTHORIZED',
                    status: 403,
                    message: 'Authentication failed: User is Unauthorized!',
                });
            }

            req.user = user;
            return next();
        } catch (error) {
            next(error);
        }
    })(req, res, next);
};


export const verifyAdmin = (req, res, next) => {
    passport.authenticate('jwt-user', (err, user) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return sendErrorResponse(res, 'UNAUTHORIZED', 403, 'Authentication failed: User is Unauthorized!');
        }

        if (user.isAdmin) {
            return next();
        } else {
            return sendErrorResponse(res, 'FORBIDDEN', 403, 'Access denied: only admins have permission to access this resource.');
        }
    })(req, res, next);
};

export const authenticateUser = (req, res, next) => {
    passport.authenticate('local-user', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return sendErrorResponse(res, 'USER_LOGIN_FAILED', 401, 'User authentication failed!');
        }
        return next();
    })(req, res, next);
};

export const checkPermissions = (allowedRoles = []) => (req, res, next) => {
    if (req.user.role === 'User' && req.user.isAdmin === true) {
        return next()
    }
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    if (!allowedRoles.some(role => userRoles.includes(role))) {
        return res.status(403).json({ msgCode: 'PERMISSION_DENIED', status: 403 });
    }
    next();
};


export const ordercheckPermissions = (roles = []) => (req, res, next) => {
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    if (!roles.some(role => userRoles.includes(role))) {
        return res.status(403).json({ msgCode: 'PERMISSION_DENIED', status: 403 });
    }
    next();
};


import type { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../utils/appError.js";

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN as NonNullable<
      SignOptions["expiresIn"]
    >,
  });
};

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token: string | undefined = undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access", 401),
      );
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if(!currentUser) {
      return next(new AppError('The user belonging to this token does not longer exists.', 401))
    }

    // 4) Check if user changed password after the JWT was issued
    if (currentUser.changePasswordAfter(decoded.iat!)) {
      return next(new AppError('User recently changed password! Please log in again.', 401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;

    next();
  },
);

export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const token = signToken(newUser.id);

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    const isPasswordCorrect = await user?.correctPassword(
      password,
      user?.password ?? "",
    );

    if (!user || !isPasswordCorrect) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // 3) If everything is ok, send token to client
    const token = signToken(user.id);

    res.status(200).json({
      status: "success",
      token,
    });
  },
);

import { User } from "../models/userModel.js";
import type { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

export const createUser = (req: Request, res: Response) => {};

export const getUser = (req: Request, res: Response) => {
  res.status();
};

export const updateUser = (req: Request, res: Response) => {};

export const deleteUser = (req: Request, res: Response) => {};

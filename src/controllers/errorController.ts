import type { ErrorRequestHandler, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/appError.js";

const sendErrorDev = (error: unknown, res: Response) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const status = error instanceof AppError ? error.status : "error";
  const message = error instanceof Error ? error.message : "Something went wrong";
  const stack = error instanceof Error ? error.stack : undefined;

  res.status(statusCode).json({
    status,
    message,
    error,
    stack,
  });
};

const sendErrorProd = (error: unknown, res: Response) => {
  // Operational, trusted error: send message to client
  if (error instanceof AppError && error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });

    // Programming or other unknown error: don't leak details
  } else {
    // 1) Log error
    console.error('ERROR 🧨', error);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    })
  }
};

const handleCastErrorDB = (err: mongoose.Error.CastError) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const isDuplicateKeyError = (err: unknown): err is mongoose.mongo.MongoServerError =>
  err instanceof mongoose.mongo.MongoServerError && err.code === 11000;

const handleDuplicateFieldsDB = (err: mongoose.mongo.MongoServerError) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)?.[0] ?? "unknown";
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
}

const handleValidationErrorDB = (err: mongoose.Error.ValidationError) => {
  const errors = Object.values(err.errors).map(element => element.message);
  const message = `Invalid input data. ${errors.join('. ')}`;

  return new AppError(message, 400);
}

export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res,
  next,
) => {
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error: unknown = err;

    if (err instanceof mongoose.Error.CastError) error = handleCastErrorDB(err);
    else if (isDuplicateKeyError(err)) error = handleDuplicateFieldsDB(err);
    else if (err instanceof mongoose.Error.ValidationError) error = handleValidationErrorDB(err);

    sendErrorProd(error, res);
  }
};

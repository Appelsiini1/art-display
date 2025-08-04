import { Schema } from "express-validator";

export const displayFileSchema: Schema = {
  artist: {
    isString: true,
    optional: false,
    notEmpty: true,
    trim: true,
    in: ["body"],
  },
  file: {
    isString: true,
    optional: false,
    notEmpty: true,
    trim: true,
    in: ["body"],
  },
  path: {
    isString: true,
    optional: false,
    notEmpty: true,
    trim: true,
    in: ["body"],
  },
  type: {
    isString: true,
    optional: false,
    notEmpty: true,
    trim: true,
    in: ["body"],
  },
  rating: {
    isString: true,
    optional: false,
    notEmpty: true,
    trim: true,
    in: ["body"],
  },
};

export const displayFileSchemaUpdate: Schema = {
  ...displayFileSchema,
  id: {
    optional: false,
    notEmpty: true,
    trim: true,
    in: ["body"],
    isInt: true,
  },
};

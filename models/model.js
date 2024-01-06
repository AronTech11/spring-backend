import mongoose from "mongoose";
import { model, Schema, ObjectId } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    trim: true,
    require: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
    default: "",
  },
  email: {
    type: String,
    trim: true,
    require: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    require: true,
    maxLength: 256,
  },
  address: {
    type: String,
    default: "",
  },
  company: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  photo: {},
  role: {
    type:[String],
    default:["Buyers"],
    enums:["Buyers", "Sellers", "Admin"],
  },
  enquiredProperties:[{type:ObjectId, ref:"Ad"}],
  wishlists:[{type:ObjectId, ref:"Ad"}],
  resetCode:"",
});

export default model("User", userSchema);

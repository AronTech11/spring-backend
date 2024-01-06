import * as config from "../config.js";
import jwt from "jsonwebtoken";
import { emailTemplate } from "../helpers/email.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import {nanoid} from "nanoid"
import User from "../models/model.js"
import validator from "email-validator"

export const welcome = (req, res) => {
  res.json({
    data: "Hello Nodejs data",
  });
};
//Sending email for registration
export const preRegister = async (req, res) => {
    //create jwt with email and password, and send a link to email and complete the registration
    try {
      const { email, password } = req.body;

      //validation
      if(!validator.validate(email)){
        return res.json({error: "A valid email is required"})
      }
      if (!password) {
        return res.json({ error: "A password is required" });
      }
      
      if (password.length < 6) {
        return res.json({ error: "Password should be minimum 6 characters" });
      }      

      const user = await User.findOne({email})
      if(user){
        return res.json({error: "The email is already being used"})
      }
      const token = jwt.sign({ email, password }, config.JWT_SECRET, {
        expiresIn: "1h",
      });
      config.AWS_SES.sendEmail(
        emailTemplate(
          email,
          `
               <p>Please click the link below to activate your account</p>
               <a href="${config.CLIENT_URL}/auth/account-activate/${token}">Activate my account</a>
          `,
          config.REPLY_TO,
          "Activate your account"
        ),
        (error, data) => {
          if (error) {
            console.log(error);
            return res.json({ ok: false });
          } else {
            console.log(data);
  
            return res.json({ ok: true });
          }
        }
      );
    } catch (error) {
      console.log(error);
      return res.json({
        data: "Something went wrong",
      });
    }
  };

  //Token and User Response
export const tokenAndUserResponse = (req,res,user) =>{
    const token = jwt.sign({_id : user._id}, config.JWT_SECRET,{expiresIn: "1h"})
    const refreshToken = jwt.sign({_id : user._id}, config.JWT_SECRET,{expiresIn: "1w"})

    //to avoid sending the password
    user.password = undefined
    user.resetCode = undefined

    return res.json({
        token,
        refreshToken,
        user,
       
    })
}   
//Register with the link
export const register = async (req, res) => {
    try {
      const { email, password } = jwt.verify(req.body.token, config.JWT_SECRET);
      const hashedPassword = await hashPassword(password);
  
      // Check if the email already exists in the database
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
  
      // If the email doesn't exist, create a new user
      const user = await new User({
        username: nanoid(6),
        email,
        password: hashedPassword,
      }).save();
  
      console.log(user, "user");

      tokenAndUserResponse(req, res, user);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Something went wrong with the registration",
      });
    }
  };
//Login 
  export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      // 1 find user by email
      const user = await User.findOne({ email });
      // 2 compare password
      const match = await comparePassword(password, user.password);
      if (!match) {
        return res.json({ error: "Wrong password" });
      }
      // 3 create jwt tokens
      tokenAndUserResponse(req, res, user);
      
    } catch (err) {
      console.log(err);
      return res.json({ error: "Something went wrong. Try again." });
    }
  };
  //Forgot password
  export const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ error: "Could not find user with that email" });
      } else {
        const resetCode = nanoid();
        //geting and saving the user in database to reset
        user.resetCode = resetCode;
        user.save();
        //checking erpiry of token and ask user to send again
        const token = jwt.sign({ resetCode }, config.JWT_SECRET, {
          expiresIn: "1h",
        });
  
        config.AWS_SES.sendEmail(
          emailTemplate(
            email,
            `
            <p>Please click the link below to access your account.</p>
            <a href="${config.CLIENT_URL}/auth/access-account/${token}">Access my account</a>
          `,
            config.REPLY_TO,
            "Access your account"
          ),
          (err, data) => {
            if (err) {
              console.log(err);
              return res.json({ ok: false });
            } else {
              console.log(data);
              return res.json({ ok: true });
            }
          }
        );
      }
    } catch (err) {
      console.log(err);
      return res.json({ error: "Something went wrong. Try again." });
    }
  };
  
  export const accessAccount = async (req, res) => {
    try {
      const { resetCode } = req.body;
  
      // Verify the resetCode token
      const decodedToken = jwt.verify(resetCode, config.JWT_SECRET);
      const { resetCode: decodedResetCode } = decodedToken;
  
      if (!decodedResetCode) {
        return res.json({ error: "Invalid or missing resetCode" });
      }
  
      // Find user by resetCode
      const user = await User.findOne({ resetCode: decodedResetCode });
  
      if (!user) {
        return res.json({ error: "User not found for the resetCode" });
      }
  
      // Clear the resetCode in the user document
      user.resetCode = "";
      await user.save();
  
      // Sign new tokens for the user
      tokenAndUserResponse(req, res, user);
    
    } catch (err) {
      console.log(err);
      return res.json({ error: "Something went wrong. Try again." });
    }
  };
  
  export const refreshToken = async (req, res) => {
    try {
      const { _id } = jwt.verify(req.headers.refresh_token, config.JWT_SECRET);
  
      const user = await User.findById(_id);
  
      tokenAndUserResponse(req, res, user);
    } catch (err) {
      console.log(err);
      return res.status(403).json({ error: "Refresh token failed" });
    }
  };
  
  export const currentUser = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.password = undefined;
      user.resetCode = undefined;
      res.json(user);
    } catch (err) {
      console.log(err);
      return res.status(403).json({ error: "Unauhorized" });
    }
  };
  
  export const publicProfile = async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      user.password = undefined;
      user.resetCode = undefined;
      res.json(user);
    } catch (err) {
      console.log(err);
      return res.json({ error: "User not found" });
    }
  };

  export const updatePassword = async (req, res) => {
    try {
      const { password } = req.body;
  
      if (!password) {
        return res.json({ error: "A password is required" });
      }
      
      if (password.length < 6) {
        return res.json({ error: "Password should be minimum 6 characters" });
      } 
  
      const user = await User.findByIdAndUpdate(req.user._id, {
        password: await hashPassword(password),
      });

      console.log(user,"user")
  
      res.json({ ok: true });
    } catch (err) {
      console.log(err);
      return res.status(403).json({ error: "Unauhorized" });
    }
  };
  
  export const updateProfile = async (req, res) => {
    try {
      const { username, email } = req.body;
  
      // Check if the requested username or email already exists
      const existingUsername = await User.findOne({ username });
      const existingEmail = await User.findOne({ email });
  
      // If the username or email is already taken by another user, return an error
      if (existingUsername && existingUsername._id.toString() !== req.user._id.toString()) {
        return res.json({ error: 'Username is already taken' });
      }
  
      if (existingEmail && existingEmail._id.toString() !== req.user._id.toString()) {
        return res.json({ error: 'Email is already taken' });
      }
  
      // Update the user's profile
      const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
      user.password = undefined;
      user.resetCode = undefined;
      res.json(user);
    } catch (err) {
      console.log(err);
      return res.status(403).json({ error: 'Unauthorized' });
    }
  };
  


//   export const updateProfile = async (req, res) => {
//     try {
//       const user = await User.findByIdAndUpdate(req.user._id, req.body, {
//         new: true,
//       });
//       user.password = undefined;
//       user.resetCode = undefined;
//       res.json(user);
//     } catch (err) {
//       console.log(err);
//       if (err.codeName === "DuplicateKey") {
//         return res.json({ error: "Username or email is already taken" });
//       } else {
//         return res.status(403).json({ error: "Unauhorized" });
//       }
//     }
//   };
  
  

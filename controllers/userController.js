import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { DateTime } from "luxon";
import "dotenv/config";
import UserModel from "../models/user.js";
import PostModel from "../models/post.js";

// Passport Local Strategy for username and password login
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await UserModel.findOne({ email: email });
      if (!user) {
        // If user is not found, return false
        return done(null, false, { message: "Incorrect email" });
      };
      
      // Use bcrypt to compare submitted password with the hashed password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // If passwords do not match, return false
        return done(null, false, { message: "Incorrect password" });
      }

      // If all is well, return the user object
      return done(null, user);
    } catch(err) {
      return done(err);
    };
  })
);

// Passport Serialize User
passport.serializeUser((user, done) => {
  done(null, user.id); // Save user id to the session
});

// Passport Deserialize User
passport.deserializeUser(async (id, done) => {
  try {
    // Retrieve the user by id from the database
    const user = await UserModel.findById(id);
    done(null, user); // Attach the user to the request object
  } catch(err) {
    done(err);
  };
});

// Configure Nodemailer to use Elastic Email's SMTP
const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.EMAILPORT,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
});

// Verification Code Generator
function generateRandomVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

export const index = asyncHandler(async (req, res, next) => {
  try {
    const messages = await PostModel.find().populate('user', 'name isMember').exec();

    // Format the date for each message using Luxon
    const formattedMessages = messages.map(message => ({
      ...message.toObject(),
      formattedDate: DateTime.fromJSDate(message.createdAt).toLocaleString(DateTime.DATE_MED) // Example format
    }));

    res.render("index", {
      title: "Home",
      user: req.user, 
      messages: formattedMessages,
    });
  } catch(err) {
    return next(err);
  }
});

export const user_signup_post = [
  body("name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Name must be specified."),
  body("email")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Email must be specified."),
  body("password")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Password must be specified."),

  asyncHandler(async (req, res, next)  => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("index", {
        title: "MembersOnly",
        errors: errors.array(),
        formData: req.body,
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const verificationCode = generateRandomVerificationCode();

      const user = new UserModel({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
      });
      
      await user.save();

      // Define the email content for Nodemailer
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: user.email,
        subject: "Email Verification",
        text: `Your verification code is ${verificationCode}`,
        html: `<p>Your verification code is <b>${verificationCode}</b></p>`
      };

      // Send the email 
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Verification email sent:", info.response);
        }
      });

      res.redirect("/verification");
    } catch(err) {
      return next(err);
    };
  }), 
];


export const join_club_get = (req, res) => {
  res.render("membership", { title: "Join the Club", user: req.user });
}

export const join_club_post = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).send("User not authenticated");
  }

  if (req.body.passcode === process.env.SECRET_PASSCODE) {
    try {
      await UserModel.findByIdAndUpdate(req.user._id, { isMember: true });
      res.redirect("/");
    } catch(err) {
      return next(err);
    }
  } else {
    res.render("membership", { title: "Join the club", user: req.user, error: "Incorrect passcode." });
  }
});

export const user_logout_get = (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect("/");
  });
};

export const user_login_post = passport.authenticate('local', {
  successRedirect: "/",
  failureRedirect: "/",
});

export const user_message_get = (req, res) => {
  res.render("messageform", { title: "Post a Message", user: req.user });
};

export const user_message_post = [
  body("title")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Title must be specified."),
  body("message")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Message must be specified."),
  
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).send("User not authenticated");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("messageform", {
        title: "Post a Message",
        user: req.user,
        errors: errors.array(),
        post: req.body,
      });
    }

    const post = new PostModel({
      title: req.body.title,
      message: req.body.message,
      user: req.user._id,
    });

    try {
      await post.save();
      res.redirect("/");
    } catch(err) {
      return next(err);
    } 
  }),
];

export const user_verification_get = (req, res, next) => {
  res.render("verification");
};

export const user_verification_post = asyncHandler(async (req, res, next) => {
  const { verificationemail, code } = req.body; // Notice the name 'verificationemail'

  try {
    const user = await UserModel.findOne({ email: verificationemail });
    if (!user) {
      // User not found
      return res.render("verification", { error: "User not found." });
    }

    if (req.body.code === user.verificationCode) {
      // Verification code matches
      await UserModel.findByIdAndUpdate(user._id, { isVerified: true });

      // Optional: Log the user in and redirect
      req.login(user, (err) => {
        if (err) return next(err);
        return res.redirect("/");
      });
    } else {
      // Verification code does not match
      res.render("verification", { error: "Incorrect verification code." });
    }
  } catch (err) {
    console.error(err);
    return next(err);
  }
});



  

  

import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
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

      const user = new UserModel({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });

      const savedUser = await user.save();

      req.login(savedUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/");
        });
    } catch(err) {
      return next(err);
    };
  }), 
];


export const join_club_get = (req, res) => {
  res.render("membership", { title: "Join the Club", user: req.user });
}

export const join_club_post = asyncHandler(async (req, res, next) => {
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
    const errors = validationResult(req);

    const post = new PostModel({
      title: req.body.title,
      message: req.body.message,
      user: req.user._id,
    });

    if (!errors.isEmpty()) {
      res.render("messageform", {
        title: "Post a Message",
        user: req.user,
        errors: errors.array(),
        post: post,
      });
      return;
    } else {
      await post.save();
      res.redirect("/");
    }
  }),
];

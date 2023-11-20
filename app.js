import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import mongoose from "mongoose";
import "dotenv/config";

// Imported Routes
import indexRouter from "./routes/index.js";

// Connect to MongoDB 
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error"));

const app = express();

// Helpers to set up the directory paths for views
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "pug"); // Set up Pug for templating

// Render static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware with a secret and MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || "cats", 
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions' // Optional, specify a collection name for session data
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // Optional, cookie will expire after 24 hours
}));

// Set up Passport middleware
app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Enable Passport persistent sessions
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

// Initialize Routes
app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;

// Start server on port 3000
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

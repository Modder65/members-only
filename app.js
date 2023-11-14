import express from "express";
import session from "express-session";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import mongoose from "mongoose";
import "dotenv/config";

// Imported Routes
import indexRouter from "./routes/index.js";

//Connect to MongoDB 
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const app = express();

// Helpers to set up the directory paths for views
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "pug"); // Set up Pug for templating


//Render static files
app.use(express.static(path.join(__dirname, 'public')));

//Set up session middleware with a secret and appropriate options
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Enable Passport persistent sessions
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

// Initialize Routes
app.use("/", indexRouter);

// Start server on port 3000
app.listen(3000, () => console.log("app listening on port 3000."));
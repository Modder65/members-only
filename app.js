import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname } from "path";
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
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // Optional, cookie will expire after 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

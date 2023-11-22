import express from "express";
import session from "express-session";
import redis from "redis";
import connectRedis from "connect-redis";
// Removed MongoStore import as it's not used here
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

// Create an instance of RedisStore
const RedisStore = connectRedis(session);

const redisClient = redis.createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redisClient.on('error', function(err) {
  console.error('Redis error: ' + err);
});

app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redisClient }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

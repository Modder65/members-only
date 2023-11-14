import express from "express";
import * as user_controller from "../controllers/userController.js"
import * as auth_controller from "../controllers/authController.js"
const router = express.Router();

router.get("/", user_controller.index);

router.post("/sign-up", user_controller.user_signup_post);

router.get("/join-club", auth_controller.isAuthenticated, user_controller.join_club_get);

router.post("/join-club", auth_controller.isAuthenticated, user_controller.join_club_post);

router.get("/logout", user_controller.user_logout_get);

router.post("/login", user_controller.user_login_post);

router.get("/message-form", user_controller.user_message_get);

router.post("/message-form", user_controller.user_message_post);

export default router;
// authRouter.js
import express from 'express';
import * as auth from '../controller/auth.js'; 
import { requireSignin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth.welcome);
router.post('/pre-register', auth.preRegister); // FOR CONFIRMATION EMAIL
router.post('/register', auth.register); // FOR registration EMAIL
router.post("/login", auth.login); // For Login
router.post("/forgot-password", auth.forgotPassword); // For forgot-password
router.post("/access-account", auth.accessAccount); // For access the account
router.get("/refresh-token", auth.refreshToken); // For refreshing the token
router.get("/current-user",requireSignin, auth.currentUser); // Forfetching current user
router.get("/profile/:username", auth.publicProfile); // Forfetching public user
router.put("/update-password",requireSignin, auth.updatePassword); // Upadte password user
router.put("/update-profile",requireSignin, auth.updateProfile); // Upadte profile user









export default router;

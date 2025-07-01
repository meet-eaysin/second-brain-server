import { Router } from 'express';
import crypto from 'crypto';
import {AuthenticatedRequest, requireAuth} from "../../../middlewares/auth";
import {User} from "../../users/models/users.model";
import {LinkedInService} from "../../linkedin/services/linkedin.services";

const router = Router();

// Auth0 callback handler
router.get('/callback', async (req: AuthenticatedRequest, res) => {
    try {
        if (req.oidc.isAuthenticated()) {
            const { sub, email, name, picture } = req.oidc.user!;

            // Create or update user
            const user = await User.findOneAndUpdate(
                { auth0Id: sub },
                {
                    auth0Id: sub,
                    email,
                    name,
                    picture,
                    lastLogin: new Date()
                },
                { upsert: true, new: true }
            );

            res.redirect('/dashboard');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Auth callback error:', error);
        res.redirect('/login?error=callback_failed');
    }
});

// LinkedIn connection
router.get('/linkedin/connect', requireAuth, (req: AuthenticatedRequest, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.linkedinState = state;

    const authUrl = LinkedInService.getAuthUrl(state);
    res.redirect(authUrl);
});

// LinkedIn callback
router.get('/linkedin/callback', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { code, state } = req.query;

        if (state !== req.session.linkedinState) {
            res.status(400).json({ error: 'Invalid state parameter' });
            return;
        }

        const tokenData = await LinkedInService.getAccessToken(code as string);
        const profile = await LinkedInService.getProfile(tokenData.access_token);

        // Update user with LinkedIn profile
        await User.findByIdAndUpdate(req.dbUser._id, {
            linkedinProfile: {
                id: profile.id,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
                profile: {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    profilePicture: profile.profilePicture,
                    headline: profile.headline,
                    industry: profile.industry,
                    location: profile.location
                }
            }
        });

        res.redirect('/dashboard?linkedin=connected');
    } catch (error) {
        console.error('LinkedIn callback error:', error);
        res.redirect('/dashboard?error=linkedin_failed');
    }
});

// Disconnect LinkedIn
router.post('/linkedin/disconnect', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        await User.findByIdAndUpdate(req.dbUser._id, {
            $unset: { linkedinProfile: 1 }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disconnect LinkedIn' });
    }
});

// Get user profile
router.get('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({
        user: req.dbUser,
        linkedinConnected: !!req.dbUser.linkedinProfile?.accessToken
    });
});

export default router;

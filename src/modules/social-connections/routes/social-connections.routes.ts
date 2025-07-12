import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import {
    disconnect,
    getConnectionStatus,
    getPosts,
    handleCallback,
    initiateAuth,
    syncPosts,
    commentOnPost,
    createPost,
    likePost,
    getProfile
} from "../controller/social-connections.controller";

const router = Router();

router.use(authenticateToken);

router.get('/auth/initiate/:platform', initiateAuth);
router.get('/auth/callback/:platform', handleCallback);
router.post('/disconnect/:platform', disconnect);
router.get('/connections', getConnectionStatus);
router.get('/connections/:platform', getConnectionStatus);

router.post('/sync/:platform', syncPosts);
router.get('/posts/:platform', getPosts);
router.post('/posts/:platform', createPost);
router.post('/posts/:platform/:postId/like', likePost);
router.post('/posts/:platform/:postId/comment', commentOnPost);

router.get('/profile/:platform', getProfile);

export default router;

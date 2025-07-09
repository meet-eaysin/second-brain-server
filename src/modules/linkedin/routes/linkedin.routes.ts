import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import {
    disconnect,
    getConnectionStatus, getPosts,
    handleCallback,
    initiateAuth,
    syncPosts,
    commentOnLinkedInPost, createLinkedInPost, likeLinkedInPost
} from "../controller/linkedin.controller";

const router = Router();

router.use(authenticateToken);

// Connection management
router.get('/auth/initiate', initiateAuth);
router.get('/auth/callback', handleCallback);
router.post('/disconnect', disconnect);
router.get('/connection', getConnectionStatus);

// Posts management
router.post('/sync', syncPosts);
router.get('/posts', getPosts);
router.post('/posts', createLinkedInPost);
router.post('/posts/:postId/like', likeLinkedInPost);
router.post('/posts/:postId/comment', commentOnLinkedInPost);

export default router;

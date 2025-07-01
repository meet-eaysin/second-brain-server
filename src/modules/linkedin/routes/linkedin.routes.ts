import { Router } from 'express';
import {Post} from "../models/linkedin-post.model";
import {AuthenticatedRequest, requireAuth, requireLinkedIn} from "../../../middlewares/auth";
import {LinkedInService} from "../services/linkedin.services";

const router = Router();

// Get user's timeline
router.get('/timeline', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const posts = await Post.find()
            .populate('userId', 'name picture')
            .populate('comments.userId', 'name picture')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});

// Create post
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { content, postToLinkedIn } = req.body;

        const post = new Post({
            userId: req.dbUser._id,
            content,
            isLinkedInPost: postToLinkedIn && !!req.dbUser.linkedinProfile?.accessToken
        });

        // Post to LinkedIn if requested and connected
        if (postToLinkedIn && req.dbUser.linkedinProfile?.accessToken) {
            try {
                const linkedinPostId = await LinkedInService.createPost(
                    req.dbUser.linkedinProfile.accessToken,
                    content,
                    req.dbUser.linkedinProfile.id
                );
                post.linkedinPostId = linkedinPostId;
            } catch (linkedinError) {
                console.error('LinkedIn post failed:', linkedinError);
                // Continue with local post even if LinkedIn fails
            }
        }

        await post.save();
        await post.populate('userId', 'name picture');

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Like post
router.post('/:postId/like', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        const userLiked = post.likes.includes(req.dbUser._id);

        if (userLiked) {
            post.likes = post.likes.filter(id => !id.equals(req.dbUser._id));
        } else {
            post.likes.push(req.dbUser._id);
        }

        await post.save();
        res.json({ liked: !userLiked, likesCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Add comment
router.post('/:postId/comment', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        const comment = {
            userId: req.dbUser._id,
            content,
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();
        await post.populate('comments.userId', 'name picture');

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get LinkedIn posts
router.get('/linkedin', requireAuth, requireLinkedIn, async (req: AuthenticatedRequest, res) => {
    try {
        const posts = await LinkedInService.getPosts(
            req.dbUser.linkedinProfile.accessToken,
            req.dbUser.linkedinProfile.id
        );

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch LinkedIn posts' });
    }
});

export default router;

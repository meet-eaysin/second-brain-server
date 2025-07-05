import {ILinkedInUser, LinkedInUser} from '../models/LinkedInUser';
import {ILinkedInPost, LinkedInPost} from '../models/LinkedInPost';
import {TLinkedInAuthRequest, TLinkedInPostCreate} from '../types/linkedin.types';
import {
    commentOnLinkedInPost,
    createLinkedInPost,
    exchangeLinkedInCodeForToken,
    generateLinkedInAuthUrl,
    getLinkedInEmail,
    getLinkedInFeed,
    getLinkedInProfile,
    likeLinkedInPost
} from "../../../utils/linkedin.utils";

export const initiateLinkedInAuth = async (userId: string, state?: string): Promise<{ authUrl: string }> => {
    const authUrl = generateLinkedInAuthUrl(state || userId);
    console.log("authUrl))))))))))))))))))))))))))))))))", authUrl)
    return { authUrl };
};

export const handleLinkedInCallback = async (userId: string, callbackData: TLinkedInAuthRequest): Promise<ILinkedInUser> => {
    const { code } = callbackData;

    try {
        const tokenData = await exchangeLinkedInCodeForToken(code);

        const linkedInProfile = await getLinkedInProfile(tokenData.access_token);

        let emailAddress: string;
        try {
            emailAddress = await getLinkedInEmail(tokenData.access_token);
        } catch (error) {
            emailAddress = '';
        }

        const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        return await LinkedInUser.findOneAndUpdate(
            {userId},
            {
                linkedinId: linkedInProfile.id,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt,
                profile: {
                    firstName: linkedInProfile.firstName.localized[linkedInProfile.firstName.preferredLocale.language],
                    lastName: linkedInProfile.lastName.localized[linkedInProfile.lastName.preferredLocale.language],
                    headline: linkedInProfile.headline?.localized[linkedInProfile.firstName.preferredLocale.language],
                    profilePicture: linkedInProfile.profilePicture?.['displayImage~']?.elements[0]?.identifiers[0]?.identifier,
                    publicProfileUrl: linkedInProfile.vanityName ? `https://www.linkedin.com/in/${linkedInProfile.vanityName}` : undefined,
                    emailAddress
                },
                isActive: true,
                connectedAt: new Date(),
                lastSyncAt: new Date()
            },
            {upsert: true, new: true}
        );
    } catch (error) {
        throw new Error('LinkedIn authentication failed');
    }
};

export const disconnectLinkedIn = async (userId: string): Promise<void> => {
    await LinkedInUser.findOneAndUpdate(
        { userId },
        { isActive: false },
        { new: true }
    );
};

export const getLinkedInConnection = async (userId: string): Promise<ILinkedInUser | null> => {
    return await LinkedInUser.findOne({ userId, isActive: true });
};

export const syncLinkedInPosts = async (userId: string): Promise<ILinkedInPost[]> => {
    const linkedInUser = await getLinkedInConnection(userId);
    if (!linkedInUser) {
        throw new Error('LinkedIn not connected');
    }

    try {
        const feedData = await getLinkedInFeed(linkedInUser.accessToken);
        const posts: ILinkedInPost[] = [];

        for (const post of feedData.elements) {
            const existingPost = await LinkedInPost.findOne({ postId: post.id });

            if (!existingPost) {
                const newPost = new LinkedInPost({
                    userId,
                    linkedinUserId: linkedInUser._id,
                    postId: post.id,
                    content: {
                        text: post.text?.text,
                        images: post.content?.multiImage?.images.map(img => img.url) || [],
                        articles: post.content?.article ? [{
                            title: post.content.article.title,
                            url: post.content.article.source,
                            description: post.content.article.description
                        }] : []
                    },
                    author: {
                        name: `${linkedInUser.profile.firstName} ${linkedInUser.profile.lastName}`,
                        profileUrl: linkedInUser.profile.publicProfileUrl,
                        profilePicture: linkedInUser.profile.profilePicture
                    },
                    engagement: {
                        likes: post.socialDetail.totalSocialActivityCounts.numLikes,
                        comments: post.socialDetail.totalSocialActivityCounts.numComments,
                        shares: post.socialDetail.totalSocialActivityCounts.numShares,
                        reactions: {
                            like: post.socialDetail.totalSocialActivityCounts.numLikes,
                            celebrate: 0,
                            support: 0,
                            love: 0,
                            insightful: 0,
                            funny: 0
                        }
                    },
                    publishedAt: new Date(post.created.time),
                    isUserPost: true,
                    visibility: 'PUBLIC'
                });

                await newPost.save();
                posts.push(newPost);
            }
        }

        // Update last sync time
        await LinkedInUser.findByIdAndUpdate(linkedInUser._id, { lastSyncAt: new Date() });

        return posts;
    } catch (error) {
        throw new Error('Failed to sync LinkedIn posts');
    }
};

export const getLinkedInPosts = async (userId: string, page: number = 1, limit: number = 10): Promise<{ posts: ILinkedInPost[]; total: number }> => {
    const linkedInUser = await getLinkedInConnection(userId);
    if (!linkedInUser) {
        throw new Error('LinkedIn not connected');
    }

    const skip = (page - 1) * limit;
    const posts = await LinkedInPost.find({ userId })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('linkedinUserId');

    const total = await LinkedInPost.countDocuments({ userId });

    return { posts, total };
};

export const createPost = async (userId: string, postData: TLinkedInPostCreate): Promise<any> => {
    const linkedInUser = await getLinkedInConnection(userId);
    if (!linkedInUser) {
        throw new Error('LinkedIn not connected');
    }

    try {
        const result = await createLinkedInPost(linkedInUser.accessToken, postData);

        // Sync posts to update our database
        await syncLinkedInPosts(userId);

        return result;
    } catch (error) {
        throw new Error('Failed to create LinkedIn post');
    }
};

export const likePost = async (userId: string, postId: string): Promise<void> => {
    const linkedInUser = await getLinkedInConnection(userId);
    if (!linkedInUser) {
        throw new Error('LinkedIn not connected');
    }

    await likeLinkedInPost(linkedInUser.accessToken, postId);
};

export const commentOnPost = async (userId: string, postId: string, comment: string): Promise<void> => {
    const linkedInUser = await getLinkedInConnection(userId);
    if (!linkedInUser) {
        throw new Error('LinkedIn not connected');
    }

    await commentOnLinkedInPost(linkedInUser.accessToken, postId, comment);
};

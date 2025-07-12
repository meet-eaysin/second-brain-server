import {LinkedInUser} from "../../linkedin/models/LinkedInUser";
import {ESocialPlatform, SocialConnection} from "../models/social-connections.model";

export const migrateLinkedInData = async () => {
    try {
        const linkedinUsers = await LinkedInUser.find({ isActive: true });

        for (const linkedinUser of linkedinUsers) {
            // Check if already migrated
            const existingConnection = await SocialConnection.findOne({
                userId: linkedinUser.userId,
                platform: ESocialPlatform.LINKEDIN
            });

            if (!existingConnection) {
                await SocialConnection.create({
                    userId: linkedinUser.userId,
                    platform: ESocialPlatform.LINKEDIN,
                    platformUserId: linkedinUser.linkedinId,
                    accessToken: linkedinUser.accessToken,
                    refreshToken: linkedinUser.refreshToken,
                    tokenExpiresAt: linkedinUser.tokenExpiresAt,
                    refreshTokenExpiresAt: linkedinUser.refreshTokenExpiresAt,
                    scope: linkedinUser.scope,
                    profile: linkedinUser.profile,
                    email: linkedinUser.email,
                    isActive: linkedinUser.isActive,
                    connectedAt: linkedinUser.connectedAt,
                    lastSyncAt: linkedinUser.lastSyncAt
                });
            }
        }

        console.log('LinkedIn data migration completed');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

import { connectToDatabase } from '@/lib/mongodb';
import type { SocialLinks, SiteSettingsDoc } from '@/types';

const SETTINGS_COLLECTION = 'site_settings';
const SETTINGS_DOC_ID = 'global_settings'; // Singleton document ID

// Fetches the social links from the single settings document
export async function getSocialLinks(): Promise<SocialLinks> {
  console.log('[siteSettingsService] getSocialLinks called');
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<SiteSettingsDoc>(SETTINGS_COLLECTION);
    const doc = await collection.findOne({ _id: SETTINGS_DOC_ID as any });

    if (!doc) {
      console.log('[siteSettingsService] No settings document found, returning empty object.');
      return {}; // Return empty object if no settings exist yet
    }
    return doc.socialLinks || {};
  } catch (error: any) {
    console.error('[siteSettingsService] Error fetching social links:', error.message);
    throw new Error('Failed to fetch site settings.');
  }
}

// Updates or creates (upserts) the social links in the settings document
export async function upsertSocialLinks(links: SocialLinks): Promise<SocialLinks> {
    console.log('[siteSettingsService] upsertSocialLinks called with:', links);
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<SiteSettingsDoc>(SETTINGS_COLLECTION);

        const updatePayload = {
            socialLinks: links,
            updatedAt: new Date(),
        };

        const result = await collection.findOneAndUpdate(
            { _id: SETTINGS_DOC_ID as any },
            { $set: updatePayload },
            { upsert: true, returnDocument: 'after' }
        );
        
        if (!result) {
            const inserted = await getSocialLinks();
             if(!inserted) throw new Error('Failed to upsert and retrieve site settings.');
            return inserted;
        }

        const updatedDoc = result as SiteSettingsDoc;

        return updatedDoc.socialLinks || {};

    } catch (error: any) {
        console.error('[siteSettingsService] Error upserting social links:', error.message);
        throw error;
    }
}

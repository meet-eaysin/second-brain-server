const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isDryRun = process.argv.includes('--dry-run');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
};

const fixMultipleDefaultCalendars = async () => {
  const Calendar = mongoose.model(
    'Calendar',
    new mongoose.Schema(
      {
        ownerId: String,
        isDefault: Boolean,
        name: String,
        workspaceId: String,
        createdAt: Date
      },
      { collection: 'calendars' }
    )
  );

  const usersWithMultipleDefaults = await Calendar.aggregate([
    { $match: { isDefault: true } },
    { $group: { _id: '$ownerId', count: { $sum: 1 }, calendars: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`Found ${usersWithMultipleDefaults.length} users with multiple default calendars`);

  for (const user of usersWithMultipleDefaults) {
    console.log(`Processing user ${user._id} with ${user.count} default calendars`);

    // Keep the first calendar as default, unset others
    const [keepId, ...unsetIds] = user.calendars;

    if (!isDryRun) {
      await Calendar.updateMany({ _id: { $in: unsetIds } }, { $set: { isDefault: false } });
      console.log(`Unset ${unsetIds.length} calendars for user ${user._id}`);
    } else {
      console.log(`Would unset ${unsetIds.length} calendars for user ${user._id} (dry run)`);
    }
  }

  console.log('Migration completed');
};

const run = async () => {
  await connectDB();
  await fixMultipleDefaultCalendars();
  await mongoose.disconnect();
  console.log('Done');
};

run().catch(console.error);

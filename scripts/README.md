# Database Migration Scripts

This directory contains database migration and maintenance scripts for the Second Brain application.

## Available Scripts

### fix-multiple-default-calendars.js

**Purpose**: Fixes the issue where users have multiple default calendars by ensuring only one calendar per user is marked as default.

**Problem**: Due to a bug in the workspace creation logic, multiple default calendars were being created for users across different workspaces.

**Solution**: This script identifies users with multiple default calendars and keeps only the first one as default, unsetting the others.

#### Usage

```bash
# Dry run (recommended first)
node scripts/fix-multiple-default-calendars.js --dry-run

# Live migration
node scripts/fix-multiple-default-calendars.js
```

#### Options

- `--dry-run`: Run the script without making any changes (safe for testing)

#### Safety Features

- **Dry-run mode**: Test the migration without making changes
- **Simple and focused**: Does one thing well
- **Environment-based configuration**: Uses .env file for database connection

#### Output

The script provides logging including:
- Number of users with multiple defaults found
- Processing status for each user
- Summary of changes made

#### Example Output

```
Connected to MongoDB
Found 1 users with multiple default calendars
Processing user 68d6b923ba3bb0b14e364382 with 15 default calendars
Would unset 14 calendars for user 68d6b923ba3bb0b14e364382 (dry run)
Migration completed
Done
```

#### Environment Requirements

- `MONGO_URI` or `MONGODB_URI`: MongoDB connection string

#### Best Practices

1. **Always run dry-run first** in production environments
2. **Backup your database** before running live migrations
3. **Test in staging** before production deployment
4. **Run during low-traffic periods** for production migrations

#### Rollback

If you need to rollback this migration:
1. The script only unsets `isDefault` flags
2. You can manually set calendars back to default through the application
3. The migration is idempotent - running it multiple times is safe

## Development

### Adding New Migration Scripts

When creating new migration scripts, follow these best practices:

1. **Keep it simple**: Focus on one specific task
2. **Implement dry-run mode** for safety
3. **Use environment variables** for configuration
4. **Add clear logging** for monitoring progress
5. **Document the script** with usage instructions
6. **Make scripts idempotent** (safe to run multiple times)

### Script Template

```javascript
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isDryRun = process.argv.includes('--dry-run');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
};

const runMigration = async () => {
  // Implementation
};

const run = async () => {
  await connectDB();
  await runMigration();
  await mongoose.disconnect();
  console.log('Done');
};

run().catch(console.error);
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check MongoDB URI and network connectivity
2. **Environment variables missing**: Ensure `.env` file is properly configured
3. **Permission denied**: Check file permissions and user access
4. **Memory issues**: Use batch processing for large datasets

### Getting Help

If you encounter issues:
1. Check the logs for detailed error messages
2. Run with `--verbose` flag for more information
3. Use `--dry-run` to test without making changes
4. Review the script source code for implementation details
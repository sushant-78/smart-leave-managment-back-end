# System Config Migration: Adding created_by Column

## Overview

This migration adds a `created_by` column to the `system_config` table to track which user created each system configuration.

## Changes Made

### 1. Database Schema Changes

- Added `created_by` column to `system_config` table (nullable)
- Added foreign key constraint referencing `users.id` with `ON DELETE SET NULL`
- Updated existing records with a default admin user ID

### 2. Model Changes (`src/models/SystemConfig.js`)

- Added `created_by` field definition with foreign key reference
- Updated `createYearlyConfig()` method to accept `createdBy` parameter
- Updated `upsertConfig()` method to accept `createdBy` parameter
- Added association with User model via `belongsTo` relationship
- Updated query methods to include creator information

### 3. Controller Changes (`src/controllers/adminController.js`)

- Updated `setSystemConfig()` to pass `req.user.id` as `createdBy`
- Updated `updateHolidays()` to pass `req.user.id` as `createdBy`
- Updated `updateWorkingDays()` to pass `req.user.id` as `createdBy`
- Updated `updateLeaveTypes()` to pass `req.user.id` as `createdBy`

## Migration Steps

### Step 1: Run the Database Migration

Execute the SQL migration script:

```sql
-- Run this in your MySQL database
source add_created_by_to_system_config.sql;
```

Or run the commands manually:

```sql
-- 1. Add created_by column
ALTER TABLE system_config
ADD COLUMN created_by INT NULL AFTER leave_types;

-- 2. Add foreign key constraint
ALTER TABLE system_config
ADD CONSTRAINT fk_system_config_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Update existing records (replace 1 with actual admin user ID)
UPDATE system_config SET created_by = 1 WHERE created_by IS NULL;
```

### Step 2: Verify the Migration

```sql
-- Check table structure
DESCRIBE system_config;

-- Check foreign key constraints
SHOW CREATE TABLE system_config;
```

### Step 3: Test the Application

1. Restart your Node.js application
2. Test creating a new system configuration
3. Verify that the `created_by` field is properly populated
4. Test retrieving configurations to ensure the creator information is included

## API Changes

### Before Migration

```json
{
  "id": 1,
  "year": 2024,
  "working_days_per_week": 5,
  "holidays": {},
  "leave_types": {}
}
```

### After Migration

```json
{
  "id": 1,
  "year": 2024,
  "working_days_per_week": 5,
  "holidays": {},
  "leave_types": {},
  "created_by": 1,
  "creator": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

## Important Notes

1. **Default User ID**: The migration script sets `created_by = 1` for existing records. Make sure user ID 1 exists in your system, or update the script with a valid user ID.

2. **Data Preservation**: The foreign key uses `ON DELETE SET NULL`, so if a user is deleted, the system configuration data is preserved and `created_by` becomes `NULL`.

3. **Authentication Required**: All system config creation/update endpoints now require authentication to get the `req.user.id`.

4. **Backward Compatibility**: The changes maintain backward compatibility for existing functionality while adding the new tracking feature.

5. **Audit Trail**: This change enhances the audit trail by tracking who created each system configuration.

## Rollback Plan

If you need to rollback this migration:

```sql
-- Remove foreign key constraint
ALTER TABLE system_config DROP FOREIGN KEY fk_system_config_created_by;

-- Remove created_by column
ALTER TABLE system_config DROP COLUMN created_by;
```

Then revert the model and controller changes in the codebase.

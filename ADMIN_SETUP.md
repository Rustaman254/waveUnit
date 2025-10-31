# Admin Panel Setup Guide

## Overview
The WaveUnits platform now includes a complete admin panel with authentication, KYC approvals, and farm management.

## New Features Added

### 1. Admin Authentication System
- **Admin Login Page**: `/admin/login` - Separate dark-themed login for administrators
- **Role-Based Access**: Profiles now have `role` and `is_admin` fields
- **Protected Routes**: Admin routes check for admin status before allowing access
- **Automatic Logout**: Non-admin users are logged out if they try to access admin pages

### 2. Admin Dashboard Layout
- **Collapsible Sidebar**: Left sidebar with icons that can be collapsed
- **Fixed Header**: Top header showing admin badge and user info
- **Responsive Design**: Works on mobile and desktop
- **Navigation Items**: Dashboard, KYC Approvals, Farms, Investments, Settings, Transparency

### 3. KYC Approval System
- **KYC Review Page**: `/admin/kyc` - Review all pending KYC applications
- **Approve/Reject Actions**: One-click approval or rejection
- **User Information Display**: View full name, ID number, phone, submission date
- **Document Preview**: Link to view uploaded ID documents
- **Status Tracking**: See pending and rejected applications

### 4. Farm Management
- **Farm List**: `/admin/farms` - View all farms
- **Add New Farm**: Dialog form to add new farms
- **Farm Details**: Name, location, hen count, daily production, description, image
- **Status Badges**: Active/Inactive status indicators

### 5. User Dashboard Improvements
- **Collapsible Sidebar**: Same sidebar component for investor users
- **KYC Status Display**: Badge showing KYC status (Approved/Pending/Rejected)
- **Disabled Actions**: Investment button disabled if KYC not approved
- **KYC Warning Card**: Yellow alert card prompting users to complete KYC
- **Responsive Layout**: Works seamlessly on all screen sizes

## Database Changes

### New Tables
```sql
-- farms table
- id (uuid)
- name (text)
- location (text)
- total_hens (integer)
- daily_production (integer)
- status (text): active or inactive
- description (text)
- image_url (text)
- created_at, updated_at (timestamptz)
```

### Updated Tables
```sql
-- profiles table additions
- role (text): 'investor' or 'admin'
- is_admin (boolean): quick admin check
```

### Row Level Security
- Admins can view and update all profiles
- Admins can manage farms (insert, update, delete)
- Users can only view active farms
- KYC approval restricted to admins

## Creating an Admin Account

### Method 1: Manual Database Update
```sql
-- After registering a user account, update their profile:
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE id = 'user-uuid-here';
```

### Method 2: Via Supabase Dashboard
1. Go to Supabase Dashboard > Table Editor > profiles
2. Find the user you want to make admin
3. Edit the row and set:
   - `is_admin` = `true`
   - `role` = `admin`
4. Save changes

## Access URLs

### Admin Routes
- `/admin/login` - Admin login (dark theme)
- `/admin` - Admin dashboard (overview stats)
- `/admin/kyc` - KYC approvals
- `/admin/farms` - Farm management
- `/admin/investments` - Investment oversight (to be implemented)
- `/admin/settings` - Platform settings (to be implemented)

### User Routes
- `/auth/login` - User login
- `/auth/register` - User registration
- `/dashboard` - User dashboard (with sidebar)
- `/dashboard/kyc` - KYC submission
- `/dashboard/invest` - Investment page (requires KYC approval)
- `/dashboard/wallet` - Wallet page (to be implemented)
- `/transparency` - Public transparency reports

## KYC Workflow

### User Journey
1. User registers at `/auth/register`
2. Redirected to `/dashboard/kyc` to submit KYC
3. Fills personal information and uploads ID
4. Status set to "pending"
5. Dashboard shows yellow warning card
6. Investment button is disabled

### Admin Journey
1. Admin logs in at `/admin/login`
2. Dashboard shows pending KYC count
3. Navigates to `/admin/kyc`
4. Reviews user information and ID document
5. Clicks "Approve" or "Reject"
6. User's KYC status updated immediately

### After Approval
1. User dashboard updates automatically
2. Yellow warning card disappears
3. Investment button becomes active
4. User can now make investments

## Sidebar Features

### For Investors
- Dashboard (overview)
- Invest (make new investment)
- Wallet (manage funds)
- Transparency (farm reports)
- Collapsible to icon-only view

### For Admins
- Dashboard (platform stats)
- KYC Approvals (review users)
- Farms (manage farms)
- Investments (monitor all investments)
- Settings (platform configuration)
- Transparency (public view)

## Security Features

### Admin Protection
- Admin login checks `is_admin` flag
- Non-admin users are logged out if they try to access admin routes
- All admin operations are protected by RLS policies
- Admin badge displayed in header

### KYC Restrictions
- Investment button disabled until KYC approved
- Warning message displayed on dashboard
- No investment routes accessible without approval
- Clear visual indicators of status

## Styling & Design

### Color Scheme
- **Investor Dashboard**: Green/emerald theme
- **Admin Portal**: Dark slate theme with green accents
- **KYC Status Colors**:
  - Approved: Green (#10b981)
  - Pending: Yellow (#eab308)
  - Rejected: Red (#ef4444)

### Layout
- **Fixed Header**: 64px height, always visible
- **Sidebar**: 256px width (expanded), 64px (collapsed)
- **Main Content**: Offset by header and sidebar
- **Responsive**: Sidebar hidden on mobile, accessible via hamburger menu

## Testing the Admin Panel

### 1. Create Test Admin
```sql
-- Register normally, then run:
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');
```

### 2. Test KYC Flow
1. Register a new user
2. Submit KYC information
3. Log in as admin
4. Approve the KYC
5. Log back in as user
6. Verify investment button is enabled

### 3. Test Farm Management
1. Log in as admin
2. Go to Farms page
3. Click "Add New Farm"
4. Fill in details
5. Submit and verify farm appears

## Future Enhancements

### Planned Features
- Investment management page for admins
- Platform settings configuration
- User management (suspend/activate)
- Transparency report creation interface
- Bulk KYC operations
- Analytics and reporting
- Email notifications for KYC status changes
- Audit log for admin actions

## Troubleshooting

### Cannot Access Admin Panel
- Check `is_admin` flag in database
- Ensure you're using `/admin/login` not `/auth/login`
- Clear browser cache and cookies

### KYC Not Updating
- Check RLS policies are enabled
- Verify admin user has correct permissions
- Refresh the page after approval

### Sidebar Not Showing
- Check screen size (hidden on mobile by default)
- Verify layout component is properly imported
- Check for JavaScript errors in console

## Production Checklist

Before deploying to production:
- [ ] Create initial admin account
- [ ] Test KYC approval workflow
- [ ] Set up email notifications
- [ ] Configure admin audit logging
- [ ] Set up monitoring for admin actions
- [ ] Review and test RLS policies
- [ ] Enable rate limiting on admin routes
- [ ] Set up backup admin accounts
- [ ] Document admin procedures
- [ ] Train admin staff

---

**Security Note**: Never commit admin credentials to version control. Use environment variables and secure password management.

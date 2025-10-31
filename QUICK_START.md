# Quick Start Guide - WaveUnits Platform

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Platform
- **Landing Page**: http://localhost:3000
- **User Login**: http://localhost:3000/auth/login
- **User Register**: http://localhost:3000/auth/register
- **Admin Login**: http://localhost:3000/admin/login

## Creating Your First Admin Account

### Step 1: Register a User
1. Go to http://localhost:3000/auth/register
2. Create an account with email and password
3. You'll be redirected to KYC page

### Step 2: Make User an Admin
Open Supabase Dashboard and run:
```sql
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### Step 3: Login as Admin
1. Go to http://localhost:3000/admin/login
2. Use the same credentials
3. You're now in the admin dashboard!

## Testing the Complete Flow

### User Journey
1. **Register** at `/auth/register`
2. **Submit KYC** at `/dashboard/kyc`
   - Fill in personal information
   - Note: Investment button is disabled
3. **Wait for Admin** approval
4. **After Approval**: Investment button becomes active

### Admin Journey
1. **Login** at `/admin/login`
2. **View Dashboard** - See pending KYC count
3. **Approve KYC** at `/admin/kyc`
   - Click "Approve" button
4. **Manage Farms** at `/admin/farms`
   - Click "Add New Farm"
   - Fill in farm details

## Key Features to Test

### Collapsible Sidebar
- Click the collapse button at bottom of sidebar
- Sidebar shrinks to icon-only view
- Works on both admin and investor dashboards

### KYC Restrictions
- Try to invest before KYC approval (should be disabled)
- Submit KYC as user
- Approve as admin
- Verify investment button is now enabled

### Farm Management
- Add a new farm with details
- View farm cards in grid layout
- Check farm status badges

## Common Routes

### Public Routes
- `/` - Landing page with calculator
- `/transparency` - Public farm reports

### User Routes (Requires Login)
- `/dashboard` - Investment overview
- `/dashboard/kyc` - KYC submission
- `/dashboard/invest` - Make investment (requires KYC)
- `/dashboard/wallet` - Wallet management

### Admin Routes (Requires Admin Role)
- `/admin` - Admin dashboard
- `/admin/kyc` - Approve KYC requests
- `/admin/farms` - Manage farms
- `/admin/investments` - View all investments
- `/admin/settings` - Platform settings

## Database Tables

All tables are created automatically via migrations:
- `profiles` - User profiles with admin roles
- `investments` - Investment records
- `profit_distributions` - Daily profit tracking
- `withdrawals` - Withdrawal requests
- `platform_settings` - Configuration
- `transparency_reports` - Weekly reports
- `farms` - Farm management

## Styling Notes

### Investor Dashboard
- **Primary Color**: Green (#10b981)
- **Accent**: Emerald (#059669)
- **Theme**: Light, agriculture-focused

### Admin Portal
- **Primary Color**: Slate (#1e293b)
- **Accent**: Green (#10b981)
- **Theme**: Dark, professional

### KYC Status Colors
- **Approved**: Green badge
- **Pending**: Yellow badge
- **Rejected**: Red badge

## Mobile Responsiveness

- Sidebar hidden on mobile (< 1024px)
- Hamburger menu shows user info
- All tables are responsive
- Forms adapt to screen size

## Next Steps

1. **Add Mock Data**: Run the mock data generator for transparency reports
2. **Create Test Users**: Register multiple users to test KYC workflow
3. **Test Admin Functions**: Approve/reject KYCs, add farms
4. **Customize Design**: Adjust colors and fonts to match your brand
5. **Implement Hedera**: Connect wallet and blockchain features

## Troubleshooting

### "Cannot access admin panel"
- Check you ran the SQL to set `is_admin = true`
- Use `/admin/login` not `/auth/login`
- Clear cookies and try again

### "Sidebar not showing"
- Check screen size (hidden on small screens)
- Look for hamburger menu icon
- Check browser console for errors

### "KYC not updating"
- Refresh the page after approval
- Check database row level security
- Verify admin role is set correctly

## Build for Production

```bash
npm run build
npm run start
```

All routes are statically generated for optimal performance.

## Support

For detailed information:
- See `README.md` for full feature list
- See `ADMIN_SETUP.md` for admin documentation
- Check Supabase dashboard for database issues

---

**Happy Building!** 🐔🥚

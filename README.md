# WaveUnits - Fractional Poultry Investment Platform on Hedera

A full-stack Next.js application enabling fractional ownership of egg-laying hens, built on Hedera Hashgraph blockchain with Supabase for data management.

## Features Implemented

### Core Functionality
- **Landing Page**: Beautiful, conversion-optimized page with live investment calculator
- **Authentication System**: Email/password registration and login with Supabase Auth
- **KYC Verification**: Complete KYC workflow with admin approval system
- **Investment Dashboard**: Portfolio overview with collapsible sidebar and earnings tracking
- **Transparency Page**: Public farm operations and weekly reports
- **Tiered Profit System**: 4 investment tiers (Starter, Bronze, Silver, Gold) with daily returns

### Admin Features
- **Admin Portal**: Separate dark-themed admin login at `/admin/login`
- **Role-Based Access**: Admin and investor roles with protected routes
- **KYC Approvals**: Review and approve/reject user verification requests
- **Farm Management**: Add and manage poultry farms
- **Dashboard Sidebar**: Collapsible navigation for both admin and investor views
- **Access Control**: KYC restrictions prevent investments until approval

### Tech Stack
- **Frontend**: Next.js 13 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Blockchain**: Hedera SDK (@hashgraph/sdk) for tokenization
- **Styling**: Tailwind CSS with green/agriculture theme

## Database Schema

### Tables Created
- `profiles`: Extended user information with KYC status and admin roles
- `investments`: Investment records with lock periods
- `profit_distributions`: Daily profit payout tracking
- `withdrawals`: Withdrawal request management
- `platform_settings`: Configurable platform parameters
- `transparency_reports`: Weekly farm operation reports
- `farms`: Farm information and management

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (already configured)
- Hedera testnet account (for blockchain operations)

### Environment Variables
The following environment variables are already configured in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=your_operator_key
HEDERA_NETWORK=testnet
HEN_PRICE_KSH=700
KSH_TO_HBAR_RATE=0.01
```

### Installation
```bash
npm install
npm run dev
```

## Project Structure

```
/app
  /auth
    /login           - User sign in page
    /register        - User sign up page
  /dashboard
    layout.tsx       - Protected dashboard layout with sidebar
    page.tsx         - Investment portfolio dashboard
    /kyc             - KYC verification flow
  /admin
    layout.tsx       - Admin dashboard layout with sidebar
    login            - Admin login (dark theme)
    page.tsx         - Admin dashboard with stats
    /kyc             - KYC approval interface
    /farms           - Farm management
  /transparency      - Public transparency dashboard
  page.tsx          - Landing page

/components
  /ui                - shadcn/ui components
  dashboard-sidebar.tsx - Collapsible sidebar component

/lib
  supabase.ts       - Supabase client and types
  mock-data.ts      - Mock data generators
```

## Features Breakdown

### 1. Landing Page
- Hero section with value proposition
- Live platform statistics (Total Hens, Active Investors, Returns Paid)
- Interactive investment calculator
- How It Works (4-step process)
- Profit tiers display
- FAQ accordion
- Trust indicators (blockchain security, real assets, weekly reports)

### 2. Authentication
- Email/password registration
- Automatic profile creation
- Session management with Supabase Auth
- Redirect to KYC after registration

### 3. KYC System
- Personal information collection (Name, ID, Phone, Address)
- Document upload support
- Three status states: Pending, Approved, Rejected
- Admin approval required before investing

### 4. Dashboard
- Portfolio overview with 4 key metrics
- Tier progress visualization
- Recent investments table
- Profit history with daily breakdowns
- Responsive design for mobile and desktop

### 5. Transparency Page
- Platform statistics (hens, production, pricing)
- Weekly farm reports with full financial breakdown
- Cost transparency (feed, labor, other expenses)
- Public access (no login required)
- Blockchain verification information

## Investment Tiers

| Tier    | Range (KSh)     | Daily Rate | Example Daily Profit |
|---------|-----------------|------------|----------------------|
| Starter | 10 - 1,000      | 0.1%       | KSh 1               |
| Bronze  | 1,001 - 5,000   | 0.15%      | KSh 7.5             |
| Silver  | 5,001 - 20,000  | 0.2%       | KSh 40              |
| Gold    | 20,001+         | 0.25%      | KSh 50+             |

## Next Steps for Full Implementation

### Hedera Integration (Not Yet Implemented)
1. **Token Creation**: Create HENS fungible token on Hedera testnet
2. **Wallet Connection**: Integrate HashConnect for wallet authentication
3. **Investment Processing**: Mint and transfer tokens on investment
4. **Daily Distributions**: Automated profit distribution via smart contracts
5. **Withdrawal System**: Burn tokens and process withdrawals

### Additional Features to Build
1. **Investment Flow**: Complete payment processing (M-Pesa & HBAR)
2. **Wallet Dashboard**: Connect Hedera wallet, display balances
3. **Admin Panel**: KYC approval, platform management, token minting
4. **Withdrawal System**: M-Pesa and crypto withdrawal processing
5. **Charts & Analytics**: Investment performance visualization

### API Routes Needed
- `/api/invest` - Process new investments
- `/api/distribute-profits` - Daily profit distribution (cron job)
- `/api/withdraw` - Process withdrawal requests
- `/api/admin/kyc` - Approve/reject KYC
- `/api/admin/mint-tokens` - Mint new HENS tokens

## Security Considerations

### Implemented
- Row Level Security (RLS) on all database tables
- User can only access their own records
- KYC verification required for investing
- Session-based authentication

### Required for Production
- HTTPS enforcement
- Rate limiting on API routes
- Input validation and sanitization
- Hedera private key management (use environment variables, never expose in frontend)
- Multi-signature for platform treasury
- Audit logging for all admin actions

## Design Highlights

- **Color Scheme**: Green/emerald palette for agricultural theme
- **Typography**: Clear hierarchy with Inter font family
- **Responsive**: Mobile-first design with breakpoints
- **Interactions**: Hover states, smooth transitions, loading states
- **Trust Elements**: Badges, transparency, blockchain verification

## Development Notes

- Uses Next.js 13 App Router (not Pages Router)
- All dashboard pages require authentication
- Database queries use Supabase client-side SDK
- Blockchain operations should be server-side (API routes)
- Mock data available in `lib/mock-data.ts`

## Support

For questions or issues:
- Email: support@waveunits.co.ke
- GitHub Issues: (repository link)

## License

Proprietary - All rights reserved

---

Built with Next.js, Supabase, and Hedera Hashgraph

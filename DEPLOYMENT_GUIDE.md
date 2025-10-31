# WaveUnits - Deployment & Hedera Integration Guide

## 🔐 Default Admin Credentials

A default admin account has been created in the database:

```
Email: admin@waveunits.co.ke
Password: WaveUnits2025!
```

**IMPORTANT:** Change this password immediately after first login!

### Login URL
- Development: `http://localhost:3000/admin/login`
- Production: `https://your-domain.com/admin/login`

---

## 🌐 Environment Configuration

The platform supports both development and production environments with Hedera testnet integration.

### Environment Variables

```env
# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hedera Configuration (Testnet)
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_IS_MAINNET=false
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your_private_key
NEXT_PUBLIC_PLATFORM_TREASURY_ACCOUNT=0.0.YOUR_ACCOUNT_ID

# Smart Contract IDs (populated after deployment)
NEXT_PUBLIC_HENS_TOKEN_ID=0.0.TOKEN_ID
NEXT_PUBLIC_INVESTMENT_CONTRACT_ID=0.0.CONTRACT_ID

# Platform Settings
HEN_PRICE_KSH=700
KSH_TO_HBAR_RATE=0.01
```

---

## 🚀 Hedera Smart Contract Deployment

### Prerequisites

1. **Hedera Testnet Account**
   - Create account at: https://portal.hedera.com/
   - Fund with testnet HBAR from: https://portal.hedera.com/faucet

2. **Install Dependencies**
   ```bash
   npm install
   npm install -g solc
   ```

### Step 1: Compile Smart Contract

```bash
# Compile the Solidity contract
solc --bin --abi contracts/WaveUnitsInvestment.sol -o contracts/

# This creates:
# - WaveUnitsInvestment_bytecode.bin
# - WaveUnitsInvestment_abi.json
```

### Step 2: Deploy HENS Token

```bash
# Run the token deployment script
npx ts-node scripts/deploy-token.ts
```

This will:
- Create the HENS (WaveUnits Hen Share Token)
- Output the Token ID
- Update your `.env` file with `NEXT_PUBLIC_HENS_TOKEN_ID`

### Step 3: Deploy Investment Contract

```bash
# Run the contract deployment script
npx ts-node scripts/deploy-hedera-contracts.ts
```

This will:
- Upload contract bytecode to Hedera
- Deploy the WaveUnitsInvestment contract
- Output the Contract ID
- Update your `.env` file with `NEXT_PUBLIC_INVESTMENT_CONTRACT_ID`

### Step 4: Verify Deployment

```bash
# Test the deployment
npx ts-node scripts/verify-deployment.ts
```

---

## 📋 Smart Contract Features

### WaveUnitsInvestment Contract

**Functions:**
- `invest(uint256 amountKsh)` - Make investment with KSh amount
- `redeemShares(uint256 shares)` - Redeem shares for KSh
- `getUserTier(address user)` - Get user's profit tier
- `calculateDailyProfit(address user)` - Calculate daily returns
- `getUserInvestments(address user)` - Get all user investments

**Events:**
- `InvestmentMade` - Emitted when investment is made
- `SharesRedeemed` - Emitted when shares are redeemed
- `ProfitDistributed` - Emitted when profit is distributed

**Profit Tiers:**
- Starter: 0.1% daily (0 - 1,000 KSh)
- Bronze: 0.15% daily (1,000 - 5,000 KSh)
- Silver: 0.2% daily (5,000 - 20,000 KSh)
- Gold: 0.25% daily (20,000+ KSh)

---

## 🔧 Admin Panel Access

### What Admin Can Do

1. **View Platform Statistics**
   - Total users
   - Pending KYC applications
   - Total investments
   - Active farms

2. **KYC Management**
   - View all pending applications
   - Approve/reject KYC requests
   - View user documents
   - Track approval history

3. **User Management**
   - View all registered users
   - Search users by name/phone
   - Monitor investment activity
   - See Hedera wallet connections

4. **Investment Oversight**
   - Platform-wide investment stats
   - Individual investment records
   - Transaction IDs and history
   - Payment method tracking

5. **Withdrawal Processing**
   - Review withdrawal requests
   - Approve/reject withdrawals
   - Track processing status

6. **Farm Management**
   - Add new farms
   - Update farm details
   - Monitor production metrics

7. **Platform Settings**
   - Configure hen pricing
   - Adjust profit tier rates
   - Update conversion rates
   - Modify lock periods

8. **Admin Management**
   - View all administrators
   - Revoke admin access
   - Add new admins

---

## 🐛 Troubleshooting

### Admin Cannot See KYC Applications

**Issue:** KYC page shows no applications even though they exist

**Solution:**
1. Check RLS policies in Supabase
2. Verify admin has `is_admin = true` in profiles table
3. Ensure KYC applications have `kyc_submitted_at` not null
4. Check browser console for errors

```sql
-- Verify admin status
SELECT id, email, is_admin, role FROM profiles WHERE is_admin = true;

-- Check pending KYC
SELECT id, full_name, kyc_status, kyc_submitted_at
FROM profiles
WHERE kyc_status = 'pending' AND is_admin = false;
```

### Admin Registration Not Working

**Solution:**
Use the default admin account provided above, or manually create admin via SQL:

```sql
-- Create admin profile (after user registers)
UPDATE profiles
SET is_admin = true, role = 'admin', kyc_status = 'approved'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### Hedera Connection Fails

**Possible Causes:**
1. Invalid operator ID or key
2. Insufficient testnet balance
3. Wrong network configuration

**Solution:**
```bash
# Verify environment variables
echo $HEDERA_OPERATOR_ID
echo $NEXT_PUBLIC_HEDERA_NETWORK

# Check testnet balance
npx ts-node scripts/check-balance.ts
```

### Contract Deployment Fails

**Common Issues:**
1. Contract bytecode not compiled
2. Insufficient gas limit
3. Constructor parameters incorrect

**Solution:**
```bash
# Re-compile contract
solc --bin contracts/WaveUnitsInvestment.sol -o contracts/

# Increase gas limit in deployment script (line 73)
.setGas(500000) // Instead of 300000
```

---

## 🔒 Security Best Practices

### Production Deployment

1. **Change Default Credentials**
   ```sql
   -- Update admin password after first login
   UPDATE auth.users
   SET encrypted_password = crypt('NewSecurePassword123!', gen_salt('bf'))
   WHERE email = 'admin@waveunits.co.ke';
   ```

2. **Secure Environment Variables**
   - Never commit `.env` to version control
   - Use environment secrets in production
   - Rotate keys regularly

3. **Enable Rate Limiting**
   - Implement on admin endpoints
   - Protect KYC submission
   - Limit investment frequency

4. **Monitor Admin Actions**
   - Log all admin operations
   - Set up alerts for critical actions
   - Regular audit of admin activity

5. **Backup Database**
   - Daily automated backups
   - Test restore procedures
   - Keep offsite backups

---

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] Review pending KYC applications
- [ ] Monitor platform investments
- [ ] Check Hedera transaction success rates
- [ ] Review withdrawal requests
- [ ] Monitor farm production metrics

### Weekly Tasks

- [ ] Generate transparency reports
- [ ] Review profit distributions
- [ ] Audit admin actions
- [ ] Check database health
- [ ] Update platform statistics

### Monthly Tasks

- [ ] Financial reconciliation
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Farm visit and verification

---

## 📱 Mobile Access

The admin panel is fully responsive and accessible on mobile devices.

**Mobile Features:**
- Hamburger menu navigation
- Touch-optimized buttons
- Scrollable tables
- Responsive forms
- Quick actions

---

## 🎓 Training Resources

### Admin Training Videos
1. Platform Overview (Coming soon)
2. KYC Approval Process (Coming soon)
3. Investment Monitoring (Coming soon)
4. Farm Management (Coming soon)

### Documentation
- User Manual: See `README.md`
- Admin Guide: See `ADMIN_SETUP.md`
- Quick Start: See `QUICK_START.md`
- Features List: See `COMPLETE_FEATURES.md`

---

## 📞 Support

### Getting Help

**Technical Issues:**
- Check troubleshooting section above
- Review console logs
- Check Supabase logs
- Verify Hedera transaction status

**Admin Account Issues:**
- Use default credentials above
- Contact database administrator
- Check email for registration confirmation

**Smart Contract Issues:**
- Verify deployment on HashScan
- Check gas fees and limits
- Review contract events

---

## 🚀 Production Checklist

Before going live:

- [ ] Change default admin password
- [ ] Deploy Hedera smart contracts to mainnet
- [ ] Update `NEXT_PUBLIC_IS_MAINNET=true`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Enable monitoring and alerts
- [ ] Test all admin functions
- [ ] Verify KYC workflow
- [ ] Test investment flow end-to-end
- [ ] Set up backup procedures
- [ ] Configure email notifications
- [ ] Train admin staff
- [ ] Document processes
- [ ] Legal compliance check
- [ ] Security audit complete

---

## 📈 Scaling Considerations

### Performance Optimization

1. **Database Indexing**
   - Index on `kyc_status`
   - Index on `created_at`
   - Index on `user_id` in investments

2. **Caching**
   - Cache platform statistics
   - Cache user tier calculations
   - Redis for session management

3. **CDN**
   - Static assets on CDN
   - Image optimization
   - Lazy loading

### High Availability

1. **Database Replication**
2. **Load Balancing**
3. **Backup Failover**
4. **Health Monitoring**

---

**Built with ❤️ for WaveUnits Platform**

Last Updated: 2025

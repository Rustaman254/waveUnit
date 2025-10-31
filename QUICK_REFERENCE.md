# WaveUnits - Quick Reference Card

## 🔑 Default Admin Login

```
URL: http://localhost:3000/admin/login

Email: admin@waveunits.co.ke
Password: WaveUnits2025!
```

---

## 📍 Important URLs

### Admin
- Login: `/admin/login`
- Dashboard: `/admin`
- KYC Approvals: `/admin/kyc`
- Users: `/admin/users`
- Investments: `/admin/investments`
- Withdrawals: `/admin/withdrawals`
- Farms: `/admin/farms`
- Admins: `/admin/admins`
- Settings: `/admin/settings`

### User
- Login: `/auth/login`
- Register: `/auth/register`
- Dashboard: `/dashboard`
- KYC: `/dashboard/kyc`
- Invest: `/dashboard/invest`
- Wallet: `/dashboard/wallet`

### Public
- Landing: `/`
- Transparency: `/transparency`

---

## 🌐 Environment Variables

```env
# Hedera Testnet
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_IS_MAINNET=false
HEDERA_OPERATOR_ID=0.0.YOUR_ID
HEDERA_OPERATOR_KEY=your_key
NEXT_PUBLIC_PLATFORM_TREASURY_ACCOUNT=0.0.YOUR_ID

# Smart Contracts (after deployment)
NEXT_PUBLIC_HENS_TOKEN_ID=0.0.TOKEN_ID
NEXT_PUBLIC_INVESTMENT_CONTRACT_ID=0.0.CONTRACT_ID

# Platform
HEN_PRICE_KSH=700
KSH_TO_HBAR_RATE=0.01
```

---

## 🚀 Quick Start

```bash
# Install
npm install

# Run dev
npm run dev

# Build
npm run build

# Deploy Hedera (when ready)
solc --bin contracts/WaveUnitsInvestment.sol -o contracts/
npx ts-node hedera-scripts/deploy-hedera-contracts.ts
```

---

## 🐛 Common Issues

### Can't Login as Admin
**Solution:** Use default credentials above

### KYC Not Showing
**Check:**
1. User submitted KYC
2. Logged in as admin
3. Browser console for errors

### Hedera Not Working
**Check:**
1. Environment variables set
2. Operator account funded
3. Network is correct (testnet)

---

## 📊 Admin Responsibilities

### Daily
- [ ] Check pending KYC
- [ ] Review investments
- [ ] Process withdrawals

### Weekly
- [ ] Update farm stats
- [ ] Generate reports
- [ ] Review user activity

### Monthly
- [ ] Financial audit
- [ ] Security check
- [ ] Performance review

---

## 🎨 Theme Colors

- **Primary:** Amber/Brown (#C87D3C)
- **Background:** Warm Cream (#F9F7F4)
- **Success:** Green (#10b981)
- **Warning:** Yellow (#eab308)
- **Error:** Red (#ef4444)

---

## 📞 Emergency Contacts

**Technical Issues:**
- Check `DEPLOYMENT_GUIDE.md`
- Review `FIXED_ISSUES_SUMMARY.md`
- Check console logs

**Admin Issues:**
- Use default credentials
- Check RLS policies in Supabase
- Verify `is_admin=true` in database

---

## ✅ Testing Checklist

- [ ] Admin login works
- [ ] KYC approval works
- [ ] User registration works
- [ ] Investment flow works
- [ ] Wallet connection works
- [ ] Farms management works
- [ ] Settings update works

---

## 📚 Documentation

1. **README.md** - Main overview
2. **ADMIN_SETUP.md** - Admin guide
3. **QUICK_START.md** - Quick setup
4. **COMPLETE_FEATURES.md** - All features
5. **DEPLOYMENT_GUIDE.md** - Deployment steps
6. **FIXED_ISSUES_SUMMARY.md** - What was fixed

---

**Status:** 🟢 Production Ready (Testnet)
**Build:** ✅ 21 pages compiled
**Updated:** 2025-10-26

---
description: Test the complete Referral System flow from Signup to Reward
---

This workflow guides you through testing the Referral Logic to ensure it works as expected.

1. **Configure Referral Settings (Admin)**
   - Login as Admin.
   - Navigate to **"Coupon & Referrals"** (or Referral Management).
   - Set **Referrer Reward** (e.g., 20) and **New User Reward** (e.g., 20).
   - Ensure "Enable Referral System" is CHECKED.
   - Click "Save Settings".

2. **Get Referral Code (User A - "Referrer")**
   - Login as an existing user (User A) or create one.
   - Open **Profile** (Side Menu / Drawer).
   - Go to **"Refer & Earn"** section.
   - Copy the **Referral Code** (e.g., `FR-X9Y2Z`).

3. **Signup New User (User B - "Referee")**
   - Open a separate browser/incognito window.
   - Click **Login**.
   - **Important:** Enter a NEW Mobile Number (not registered).
   - The system detects it's a new number and shows the **Signup Form**.
   - Input Name and PIN.
   - **Input Referral Code:** Paste User A's code in the "Referral Code (Optional)" field.
   - Complete Signup.

4. **Verify New User Reward (User B)**
   - After signup, check User B's **Wallet Balance**.
   - It should immediately show `₹20` (or configured amount).
   - Go to "Refer & Earn" -> verify "Referred by: [User A Name]".

5. **Place Order (User B)**
   - Add items to cart.
   - Place an Order (COD or Online).
   - Ensure Order Status is `CREATED` or `PAYMENT_PENDING`.

6. **Complete Order (Admin)**
   - Go to Admin Dashboard -> **Orders**.
   - Find User B's order.
   - Change Status to `DELIVERED`.
   - **Note:** This triggers the Referrer Reward.

7. **Verify Referrer Reward (User A)**
   - Login back as User A.
   - Check **Wallet Balance**.
   - It should have increased by `₹20`.
   - Go to "Refer & Earn".
   - "Successful Referrals" count should increment.

# Troubleshooting
- If User A doesn't get a reward, ensure User B's order was their **First Order** and status is strictly `DELIVERED`.
- Check Console Logs on Server regarding `[REFERRAL]` tags.

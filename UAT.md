# User Acceptance Testing (UAT) Checklist
**Project:** 3D Printing Workshop Subscription and Booking System

Use this UAT checklist to verify that all business logic, features, roles, and validation rules are functioning correctly.

---

## 1. Public Customer Portal

### 1.1 Subscription Plan Request
- [ ] **Step 1:** Navigate to the Public Homepage. Verify that the 3D Printing Workshop description and the three default subscription plans (Basic: 12 hrs, Plus: 24 hrs, Advanced: 36 hrs) are displayed.
- [ ] **Step 2:** Click **Request Plan** (or "Buy Plan").
- [ ] **Step 3:** Fill out the form with a test name, valid email, phone number, select a plan (e.g., *Basic Plan*), and add optional notes. Click submit.
- [ ] **Step 4:** Verify that the request is successfully submitted and status is set to `Pending Payment`.
- [ ] **Step 5:** Verify that the "Plan request received" confirmation email is simulated or sent.

### 1.2 Voucher Lookup
- [ ] **Step 1:** Go to the **Voucher Lookup** page.
- [ ] **Step 2:** Enter a valid voucher code, email, and phone number (once a voucher is created in the Admin flow).
- [ ] **Step 3:** Verify that customer details are displayed (with the customer name partially masked for privacy).
- [ ] **Step 4:** Verify that the plan name, total credit hours, remaining credit hours, voucher status, upcoming bookings, attended sessions, credit usage history, and any balance due records are accurately shown.
- [ ] **Step 5:** Attempt lookup with mismatched details (e.g., incorrect phone number). Verify that the system shows a validation error and denies access.

### 1.3 Book Workshop Session
- [ ] **Step 1:** Go to the **Book Session** page.
- [ ] **Step 2:** Enter a valid voucher code, email, and phone number.
- [ ] **Step 3:** Select a session date and select an available session (Beginner, Intermediate, or Advanced).
- [ ] **Step 4:** **Scenario A (Sufficient Credit):**
  - Choose a session where the duration is less than or equal to the voucher's remaining hours (e.g., Beginner Session - 2 hours, with a 12-hour voucher balance).
  - Verify that the booking status is set to `Reserved`.
  - Verify that the voucher balance remains unchanged (credits are NOT deducted during booking).
  - Verify that the session's available slot count immediately decreases by 1.
- [ ] **Step 5:** **Scenario B (Insufficient Credit / Balance Due):**
  - Choose a session where the duration is greater than the remaining voucher balance (e.g., Intermediate Session - 4 hours, but the voucher only has 1 hour left).
  - Verify that the system allows the booking but sets the status to `Balance Due`.
  - Verify that the balance due is correctly calculated: `Shortage Hours * PHP 300` (e.g., 3 hours shortage = PHP 900).
  - Verify that the session's available slot count still decreases by 1.
- [ ] **Step 6:** Verify that a booking confirmation email is simulated/sent, showing the unique booking reference (format: `MLWS-BK-XXXXXX`), QR code, status, and balance due amount (if any).

### 1.4 Booking Cancellation
- [ ] **Step 1:** Go to the **Cancel Booking** page.
- [ ] **Step 2:** Enter the booking reference, email, and phone number.
- [ ] **Step 3:** **Scenario A (On-Time Cancellation - > 2 hours before start):**
  - Cancel a booking scheduled for a future session that starts in more than 2 hours.
  - Verify that the booking status changes to `Cancelled by Customer`.
  - Verify that the session's available slots count increases back by 1.
  - Verify that no credits are refunded (since none were deducted).
  - Verify that a cancellation confirmation email is simulated/sent.
- [ ] **Step 4:** **Scenario B (Late Cancellation - < 2 hours before start):**
  - Attempt to cancel a booking starting in less than 2 hours.
  - Verify that the cancellation is denied and an appropriate error message is shown.

### 1.5 Booking Status Lookup
- [ ] **Step 1:** Navigate to the **Booking Status** page.
- [ ] **Step 2:** Enter booking reference, email, and phone number.
- [ ] **Step 3:** Verify that booking status, session details (category, date, time, duration), balance due (if any), and a partially masked voucher code are displayed alongside a QR code.

---

## 2. Admin Dashboard

### 2.1 Dashboard Summary & Metrics
- [ ] **Step 1:** Log in as an Administrator.
- [ ] **Step 2:** Verify that the dashboard accurately displays summaries for: pending plan requests, active vouchers, today's sessions, today's bookings, balance due bookings, checked-in customers, no-shows, and available slots.

### 2.2 Manage Plan Requests
- [ ] **Step 1:** Navigate to the **Plan Requests** tab.
- [ ] **Step 2:** Find the pending plan request submitted in section 1.1.
- [ ] **Step 3:** Click **Approve / Mark Payment as Paid**.
- [ ] **Step 4:** Verify that the request status changes to `Paid`.
- [ ] **Step 5:** Verify that the system automatically generates a unique voucher code (format: `MLWS-VCH-XXXXXX`) and a voucher QR code.
- [ ] **Step 6:** Verify that an email notification is simulated/sent containing the voucher code, QR code, and a link to the lookup page.

### 2.3 Manage Subscription Plans
- [ ] **Step 1:** Navigate to the **Plans** section.
- [ ] **Step 2:** Create a new plan, or edit an existing plan (change name, credit hours, price, description).
- [ ] **Step 3:** Toggle a plan to inactive. Verify that inactive plans do not appear in the customer registration drop-downs.

### 2.4 Manage Vouchers
- [ ] **Step 1:** Navigate to the **Vouchers** section.
- [ ] **Step 2:** Search for the newly generated voucher using the voucher code or customer details.
- [ ] **Step 3:** Select the voucher and perform a **Manual Credit Adjustment** (e.g., add or subtract credit hours). Verify that the transaction history records this adjustment.
- [ ] **Step 4:** Suspend or cancel the voucher. Verify that the voucher status changes and booking is blocked for suspended/cancelled vouchers.
- [ ] **Step 5:** Create a manual/custom voucher (assigning custom credit hours, customer contact info directly). Verify that it generates successfully.

### 2.5 Manage Sessions
- [ ] **Step 1:** Navigate to the **Sessions** section.
- [ ] **Step 2:** Create a session. Select a category (Beginner, Intermediate, Advanced), date, start/end time, duration, and maximum capacity (default 20).
- [ ] **Step 3:** Verify validation restricts creating multiple sessions of the same category on the same day.
- [ ] **Step 4:** Edit an existing session or change its status (Open, Full, Cancelled, Completed).

### 2.6 Manage Bookings & Payments
- [ ] **Step 1:** Navigate to the **Bookings** section.
- [ ] **Step 2:** Filter bookings by status, date, or customer.
- [ ] **Step 3:** Locate a booking with status `Balance Due`.
- [ ] **Step 4:** Mark the balance due as paid. Verify that the booking status is updated to `Reserved` (or ready for check-in), and that the payment is logged.
- [ ] **Step 5:** Manually cancel a booking or mark a customer as `No Show`. Verify slots are adjusted correctly.

### 2.7 Credit Transaction History
- [ ] **Step 1:** Navigate to the **Credit Transactions** log.
- [ ] **Step 2:** Verify that all credit additions, deductions, manual adjustments, balance due payments, and walk-in transactions are logged with date, amount, description, and staff user ID.

### 2.8 Staff Accounts Management
- [ ] **Step 1:** Navigate to the **Staff Management** section.
- [ ] **Step 2:** Create a new receptionist account and a new admin account.
- [ ] **Step 3:** Log out and log back in with each account. Verify that the receptionist account cannot access administrative features (e.g., editing plans, deleting sessions, managing staff).

---

## 3. Receptionist Dashboard & Check-In

### 3.1 Session Overview
- [ ] **Step 1:** Log in as a Receptionist.
- [ ] **Step 2:** Verify that today's sessions, reserved customers list, checked-in customers, and unclaimed slots are clearly visible.

### 3.2 Booking Verification & Check-In Validation
- [ ] **Step 1:** Enter or scan a voucher code and booking reference number.
- [ ] **Step 2:** Verify that the system shows customer info, remaining hours, and booking details.
- [ ] **Step 3:** **Validation Rule Checks:**
  - Verify that check-in is blocked if the session is not for today.
  - Verify that check-in is blocked if the booking is cancelled.
  - Verify that check-in is blocked if the check-in is attempted outside the valid check-in window (more than 30 minutes before the session starts).
  - Verify that check-in is blocked if there is an unpaid balance (`Balance Due`).
- [ ] **Step 4:** Mark the balance due as paid from the receptionist interface. Verify that the restriction is lifted.
- [ ] **Step 5:** Confirm Check-In.
  - Verify that the correct duration of hours is deducted from the voucher.
  - Verify that booking status changes to `Checked In` (or `Completed / Consumed`).
  - Verify that an attendance record is created.
  - Verify that a credit deduction email notification is simulated/sent.
- [ ] **Step 6:** **Duplicate Prevention:** Attempt to check in the same booking reference a second time. Verify that the system blocks the action and prevents duplicate credit deduction.

### 3.3 Walk-In Processing
- [ ] **Step 1:** Click **Walk-in Check-in** on the receptionist dashboard.
- [ ] **Step 2:** Enter/scan a customer's voucher code.
- [ ] **Step 3:** Select today's session.
- [ ] **Step 4:** **Scenario A (Sufficient Credit):**
  - Select a session where the customer has enough credits.
  - Confirm walk-in check-in. Verify that credits are immediately deducted, and status is marked as `Walk-in Confirmed`.
- [ ] **Step 5:** **Scenario B (Insufficient Credit):**
  - Select a session where the customer has insufficient credits.
  - Verify that the system calculates the shortage fee (PHP 300 per missing hour).
  - Manually mark the balance payment as paid, and confirm attendance.
  - Verify that remaining voucher credits are reduced to 0, the walk-in booking is created, and status is `Walk-in Confirmed`.

### 3.4 Releasing Slots & No-Show Handling
- [ ] **Step 1:** Look at the reservation list for a session starting in less than 10 minutes.
- [ ] **Step 2:** Verify that unclaimed reserved slots can now be released.
- [ ] **Step 3:** Click **Release to Walk-in** on an unclaimed booking.
  - Verify that booking status changes to `Released to Walk-in`.
  - Verify that the slots are added back to the session's available slots.
  - Verify that the customer's voucher credits are NOT deducted.
- [ ] **Step 4:** Mark late absent bookings as `No Show`. Verify that no credit is deducted.

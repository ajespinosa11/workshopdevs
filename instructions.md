On this folder and based on this instruction

Create a full-stack web application for a 3D Printing Workshop Subscription and Booking System.

The system should allow customers to request workshop plans, receive voucher codes after admin approval, book workshop sessions using voucher credits, and check in physically at the workshop through receptionist validation. The app must include a public customer-facing side, an admin dashboard, and a receptionist/check-in module.

Build the application with a clean, modern, responsive UI and a secure backend. Use a database to store plans, vouchers, bookings, sessions, payments, credit transactions, attendance records, and users/staff accounts.

PROJECT CONTEXT

This web application is for a 3D Printing Workshop. Customers do not need to create an account or log in. Instead, they access their information using a unique voucher code, email, and phone number.

Customers can request a subscription plan. Admin manually confirms the payment outside the system. Once payment is marked as paid by admin, the system generates a unique voucher code and QR code. The voucher contains non-expiring credit hours that the customer can use to book any workshop session.

Credits are consumable. They are not deducted during booking. Credits are deducted only when the customer physically arrives at the workshop and the receptionist checks them in by scanning or entering both the voucher code and the booking reference number.

USER ROLES

1. Public Customer

* No login required.
* Can request a plan.
* Can search voucher details using voucher code, email, and phone number.
* Can book workshop sessions.
* Can cancel bookings.
* Can check booking status.

2. Admin

* Login required.
* Can manage plans, vouchers, payments, sessions, bookings, customers, custom vouchers, credits, and reports.

3. Receptionist

* Login required.
* Can scan or enter voucher codes.
* Can scan or enter booking reference numbers.
* Can validate bookings.
* Can confirm check-in.
* Can handle walk-ins.
* Can mark additional balance payments as paid.

SUBSCRIPTION PLANS

Create these default plans:

1. Basic Plan

* Credit: 12 hours
* Non-expiring

2. Plus Plan

* Credit: 24 hours
* Non-expiring

3. Advanced Plan

* Credit: 36 hours
* Non-expiring

Admin should be able to edit plan names, descriptions, prices, and credit hours.

Each time a customer buys or requests a new plan, the system should generate a new voucher. A customer can have multiple vouchers if they buy multiple plans. Each voucher has its own balance and transaction history.

VOUCHER RULES

Each approved plan purchase generates:

* Unique voucher code
* Voucher QR code
* Plan name
* Customer name
* Customer email
* Customer phone number
* Total credit hours
* Remaining credit hours
* Voucher status: Active, Fully Used, Cancelled, Suspended
* Date created
* Credit transaction history

Voucher code format example:
MLWS-VCH-000001

The voucher is used to verify the customer’s plan and remaining credit.

BOOKING REFERENCE RULES

Each booking must generate a separate unique booking reference number and QR code.

Booking reference format example:
MLWS-BK-000001

The booking reference identifies the exact reserved session.

During check-in, the receptionist should validate both:

1. Voucher code
2. Booking reference number

The voucher verifies the customer and credit balance. The booking reference verifies the exact session reservation.

WORKSHOP SESSIONS

There are three session categories per day:

1. Beginner Session

* Usually in the morning
* Duration: 2 hours
* Maximum capacity: 20 slots

2. Intermediate Session

* Usually in the afternoon
* Duration: 4 hours
* Maximum capacity: 20 slots

3. Advanced Session

* Usually in the evening
* Duration: 6 hours
* Maximum capacity: 20 slots

Each session happens only once per day per category.

Admin should be able to manage:

* Session category
* Date
* Start time
* End time
* Duration in hours
* Maximum capacity
* Available slots
* Status: Open, Full, Cancelled, Completed
* Instructor or notes, optional

BOOKING LOGIC

Customer booking should work like this:

1. Customer enters voucher code, email, and phone number.
2. System validates that the voucher exists and the email/phone match the voucher record.
3. Customer selects an available session.
4. System checks session capacity.
5. System checks voucher remaining credit.
6. System creates a booking reference number.
7. System sends a booking confirmation email containing the booking reference and booking QR code.

Important: Booking reserves a slot, so the available slot count must decrease immediately once the booking is created.

Credit is not deducted during booking.

BOOKING STATUS VALUES

Use these booking statuses:

* Reserved
* Balance Due
* Cancelled by Customer
* Released to Walk-in
* No Show
* Checked In
* Completed / Consumed
* Walk-in Confirmed

BALANCE DUE LOGIC

If the voucher has enough remaining credit for the selected session, the booking status is Reserved.

Example:

* Voucher balance: 5 hours
* Session duration: 2 hours
* Booking status: Reserved

If the voucher does not have enough credit, still allow the booking, but mark it as Balance Due.

Example:

* Voucher balance: 2 hours
* Beginner session duration: 3 hours
* Shortage: 1 hour
* Fixed hourly rate: PHP 300/hour
* Balance due: PHP 300
* Booking status: Balance Due

Use a fixed hourly rate of PHP 300/hour for shortage payments.

The Balance Due booking still reduces the available slot count.

The customer cannot be checked in until the balance due is marked as paid by the receptionist or admin.

If the balance due is paid, the check-in can proceed. At check-in, deduct all remaining voucher hours applicable to the booking, and record the extra paid amount separately.

CANCELLATION RULES

Customers can cancel their booking up to 2 hours before the session start time.

Cancellation requires:

* Booking reference number
* Email
* Phone number

If cancellation is successful:

* Booking status becomes Cancelled by Customer
* The reserved slot is released back to available capacity
* No credit refund is needed because credit was not deducted during booking

If cancellation is attempted less than 2 hours before the session start time, deny cancellation and show a message that cancellation is only allowed up to 2 hours before the session.

CHECK-IN RULES

Credit is deducted at check-in time, not during booking.

Receptionist check-in flow:

1. Receptionist scans or enters the voucher code.
2. System displays voucher details:

   * Customer name
   * Plan name
   * Voucher status
   * Remaining credit hours
   * Related bookings for today
3. Receptionist scans or enters the booking reference number.
4. System validates:

   * Voucher exists
   * Voucher is active
   * Booking reference exists
   * Booking belongs to the same customer/voucher
   * Booking is for today
   * Booking is not cancelled
   * Booking is not already checked in or consumed
   * Booking is within the valid check-in window
   * Balance due is already paid, if applicable
5. Receptionist confirms check-in.
6. System deducts the correct number of hours from the voucher.
7. System records a credit transaction.
8. Booking status becomes Checked In or Completed / Consumed.
9. Attendance record is created.

CHECK-IN WINDOW AND WALK-IN RULE

For a 9:00 AM workshop example:

* 8:30 AM: Staff starts calling reserved customers.
* 8:30 AM to 8:50 AM: Reserved customers are prioritized.
* 8:50 AM: Reserved slots not yet claimed may be released to walk-ins.
* 9:00 AM: Workshop starts.
* After 9:00 AM: Late reserved customers may no longer be accommodated.

General rule:

* Check-in opens 30 minutes before session start.
* Reserved slots are protected until 10 minutes before session start.
* At 10 minutes before session start, unclaimed reserved slots may be marked Released to Walk-in.
* Late customers after the session starts may be marked No Show or Cancelled according to staff action.
* Credits are not deducted for No Show or Released to Walk-in bookings.

WALK-IN FLOW

Receptionist can process walk-ins.

Walk-in process:

1. Receptionist selects Walk-in Check-in.
2. Receptionist scans or enters voucher code.
3. System validates voucher and customer.
4. Receptionist selects today’s session.
5. System checks if there are available or released slots.
6. If voucher has enough credit, receptionist confirms attendance and system deducts credit immediately.
7. If voucher has insufficient credit, system calculates shortage based on PHP 300/hour.
8. Receptionist manually marks additional payment as paid.
9. System confirms walk-in attendance.
10. System creates a walk-in booking and attendance record.

Walk-in bookings should have status Walk-in Confirmed.

PUBLIC CUSTOMER PAGES

Create these public pages:

1. Home Page

* Brief description of the 3D Printing Workshop
* Show available plans
* Buttons for Request Plan, Voucher Lookup, Book Session, Cancel Booking, and Booking Status

2. Buy Plan / Request Plan Page
   Fields:

* Customer full name
* Email
* Phone number
* Selected plan: Basic, Plus, Advanced
* Notes, optional

Behavior:

* Customer submits request only.
* No payment upload is needed.
* Request status starts as Pending Payment.
* Admin will manually mark payment as paid.
* Once admin marks as paid, system generates voucher and sends email.

3. Voucher Lookup Page
   Fields:

* Voucher code
* Email
* Phone number

Display:

* Customer name, partially masked if possible
* Plan name
* Total credit hours
* Remaining credit hours
* Voucher status
* Upcoming bookings
* Attended sessions
* Credit usage history
* Balance due records, if any

Do not display sensitive admin notes or full payment details.

4. Book Session Page
   Fields:

* Voucher code
* Email
* Phone number
* Session date
* Available session list
* Selected session

Behavior:

* Validate voucher and customer contact info.
* Show available sessions and remaining slots.
* Show session duration.
* Show current voucher remaining hours.
* If enough credit, create Reserved booking.
* If insufficient credit, calculate balance due and create Balance Due booking.
* Generate booking reference number and QR code.
* Send booking confirmation email.

5. Cancel Booking Page
   Fields:

* Booking reference number
* Email
* Phone number

Behavior:

* Allow cancellation only up to 2 hours before session start.
* Release slot after cancellation.
* Send cancellation confirmation email.

6. Booking Status Page
   Fields:

* Booking reference number
* Email
* Phone number

Display:

* Booking status
* Session category
* Date and time
* Duration
* Balance due, if any
* Voucher code, partially masked
* QR code if appropriate

ADMIN DASHBOARD

Admin must be able to:

1. Login securely.

2. View dashboard summary:

   * Pending plan requests
   * Active vouchers
   * Today’s sessions
   * Today’s bookings
   * Balance due bookings
   * Checked-in customers
   * No shows
   * Available slots

3. Manage plan requests:

   * View request details
   * Mark payment as paid manually
   * Reject request
   * Generate voucher after payment is marked paid
   * Send voucher email automatically

4. Manage plans:

   * Create/edit/delete plans
   * Set plan name
   * Set credit hours
   * Set price
   * Set description
   * Activate/deactivate plans

5. Manage vouchers:

   * Search vouchers
   * View customer details
   * View remaining balance
   * View usage history
   * Manually adjust credit
   * Suspend/cancel voucher
   * Create special/custom voucher manually

6. Manage sessions:

   * Create sessions
   * Edit sessions
   * Set category: Beginner, Intermediate, Advanced
   * Set date and time
   * Set duration
   * Set capacity, default maximum 20
   * Open/cancel/complete sessions

7. Manage bookings:

   * View all bookings
   * Filter by date, session, status, customer, voucher
   * View balance due bookings
   * Mark balance due as paid
   * Cancel booking manually
   * Mark no show
   * Release slot to walk-in
   * Export booking records if possible

8. Manage credit transactions:

   * View credit additions
   * View credit deductions
   * View manual adjustments
   * View balance due payments
   * View walk-in transactions

9. Manage staff accounts:

   * Admin users
   * Receptionist users
   * Role-based permissions

RECEPTIONIST MODULE

Receptionist must have a dedicated page/dashboard.

Features:

* Search or scan voucher code
* Search or scan booking reference number
* View today’s sessions
* View reserved customers
* View checked-in customers
* View unclaimed reserved slots
* Release unclaimed slots 10 minutes before session start
* Process check-in
* Process balance due payment manually
* Process walk-ins
* Mark no show
* Prevent duplicate check-in

QR CODE REQUIREMENTS

Generate QR codes for:

1. Voucher code
2. Booking reference number

Voucher QR code should be included in the voucher approval email.

Booking QR code should be included in the booking confirmation email.

Receptionist should be able to scan QR codes or manually enter the code.

EMAIL NOTIFICATIONS

Create email notifications for:

1. Plan request received

* Sent after customer submits request

2. Voucher approved / payment marked paid

* Sent after admin marks payment as paid
* Include:

  * Customer name
  * Plan name
  * Total credit hours
  * Voucher code
  * Voucher QR code
  * Link to voucher lookup page
  * Reminder that credits are consumed only during physical check-in

3. Booking confirmation

* Include:

  * Booking reference number
  * Booking QR code
  * Voucher code, partially masked
  * Session category
  * Date and time
  * Duration
  * Booking status: Reserved or Balance Due
  * Balance due amount if applicable

4. Booking cancellation confirmation

5. Check-in confirmation / credit deduction notice

* Include:

  * Session attended
  * Hours deducted
  * Remaining voucher balance

DATABASE MODELS

Create database models/tables similar to the following:

1. StaffUser

* id
* name
* email
* password_hash
* role: admin or receptionist
* status
* created_at
* updated_at

2. Plan

* id
* name
* description
* price
* credit_hours
* is_active
* created_at
* updated_at

3. PlanRequest

* id
* customer_name
* customer_email
* customer_phone
* selected_plan_id
* status: Pending Payment, Paid, Rejected
* admin_notes
* created_at
* updated_at

4. Voucher

* id
* voucher_code
* qr_code_url or qr_code_data
* customer_name
* customer_email
* customer_phone
* plan_id
* source_plan_request_id
* total_credit_hours
* remaining_credit_hours
* status: Active, Fully Used, Suspended, Cancelled
* created_at
* updated_at

5. WorkshopSession

* id
* category: Beginner, Intermediate, Advanced
* session_date
* start_time
* end_time
* duration_hours
* capacity
* available_slots
* status: Open, Full, Cancelled, Completed
* notes
* created_at
* updated_at

6. Booking

* id
* booking_reference
* booking_qr_code_url or booking_qr_code_data
* voucher_id
* session_id
* customer_name
* customer_email
* customer_phone
* status
* session_duration_hours
* credit_hours_to_deduct
* balance_due_hours
* balance_due_amount
* balance_due_paid
* checked_in_at
* cancelled_at
* created_at
* updated_at

7. CreditTransaction

* id
* voucher_id
* booking_id, nullable
* transaction_type: Credit Added, Credit Deducted, Manual Adjustment, Balance Due Payment
* hours_added
* hours_deducted
* amount_paid
* description
* created_by_staff_id
* created_at

8. Attendance

* id
* booking_id
* voucher_id
* session_id
* check_in_method: Voucher QR, Manual Entry, Walk-in
* checked_in_by_staff_id
* checked_in_at
* notes

9. SystemSetting

* id
* setting_key
* setting_value

Default system settings:

* fixed_hourly_rate = 300
* cancellation_cutoff_hours = 2
* check_in_opens_minutes_before_start = 30
* release_reserved_slots_minutes_before_start = 10
* default_session_capacity = 20

IMPORTANT BUSINESS RULES

1. Customers do not log in.
2. Customers access information using voucher code, email, and phone number.
3. Admin and receptionist must log in.
4. Each plan purchase creates a new voucher.
5. Credits do not expire.
6. Credits are not deducted during booking.
7. Credits are deducted during receptionist check-in.
8. Bookings reduce available slot count immediately.
9. Balance Due bookings are allowed and still reserve slots.
10. Balance Due must be paid before check-in.
11. Fixed shortage rate is PHP 300/hour.
12. Customers can cancel only up to 2 hours before session start.
13. Session capacity is maximum 20 slots.
14. Each session category happens only once per day.
15. Walk-ins can be accepted when slots are available or released.
16. Unclaimed reserved slots can be released 10 minutes before session start.
17. Prevent duplicate check-in and duplicate credit deduction.
18. Maintain full transaction history for all credit changes.
19. Keep public customer pages privacy-safe.

UI DESIGN REQUIREMENTS

Use a clean, modern dashboard style suitable for a workshop/business system.

Suggested design:

* White or light background
* Blue, gray, and subtle accent colors
* Clear cards for plans, vouchers, and sessions
* Tables for admin data
* Status badges for Reserved, Balance Due, Checked In, Cancelled, No Show
* Mobile-responsive public pages
* Desktop-friendly admin dashboard
* Simple receptionist scan/check-in interface with large buttons and clear validation messages

VALIDATION REQUIREMENTS

Add validation for:

* Required fields
* Valid email format
* Valid phone format
* Duplicate voucher code prevention
* Duplicate booking reference prevention
* Booking capacity limit
* Cannot book cancelled/full sessions
* Cannot cancel less than 2 hours before session
* Cannot check in cancelled/no-show bookings
* Cannot check in if balance due is unpaid
* Cannot deduct more credit than remaining voucher balance
* Cannot check in the same booking twice

SAMPLE SEED DATA

Create default seed data:

Plans:

* Basic Plan: 12 hours
* Plus Plan: 24 hours
* Advanced Plan: 36 hours

Sessions:

* Beginner: 2 hours, 20 slots
* Intermediate: 4 hours, 20 slots
* Advanced: 6 hours, 20 slots

System setting:

* Fixed hourly rate: PHP 300/hour

DELIVERABLE

Build the complete web application with:

* Frontend public customer pages
* Admin dashboard
* Receptionist dashboard
* Backend API
* Database models
* Authentication for admin/receptionist
* Voucher generation
* QR code generation
* Booking reference generation
* Email notification logic
* Credit transaction logic
* Check-in and walk-in logic
* Balance due logic
* Cancellation logic
* Seed data
* Clear setup instructions

Prioritize correctness of business logic, especially credit deduction, booking status, balance due, QR validation, and prevention of duplicate check-ins.

# Admission Slip Notification System

## Overview
When a student requests an admission slip, the admin automatically receives a notification in the admin dashboard.

## How It Works

### 1. **Student Requests Admission Slip**
- Student fills out the admission slip form
- Submits the request via `StudentAdmissionSlipController@store`

### 2. **Notification is Sent**
- The `StudentAdmissionSlipController` sends a notification to all admins
- Uses the `AdmissionSlipRequested` notification class
- Notification is stored in the database

### 3. **Admin Receives Notification**
- Admin dashboard fetches recent notifications
- Notifications appear in the bell icon dropdown
- Badge shows the count of unread notifications

## Files Modified

### Backend
1. **app/Http/Controllers/AdminDashboardController.php**
   - Added notification fetching logic
   - Retrieves up to 10 recent notifications for the logged-in admin
   - Maps notification data to frontend format
   - Passes `recentNotifications` to the frontend

2. **app/Notifications/AdmissionSlipRequested.php**
   - Added `title` field: "New Admission Slip Request"
   - Added `subtitle` field: Shows student name and case text
   - Maintains all existing notification data

### Frontend
- **resources/js/pages/admin-dashboard/admin-header.tsx**
  - Already configured to display notifications
  - Shows notification count badge
  - Displays "View Request" button for admission slip notifications
  - Marks notifications as read when bell is clicked

## Notification Data Structure

```php
[
    'id' => 'notification-id',
    'type' => 'admission_slip_requested',
    'title' => 'New Admission Slip Request',
    'subtitle' => 'From John Doe - Medical Excuse',
    'timeAgo' => '2 minutes ago',
]
```

## Features

✅ **Real-time Notifications** - Admins see notifications immediately
✅ **Notification Count** - Badge shows number of unread notifications
✅ **Mark as Read** - Badge disappears when admin clicks the bell
✅ **Action Button** - "View Request" button links to admission slip page
✅ **Notification History** - Shows up to 10 recent notifications
✅ **Clean UI** - Simple, minimal notification dropdown

## Testing

1. Log in as a student
2. Request an admission slip
3. Log in as an admin
4. Check the bell icon in the header
5. You should see the notification with:
   - Title: "New Admission Slip Request"
   - Subtitle: Student name and case text
   - "View Request" button

## Database Requirements

- `notifications` table (Laravel default)
- `admission_slips` table with `student_name` and `case_text` columns

## Future Enhancements

- Add notification preferences (email, SMS, etc.)
- Add notification filtering by type
- Add notification archiving
- Add real-time notifications using WebSockets

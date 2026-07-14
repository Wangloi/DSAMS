# Quick Test - Admission Slip Notifications

## Step 1: Check if Admin Exists
```bash
php artisan tinker
>>> App\Models\AdminUser::count()
```

**Expected:** Should return a number > 0

If it returns 0, create an admin:
```bash
>>> App\Models\AdminUser::create([
    'name' => 'Test Admin',
    'email' => 'admin@test.com',
    'password' => bcrypt('password123'),
])
```

## Step 2: Check Notifications Table
```bash
>>> DB::table('notifications')->count()
```

**Expected:** Should return 0 initially (no notifications yet)

## Step 3: Create a Test Admission Slip
```bash
>>> $student = App\Models\Student::first()
>>> $slip = App\Models\AdmissionSlip::create([
    'student_id' => $student->id,
    'student_name' => $student->name,
    'program_year_level' => $student->course . ' ' . $student->year_level,
    'date_issued' => now()->toDateString(),
    'case_text' => 'Medical Excuse',
    'reason_text' => 'Doctor Appointment',
    'valid_until' => now()->addDays(7)->toDateString(),
    'status' => 'PENDING',
    'is_archived' => false,
])
```

## Step 4: Send Notification Manually
```bash
>>> $admin = App\Models\AdminUser::first()
>>> $admin->notify(new App\Notifications\AdmissionSlipRequested($slip))
```

## Step 5: Check if Notification Was Created
```bash
>>> DB::table('notifications')->count()
>>> DB::table('notifications')->latest()->first()
```

**Expected:** 
- Count should be 1
- The notification should have the slip data in the `data` column

## Step 6: Check Middleware
```bash
>>> $admin->notifications()->count()
>>> $admin->notifications()->latest()->first()
```

**Expected:** Should return 1 notification with the admission slip data

## Step 7: Test in Browser
1. Log out
2. Log in as the admin
3. Go to admin dashboard
4. Check if notification appears in the bell icon

## If Notifications Still Don't Appear

Check the logs:
```bash
tail -f storage/logs/laravel.log
```

Look for:
- `Unread notifications count` - Should show count > 0
- `Fetched notifications` - Should show count > 0
- Any error messages

## Common Issues

### Issue: "No admins found to notify"
- Create an admin user (see Step 1)

### Issue: Notification created but not showing
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors (F12)

### Issue: Middleware not fetching notifications
- Check if you're logged in as admin
- Check if the admin guard is being used
- Look for errors in logs

## Success Indicators

✅ Admin user exists
✅ Notification table exists
✅ Notification is created in database
✅ Middleware fetches notification
✅ Notification appears in UI
✅ Notification persists across pages

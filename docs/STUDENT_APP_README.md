# 📱 Student App (Android) - Complete Documentation

## Overview

**Role**: Field Execution
**Platform**: Android Mobile App (Expo/React Native)
**Access Level**: View assigned inspections and submit reports

---

## 🎯 Core Responsibilities

### 1. View Assignments
- See inspection tasks assigned to their team
- View task details and requirements
- Check due dates and priorities

### 2. Conduct Inspections
- Visit government offices physically
- Fill inspection forms
- Rate various parameters
- Document issues and complaints

### 3. Photo Documentation
- Capture photos using device camera
- Upload multiple photos per inspection
- Add captions to photos

### 4. Submit Reports
- Complete all required fields
- Review before submission
- Submit inspection reports
- Get confirmation

### 5. Track Status
- View submission status
- See office responses
- Track inspection progress
- View inspection history

---

## 🌟 Features

### Authentication
- **Login Screen**:
  - Email and password fields
  - Remember me checkbox
  - Google Sign-In button
  - Forgot password link
- **Signup Screen**:
  - Name, email, phone, password
  - School selection
  - Grade/Class
- **Password Reset**:
  - Email verification
  - Reset link

### Home/Dashboard
- **Header**:
  - Student name and photo
  - School name
  - Team name
- **Stats Cards**:
  - Assigned inspections (count)
  - Completed inspections (count)
  - Pending inspections (count)
- **Assigned Inspections List**:
  - Card view for each inspection
  - Office name and type
  - Due date with countdown
  - Priority badge
  - Status indicator
  - "Start Inspection" button
- **Pull to Refresh**: Refresh inspection list

### Inspection Detail
- **Office Information**:
  - Office name and type
  - Full address
  - Contact information
  - Map view (optional MVP)
- **Task Information**:
  - Task name and description
  - Assigned date and due date
  - Template information
  - Priority level
- **Team Information**:
  - Team name
  - Team members
  - Team leader
- **Action Button**:
  - "Start Inspection" (if not started)
  - "Continue" (if in progress)
  - "View Report" (if submitted)

### Inspection Form
- **Dynamic Form Fields** (based on template):
  - **Rating Fields**:
    - Star rating (1-5)
    - Labels for each rating
  - **Text Fields**:
    - Single line input
    - Character limit
  - **Multiline Fields**:
    - Textarea
    - Character counter
  - **Required Field Indicators**: Red asterisk
- **Photo Section**:
  - "Add Photo" button
  - Photo grid view
  - Delete photo option
  - Photo caption input
- **Progress Indicator**: Show completion percentage
- **Auto-Save**: Save draft locally
- **Navigation**:
  - Back button (confirm before leaving)
  - Next/Previous buttons

### Photo Capture
- **Camera Interface**:
  - Full-screen camera view
  - Capture button
  - Switch camera (front/back)
  - Flash toggle
- **Photo Preview**:
  - Preview captured photo
  - Retake button
  - Use button
  - Add caption
- **Gallery Access**:
  - Choose from existing photos
  - Multiple selection
- **Permissions Handling**:
  - Request camera permission
  - Request storage permission
  - Clear permission messages

### Review & Submit
- **Review Screen**:
  - Display all filled fields
  - Show all photos
  - Edit button for each section
- **Validation**:
  - Check required fields
  - Minimum photo requirement
  - Field format validation
- **Submit Button**:
  - Large, prominent button
  - Loading indicator during submission
- **Confirmation Dialog**:
  - "Are you sure?" message
  - Confirm and Cancel buttons
- **Success Screen**:
  - Success message
  - Submission summary
  - "View Inspections" button
  - "Go Home" button

### History
- **Completed Inspections List**:
  - Card view
  - Office name
  - Submission date
  - Status (Submitted, Responded, Closed)
  - "View Details" button
- **Filter Options**:
  - All, This Month, Last Month
- **Search**: Search by office name
- **Inspection Details**:
  - Show submitted report
  - Show office response
  - Show govt review
  - Timeline view

### Profile
- **Profile Information**:
  - Profile photo (with edit)
  - Name
  - Email
  - Phone
  - School name
  - Team name
  - Grade/Class
- **Statistics**:
  - Total inspections
  - Completed count
  - Success rate
  - Average rating given
- **Actions**:
  - Edit profile
  - Change password
  - Logout

### Notifications
- **Notification List**:
  - New assignment notifications
  - Office response notifications
  - Due date reminders
  - System announcements
- **Badge Count**: Unread notifications count
- **Mark as Read**: Tap to mark read
- **Clear All**: Clear all notifications

### Settings
- **Notification Preferences**:
  - Push notifications toggle
  - Email notifications toggle
  - Reminder frequency
- **App Preferences**:
  - Language selection
  - Theme (Light/Dark)
- **About**:
  - App version
  - Terms of service
  - Privacy policy

---

## 📱 UI Screens

### Screen List
1. **Splash Screen** (`app/_layout.tsx`)
2. **Login** (`app/auth/login.tsx`)
3. **Signup** (`app/auth/signup.tsx`)
4. **Forgot Password** (`app/auth/forgot-password.tsx`)
5. **Home/Dashboard** (`app/(tabs)/index.tsx`)
6. **Inspection Detail** (`app/inspection/[id].tsx`)
7. **Inspection Form** (`app/inspection/form/[id].tsx`)
8. **Photo Capture** (`app/inspection/photo.tsx`)
9. **Review & Submit** (`app/inspection/review/[id].tsx`)
10. **Success Screen** (`app/inspection/success.tsx`)
11. **History** (`app/(tabs)/history.tsx`)
12. **History Detail** (`app/history/[id].tsx`)
13. **Profile** (`app/(tabs)/profile.tsx`)
14. **Edit Profile** (`app/profile/edit.tsx`)
15. **Change Password** (`app/profile/change-password.tsx`)
16. **Notifications** (`app/notifications.tsx`)
17. **Settings** (`app/settings.tsx`)

---

## 🗂️ Files to Create

### Project Structure
```
frontend/
├── app/
│   ├── _layout.tsx                    # Root layout
│   ├── index.tsx                      # Redirect to auth or tabs
│   ├── auth/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab navigator
│   │   ├── index.tsx                  # Home/Dashboard
│   │   ├── history.tsx                # History list
│   │   └── profile.tsx                # Profile
│   ├── inspection/
│   │   ├── [id].tsx                   # Inspection detail
│   │   ├── form/
│   │   │   └── [id].tsx               # Inspection form
│   │   ├── photo.tsx                  # Photo capture
│   │   ├── review/
│   │   │   └── [id].tsx               # Review screen
│   │   └── success.tsx                # Success screen
│   ├── history/
│   │   └── [id].tsx                   # History detail
│   ├── profile/
│   │   ├── edit.tsx                   # Edit profile
│   │   └── change-password.tsx        # Change password
│   ├── notifications.tsx              # Notifications
│   └── settings.tsx                   # Settings
├── components/
│   ├── InspectionCard.tsx             # Inspection card
│   ├── StatCard.tsx                   # Stat card
│   ├── PhotoGrid.tsx                  # Photo grid
│   ├── RatingInput.tsx                # Star rating
│   ├── FormField.tsx                  # Dynamic form field
│   ├── ProgressBar.tsx                # Progress indicator
│   ├── StatusBadge.tsx                # Status badge
│   ├── LoadingSpinner.tsx             # Loading
│   └── EmptyState.tsx                 # Empty state
├── contexts/
│   ├── AuthContext.tsx                # Auth state
│   └── InspectionContext.tsx          # Inspection state
├── services/
│   ├── api.ts                         # Axios instance
│   ├── authService.ts                 # Auth API calls
│   ├── inspectionService.ts           # Inspection API calls
│   └── storageService.ts              # AsyncStorage
├── hooks/
│   ├── useAuth.ts                     # Auth hook
│   ├── useInspections.ts              # Inspections hook
│   └── useCamera.ts                   # Camera hook
├── utils/
│   ├── validators.ts                  # Form validation
│   ├── imageHelpers.ts                # Image processing
│   ├── dateHelpers.ts                 # Date formatting
│   └── constants.ts                   # Constants
├── types/
│   ├── inspection.ts                  # Types
│   ├── user.ts
│   └── navigation.ts
└── assets/
    ├── images/
    └── icons/
```

---

## 🚀 Development Phases

### Phase 1: Project Setup & Authentication (Week 1)
**Goal**: Set up Expo project and implement authentication

**Tasks**:
1. Initialize Expo project with TypeScript
2. Set up folder structure
3. Install dependencies:
   - expo-router
   - axios
   - @react-native-async-storage/async-storage
   - expo-image-picker
   - expo-camera
4. Create API service layer
5. Implement AuthContext
6. Build Login screen
7. Build Signup screen
8. Implement JWT token storage

**Testing**:
- User can register
- User can login
- Token is stored
- Protected routes work

---

### Phase 2: Dashboard & Navigation (Week 2)
**Goal**: Create main navigation and dashboard

**Tasks**:
1. Set up tab navigation
2. Create dashboard layout
3. Fetch assigned inspections
4. Display inspection cards
5. Add pull-to-refresh
6. Add stat cards
7. Implement navigation to detail

**Testing**:
- Dashboard loads inspections
- Pull-to-refresh works
- Navigation works
- Loading states display

---

### Phase 3: Inspection Detail & Form (Week 3)
**Goal**: Build inspection detail and form screens

**Tasks**:
1. Create inspection detail screen
2. Fetch inspection details from API
3. Display office and task information
4. Build dynamic form renderer
5. Implement rating input
6. Implement text inputs
7. Add form validation
8. Save draft to local storage

**Testing**:
- Inspection details load
- Form renders correctly
- Inputs work properly
- Validation works
- Draft saving works

---

### Phase 4: Photo Capture & Upload (Week 4)
**Goal**: Implement photo capture and upload

**Tasks**:
1. Request camera permissions
2. Implement camera screen
3. Capture photo functionality
4. Photo preview
5. Convert to base64
6. Add photo to form
7. Photo grid display
8. Delete photo functionality

**Testing**:
- Camera opens
- Photos capture correctly
- Photos convert to base64
- Photos display in grid
- Can delete photos

---

### Phase 5: Review & Submission (Week 5)
**Goal**: Complete submission flow

**Tasks**:
1. Create review screen
2. Display all form data
3. Display all photos
4. Add edit functionality
5. Implement submit API call
6. Handle submission errors
7. Create success screen
8. Clear draft after submission

**Testing**:
- Review shows all data
- Can edit before submit
- Submission works
- Success screen displays
- Can navigate after success

---

### Phase 6: History & Status Tracking (Week 6) ✅ COMPLETE
**Goal**: Add history and status tracking

**Tasks**:
1. ✅ Create history screen with filters and search
2. ✅ Fetch completed inspections
3. ✅ Display history list
4. ✅ Add filter functionality (All, This Week, This Month, Last Month)
5. ✅ Create history detail screen
6. ✅ Show office response
7. ✅ Show govt review
8. ✅ Add timeline view

**Testing**:
- ✅ History loads correctly
- ✅ Filters work
- ✅ Can view details
- ✅ All data displays

**Files Created/Updated**:
- `/app/frontend/app/(tabs)/history.tsx` - Enhanced with filters and search
- `/app/frontend/app/history/[id].tsx` - New detail screen with timeline

---

### Phase 7: Profile & Settings (Week 7) ✅ COMPLETE
**Goal**: Complete profile and settings

**Tasks**:
1. ✅ Create profile screen with statistics
2. ✅ Display user information
3. ✅ Show statistics (total, completed, pending, success rate)
4. ✅ Create edit profile screen
5. ✅ Update profile API (backend)
6. ✅ Change password screen
7. ✅ Create settings screen
8. ✅ Implement logout

**Testing**:
- ✅ Profile loads correctly
- ✅ Can edit profile
- ✅ Password change works
- ✅ Settings save
- ✅ Logout clears data

**Files Created/Updated**:
Backend:
- `/app/backend/models/user.py` - Added UserUpdate, ChangePassword, UserStats models
- `/app/backend/routes/auth.py` - Added profile update, change password, and stats endpoints

Frontend:
- `/app/frontend/app/(tabs)/profile.tsx` - Enhanced with statistics
- `/app/frontend/app/profile/edit.tsx` - New edit profile screen
- `/app/frontend/app/profile/change-password.tsx` - New change password screen
- `/app/frontend/app/settings.tsx` - New settings screen
- `/app/frontend/services/api.ts` - Added profile and stats API calls

---

### Phase 8: Notifications & Polish (Week 8) ✅ COMPLETE
**Goal**: Add notifications and polish UI

**Tasks**:
1. ✅ Create notification screen
2. ✅ Fetch notifications
3. ✅ Mark as read
4. ✅ Add badge count
5. ✅ UI polish and refinements
6. ✅ Add loading states
7. ✅ Error handling
8. ✅ Offline handling

**Testing**:
- ✅ Notifications load
- ✅ Badge count updates
- ✅ UI is polished
- ✅ Errors handled gracefully

**Files Created/Updated**:
Backend:
- `/app/backend/models/notification.py` - New notification model
- `/app/backend/routes/notifications.py` - New notifications router
- `/app/backend/server.py` - Registered notifications router

Frontend:
- `/app/frontend/app/notifications.tsx` - New notifications screen
- `/app/frontend/types/index.ts` - Added Notification and UserStats types
- `/app/frontend/services/api.ts` - Added notifications API calls

---

## ✅ Implementation Status Summary

All 8 phases are now complete:
- ✅ Phase 1: Project Setup & Authentication
- ✅ Phase 2: Dashboard & Navigation
- ✅ Phase 3: Inspection Detail & Form
- ✅ Phase 4: Photo Capture & Upload
- ✅ Phase 5: Review & Submission
- ✅ Phase 6: History & Status Tracking
- ✅ Phase 7: Profile & Settings
- ✅ Phase 8: Notifications & Polish

The Student Governance System mobile app is now feature-complete with:
- Complete authentication system
- Dashboard with inspection management
- Dynamic inspection forms with photo capture
- History tracking with detailed views and timeline
- Profile management with statistics
- Settings and notifications
- Polished UI with loading states and error handling

---

## 📝 Development Prompts

### Prompt 1: Expo Project Setup
```
Set up a new Expo project for the Student Governance Android app:

1. Use the existing Expo template at /app/frontend
2. Configure expo-router for file-based routing
3. Install dependencies:
   - axios
   - @react-native-async-storage/async-storage
   - expo-image-picker
   - expo-camera
   - @react-navigation/native
   - react-native-gesture-handler

4. Create folder structure:
   - app/
   - components/
   - services/
   - contexts/
   - hooks/
   - utils/
   - types/

5. Set up environment variables in .env:
   - EXPO_PUBLIC_API_URL

6. Create basic API service with axios

7. Test: App runs on Expo Go
```

### Prompt 2: Authentication System
```
Implement complete authentication:

1. Create AuthContext in contexts/AuthContext.tsx:
   - State: user, token, isAuthenticated, isLoading
   - Functions: login, signup, logout, loadUser
   - Store token in AsyncStorage

2. Create authService in services/authService.ts:
   - login(email, password)
   - signup(name, email, password, school_id, grade)
   - getCurrentUser(token)

3. Build login screen in app/auth/login.tsx:
   - Email input
   - Password input
   - Login button
   - Sign up link
   - Google sign in (placeholder)

4. Build signup screen in app/auth/signup.tsx:
   - Name, email, phone, password inputs
   - School dropdown
   - Grade input
   - Signup button

5. Use React Native components:
   - View, Text, TextInput, TouchableOpacity
   - KeyboardAvoidingView
   - SafeAreaView

6. Style with StyleSheet.create()

Test: Login and signup work, token is stored.
```

### Prompt 3: Dashboard Screen
```
Create the main dashboard:

1. Set up tab navigation in app/(tabs)/_layout.tsx:
   - Home tab
   - History tab
   - Profile tab
   - Use @expo/vector-icons for icons

2. Create dashboard in app/(tabs)/index.tsx:
   - Header with student name and photo
   - Stat cards (3 cards):
     - Assigned count
     - Completed count
     - Pending count
   - Inspection list (FlatList)
   - Pull-to-refresh

3. Create InspectionCard component:
   - Office name and type
   - Due date
   - Priority badge
   - Status indicator
   - "Start" button

4. Create inspectionService:
   - getAssignedInspections(teamId)
   - getInspectionDetail(id)

5. Fetch data using useEffect

6. Add loading spinner

Test: Dashboard loads, inspections display, refresh works.
```

### Prompt 4: Inspection Detail & Form
```
Build inspection detail and form:

1. Inspection detail screen (app/inspection/[id].tsx):
   - Office information card
   - Task information card
   - Team information card
   - "Start Inspection" button

2. Inspection form screen (app/inspection/form/[id].tsx):
   - Fetch template from API
   - Render dynamic form fields
   - Rating input component (1-5 stars)
   - Text inputs
   - Multiline inputs
   - Required field indicators
   - Progress indicator
   - "Add Photo" button
   - "Next" button

3. Create FormField component:
   - Switch based on field type
   - Render appropriate input

4. Create RatingInput component:
   - 5 star buttons
   - Highlight selected stars

5. Store form data in local state

6. Add form validation

Test: Form renders, inputs work, validation works.
```

### Prompt 5: Camera & Photo Upload
```
Implement photo capture:

1. Request permissions:
   - Camera.requestCameraPermissionsAsync()
   - ImagePicker.requestMediaLibraryPermissionsAsync()

2. Create photo capture screen (app/inspection/photo.tsx):
   - Use expo-camera
   - Full screen camera view
   - Capture button
   - Flash toggle
   - Switch camera button

3. Photo preview:
   - Show captured photo
   - "Retake" button
   - "Use Photo" button
   - Caption input

4. Convert photo to base64:
   - Use FileSystem.readAsStringAsync()
   - Compress image

5. Create PhotoGrid component:
   - Display photos in grid
   - Delete button on each photo

6. Add photos to form state

Test: Camera works, photos capture, convert to base64, display in grid.
```

### Prompt 6: Review & Submit
```
Create review and submission flow:

1. Review screen (app/inspection/review/[id].tsx):
   - Display all form fields with values
   - Display all photos
   - "Edit" button for each section
   - Large "Submit" button at bottom

2. Validation before submit:
   - Check all required fields
   - Check minimum photo count
   - Show error messages

3. Confirmation dialog:
   - "Are you sure you want to submit?"
   - Confirm and Cancel buttons

4. Submit API call:
   - POST /api/inspections/:id/submit-report
   - Body: { report: {...}, photos: [...] }
   - Show loading indicator

5. Success screen (app/inspection/success.tsx):
   - Success icon
   - Success message
   - Submission summary
   - "View Inspections" button
   - "Go Home" button

6. Clear draft from local storage

7. Navigate to home

Test: Review displays correctly, submit works, success screen shows.
```

### Prompt 7: History & Profile
```
Implement history and profile screens:

1. History screen (app/(tabs)/history.tsx):
   - Fetch completed inspections
   - Display list (FlatList)
   - Filter buttons (All, This Month, Last Month)
   - Search bar
   - Status badges

2. History detail (app/history/[id].tsx):
   - Show submitted report
   - Show office response
   - Show govt review
   - Timeline view

3. Profile screen (app/(tabs)/profile.tsx):
   - Profile photo
   - User information
   - Statistics cards
   - Edit profile button
   - Change password button
   - Settings button
   - Logout button

4. Edit profile screen (app/profile/edit.tsx):
   - Editable fields
   - Photo upload
   - Save button

5. Change password screen (app/profile/change-password.tsx):
   - Current password
   - New password
   - Confirm password
   - Submit button

Test: History loads, profile displays, edit works, password change works.
```

### Prompt 8: Final Polish & Testing
```
Complete the app with polish and testing:

1. Notifications screen (app/notifications.tsx):
   - Fetch notifications
   - Display list
   - Badge count
   - Mark as read

2. Settings screen (app/settings.tsx):
   - Notification preferences
   - Theme toggle
   - About section

3. Error handling:
   - Network errors
   - API errors
   - Validation errors
   - Show toast messages

4. Loading states:
   - Add LoadingSpinner component
   - Show during API calls

5. Offline handling:
   - Check network status
   - Show offline message
   - Queue submissions

6. UI polish:
   - Consistent colors
   - Smooth animations
   - Proper spacing
   - Mobile-friendly touch targets

7. End-to-end testing:
   - Complete inspection flow
   - Photo capture and upload
   - Submission
   - View history
   - Edit profile

8. Performance:
   - Optimize images
   - Minimize re-renders
   - Lazy loading

Provide test report with screenshots.
```

---

## 🔒 Access Control

### What Students CAN Do:
- ✅ View inspections assigned to their team
- ✅ Fill inspection forms
- ✅ Capture and upload photos
- ✅ Submit inspection reports
- ✅ View their submission history
- ✅ See office responses
- ✅ Update their profile

### What Students CANNOT Do:
- ❌ View other teams' inspections
- ❌ Edit after submission
- ❌ Create inspection tasks
- ❌ Respond as office
- ❌ Access admin functions
- ❌ Delete submitted reports

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Mobile-First**: Optimized for Android devices
2. **Simple**: Easy to use in field conditions
3. **Fast**: Quick loading and submission
4. **Offline-Ready**: Work without internet (queue submissions)

### Color Scheme
- Primary: Blue (#2563EB)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)
- Text: Gray (#1F2937)

### Typography
- Headings: 20px, 18px, 16px (bold)
- Body: 14px (regular)
- Captions: 12px (light)

### Touch Targets
- Minimum: 44x44 points
- Buttons: 48px height
- Icons: 24x24 points

### Components
- Cards with shadows
- Rounded corners (8px)
- Status badges
- Star ratings
- Photo grids
- Progress bars

---

## 📊 Success Criteria

### Functionality
- [ ] Student can login
- [ ] Dashboard shows assigned inspections
- [ ] Can view inspection details
- [ ] Form renders dynamically
- [ ] Camera captures photos
- [ ] Photos convert to base64
- [ ] Can submit report
- [ ] History shows completed inspections
- [ ] Profile displays correctly
- [ ] Can edit profile

### Performance
- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling
- [ ] No lag in inputs
- [ ] Photos upload quickly

### Usability
- [ ] Intuitive navigation
- [ ] Clear instructions
- [ ] Easy to use forms
- [ ] Large touch targets
- [ ] Works on small screens

---

## 🚀 Deployment

### Development
- Test on Expo Go app
- Use tunnel for testing
- Generate QR code

### Production
- Build APK using EAS Build
- Test on physical devices
- Deploy to Google Play Store (future)

---

**Empowering students to make a difference! 💪**

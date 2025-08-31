# Authentication System Documentation

## Overview
This authentication system provides a flexible user authentication experience with Firebase, allowing users to either create accounts/sign in or continue browsing as guests.

## Features

### 🔐 Authentication Methods
- **Email/Password Sign Up**: Complete registration form with mandatory fields
- **Email/Password Sign In**: Traditional login for existing users
- **Password Reset**: Email-based password recovery for forgotten passwords
- **Guest Mode**: Browse charging stations without creating an account

### 📱 User Experience
- **Login-First Approach**: Users are prompted to sign in or create an account when first opening the app
- **Optional Authentication**: Users can skip authentication and browse as guests
- **Seamless Navigation**: Easy switching between login, signup, and guest modes
- **Password Recovery**: Simple password reset process via email
- **Persistent Sessions**: Authentication state persists across app sessions (when using AsyncStorage)

## Authentication Flow

### 1. Initial App Launch
```
App Opens → Check Auth State → Show Login Screen (if not authenticated/guest)
```

### 2. User Options
- **Sign In**: Use existing email/password credentials
- **Create Account**: Complete signup form with profile information
- **Forgot Password**: Request password reset email
- **Continue as Guest**: Browse charging stations without authentication

### 3. Post-Authentication
```
Authenticated User → Main App (Map, List, Profile)
Guest User → Main App (Map, List, Profile) with limited features
```

## Components

### AuthContext (`src/contexts/AuthContext.tsx`)
Manages global authentication state and provides authentication functions.

**State:**
- `user`: Current authenticated user or null
- `loading`: Authentication state loading indicator
- `isGuest`: Whether user is browsing as guest
- `error`: Authentication error messages

**Functions:**
- `login(email, password)`: Email/password authentication
- `signup(email, password)`: Create new account
- `logout()`: Sign out current user
- `forgotPassword(email)`: Send password reset email
- `continueAsGuest()`: Switch to guest mode
- `resetGuestState()`: Reset guest mode
- `clearError()`: Clear error messages

### LoginScreen (`src/screens/LoginScreen.tsx`)
Primary authentication screen with email/password login.

**Features:**
- Email/password form
- Links to signup and password recovery
- Guest mode option
- Error handling and validation

### SignupScreen (`src/screens/SignupScreen.tsx`)
Comprehensive account creation form.

**Mandatory Fields:**
- First Name
- Last Name
- Email Address
- Password
- Confirm Password

**Optional Fields:**
- Profile Picture (placeholder for future implementation)

**Features:**
- Form validation
- Password visibility toggle
- Navigation back to login

### ForgotPasswordScreen (`src/screens/ForgotPasswordScreen.tsx`)
Password recovery screen for users who forgot their passwords.

**Features:**
- Email input for password reset
- Success state with clear instructions
- Error handling and validation
- Navigation back to login
- Option to try different email

### ProfileScreen (`src/screens/ProfileScreen.tsx`)
User profile management and authentication status.

**Features:**
- Display user information (if authenticated)
- Guest mode information and benefits
- Sign in/sign up prompts for guests
- Logout functionality

## Password Reset System

### How It Works
1. **User Request**: User clicks "Forgot Password?" on login screen
2. **Email Input**: User enters their email address
3. **Reset Email**: Firebase sends password reset link to user's email
4. **Success Confirmation**: User sees confirmation screen with instructions
5. **Email Link**: User clicks link in email to reset password
6. **Password Reset**: User sets new password on Firebase's hosted page

### Security Features
- **Secure Links**: Reset links expire after 1 hour
- **Email Verification**: Only sent to registered email addresses
- **No Password Exposure**: Current password is never revealed
- **Rate Limiting**: Firebase prevents abuse

### User Experience
- **Clear Instructions**: Success screen explains next steps
- **Multiple Options**: Users can go back to login or try different email
- **Helpful Tips**: Guidance about checking spam folders
- **Smooth Navigation**: Easy return to login screen

## Error Handling

### Firebase Error Mapping
The system maps Firebase error codes to user-friendly messages:

- `auth/user-not-found`: "No account found with this email address."
- `auth/wrong-password`: "Incorrect password."
- `auth/invalid-email`: "Invalid email address."
- `auth/weak-password`: "Password should be at least 6 characters long."
- `auth/email-already-in-use`: "An account with this email already exists."
- `auth/too-many-requests`: "Too many failed attempts. Please try again later."
- `auth/network-request-failed`: "Network error. Please check your connection."
- `auth/user-disabled`: "This account has been disabled."
- `auth/operation-not-allowed`: "This operation is not allowed."
- `auth/invalid-credential`: "Invalid email or password."
- `auth/account-exists-with-different-credential`: "An account already exists with the same email address but different sign-in credentials."
- `auth/requires-recent-login`: "This operation requires recent authentication. Please log in again."
- `auth/credential-already-in-use`: "This credential is already associated with a different user account."
- `auth/timeout`: "Request timed out. Please try again."
- `auth/quota-exceeded`: "Quota exceeded. Please try again later."

### User Experience
- Clear error messages displayed below forms
- Automatic error clearing on new attempts
- Graceful fallback for unexpected errors

## Navigation Structure

```typescript
// App.tsx Navigation Flow
{!user && !isGuest ? (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </>
) : (
  <>
    <Stack.Screen name="Main" component={MainTabs} />
    <Stack.Screen name="Details" component={DetailsScreen} />
  </>
)}
```

## Security Features

### Firebase Security
- Secure authentication with Firebase Auth
- Password requirements (minimum 6 characters)
- Email validation
- Secure token management

### Data Protection
- No sensitive data stored locally
- Secure session management
- Automatic token refresh

### Password Reset Security
- Time-limited reset links (1 hour expiration)
- Secure email delivery
- No password exposure during reset process

## Future Enhancements

### Planned Features
- **Profile Picture Upload**: Image picker integration
- **Two-Factor Authentication**: Enhanced security
- **Social Login**: Additional providers (Apple, Facebook)
- **User Preferences**: Personalized settings storage
- **Password Strength Indicator**: Visual feedback during signup

### Technical Improvements
- **Offline Support**: Cache authentication state
- **Biometric Auth**: Fingerprint/Face ID integration
- **Deep Linking**: Direct navigation to specific screens
- **Analytics**: User behavior tracking

## Configuration

### Environment Variables
```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
```

### Dependencies
```json
{
  "firebase": "^12.2.1",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

## Testing

### Authentication Scenarios
1. **New User Signup**: Complete form validation and account creation
2. **Existing User Login**: Email/password authentication
3. **Password Reset**: Email-based password recovery flow
4. **Guest Mode**: Browsing without authentication
5. **Error Handling**: Invalid credentials and network issues
6. **Session Persistence**: App restart authentication state

### Test Cases
- Form validation (required fields, password strength)
- Error message display and clearing
- Navigation between screens
- Authentication state persistence
- Guest mode functionality
- Password reset email flow
- Success state handling

## Troubleshooting

### Common Issues
1. **Authentication State Not Persisting**: Verify AsyncStorage setup
2. **Navigation Errors**: Ensure proper screen registration
3. **Firebase Errors**: Check Firebase project configuration
4. **Password Reset Not Working**: Verify Firebase Auth settings and email templates

### Debug Steps
1. Check Firebase console for authentication logs
2. Test authentication flow in development vs production
3. Verify Firebase Auth password reset settings

## Conclusion

This authentication system provides a solid foundation for user management while maintaining excellent user experience through optional authentication and guest access. The password reset functionality ensures users can easily recover access to their accounts. The system is designed with security, usability, and scalability in mind, focusing on reliable email/password authentication.

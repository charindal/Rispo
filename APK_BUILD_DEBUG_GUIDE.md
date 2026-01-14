# APK Build and Debug Guide

## Problem
When running the APK, the login screen appears but nothing happens when entering credentials.

## Root Cause
The mobile app was not configured with the backend server URL. It was defaulting to `/api` which is a relative URL that only works in web browsers, not in mobile apps.

## Solution Applied

### 1. Environment Configuration
Created `.env.production` and `.env.development` files with the backend API URL:

```bash
REACT_APP_API_URL=http://your-server-ip:8080/api
```

**IMPORTANT:** You MUST update the `.env.production` file with your actual backend server URL before building the APK!

### 2. Enhanced Error Logging
Added comprehensive console logging to `authService.js` to debug:
- API endpoint being called
- Network errors
- Authentication responses
- Token storage

### 3. Network Security Configuration
- Created `network_security_config.xml` to allow HTTP connections (for development)
- Updated `AndroidManifest.xml` to enable cleartext traffic
- Configured Capacitor for proper network handling

### 4. Capacitor Configuration
Updated `capacitor.config.ts` to:
- Allow navigation to external URLs
- Enable mixed content (HTTP + HTTPS)
- Proper Android scheme configuration

## How to Build and Deploy the APK

### Step 1: Update Backend URL
Edit `rispo-app/.env.production` and replace with your server URL:

```bash
# If backend is on your VPS
REACT_APP_API_URL=http://YOUR_VPS_IP:8080/api

# OR if using domain with HTTPS
REACT_APP_API_URL=https://your-domain.com/api

# OR for local network testing (phone and PC on same WiFi)
REACT_APP_API_URL=http://192.168.1.XXX:8080/api
```

### Step 2: Build the React App

```bash
cd rispo-app
npm run build
```

This creates an optimized production build in the `build/` folder.

### Step 3: Sync with Capacitor

```bash
npx cap sync android
```

This copies the web assets to the Android project and updates plugins.

### Step 4: Open in Android Studio

```bash
npx cap open android
```

### Step 5: Build APK in Android Studio

1. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for the build to complete
3. Click "locate" to find the APK file

OR use command line:

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 6: Install on Device

**Via USB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Or transfer the APK to your phone and install manually**

## Debugging the App

### View Console Logs
To see the console.log output from your app:

```bash
# Connect phone via USB and enable USB debugging
adb logcat | grep -E "chromium|Console"
```

Or in Chrome:
1. Open Chrome on your PC
2. Go to `chrome://inspect`
3. Find your app in the list
4. Click "inspect" to see console logs

### Common Issues and Fixes

#### 1. "Network Error" or "Cannot connect"
**Problem:** App can't reach the backend server

**Solutions:**
- Ensure backend is running: `http://your-server:8080/actuator/health`
- Check if phone can reach server (ping from phone's browser)
- If testing locally, use your PC's local IP (not localhost)
- Ensure phone and PC are on same WiFi network
- Check firewall settings on server

#### 2. "CORS Error"
**Problem:** Backend rejecting requests from mobile app

**Solution:** Backend already has CORS configured. If still seeing errors, ensure:
- Backend `WebConfig.java` allows all origins
- Or add your mobile app's origin

#### 3. "Nothing happens" after entering credentials
**Problem:** Silent failure, no error message

**Solutions:**
- Check console logs (see "View Console Logs" above)
- Verify API URL in logs shows correct server address
- Test backend login endpoint directly:
  ```bash
  curl -X POST http://your-server:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  ```

#### 4. SSL/HTTPS Issues
**Problem:** HTTPS certificate errors

**For development:** 
- Use HTTP (already configured)

**For production:**
- Get proper SSL certificate
- Update `.env.production` to use HTTPS URL
- Remove `cleartextTrafficPermitted` from network security config

## Testing Checklist

Before building final APK:

- [ ] Updated `.env.production` with correct backend URL
- [ ] Backend server is running and accessible
- [ ] Tested backend endpoint with curl/Postman
- [ ] Phone can access backend (test in phone's browser)
- [ ] Ran `npm run build` successfully
- [ ] Ran `npx cap sync android`
- [ ] Built APK without errors
- [ ] Installed APK on test device
- [ ] Checked console logs for API URL
- [ ] Verified login with test credentials

## Production Deployment Recommendations

### Security Improvements for Production:

1. **Use HTTPS Only**
   - Get SSL certificate for your domain
   - Update API URL to `https://`
   - Remove HTTP allowances from network config

2. **Remove Cleartext Traffic**
   Edit `network_security_config.xml`:
   ```xml
   <base-config cleartextTrafficPermitted="false">
   ```

3. **Environment-Specific Builds**
   - Keep `.env.development` for local testing
   - Use `.env.production` for release builds
   - Never commit sensitive URLs to git

4. **Signed APK for Release**
   - Generate signing key
   - Build signed release APK
   - Test thoroughly before publishing

## Quick Test Commands

```bash
# Rebuild everything
cd rispo-app
npm run build
npx cap sync android
cd android
./gradlew assembleDebug

# Install on connected device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep -E "AUTH SERVICE|Login"
```

## Need Help?

If login still doesn't work after following this guide:
1. Check console logs (see "View Console Logs" section)
2. Verify backend is accessible from mobile device
3. Test with phone's web browser: `http://your-server:8080/api/actuator/health`
4. Ensure credentials are correct (see TEST_USER_CREDENTIALS.md)

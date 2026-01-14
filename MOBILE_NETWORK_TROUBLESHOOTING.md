# Mobile App Network Connectivity Troubleshooting

## Problem
- ✅ Backend works in browser on PC
- ❌ Mobile app shows: "Network error: Cannot connect to server @ http://135.125.133.211:8080/api"

## Root Cause
Your phone likely **cannot reach the VPS IP address** from its current network. This could be due to:
1. Phone is on mobile data (carrier may block certain ports)
2. VPS firewall blocking connections from certain IPs
3. Network routing issues
4. DNS/connectivity issues

## Diagnostic Steps

### Step 1: Test VPS from Your Phone's Browser

Open your phone's web browser and try to access:
```
http://135.125.133.211:8080/actuator/health
```

**If this works:** The issue is specific to the app configuration
**If this fails:** Your phone cannot reach the VPS at all

### Step 2: Check VPS Firewall

On your VPS, ensure port 8080 is open:

```bash
# Check if port is listening
sudo netstat -tlnp | grep 8080

# Check UFW firewall (if using Ubuntu)
sudo ufw status

# Allow port 8080 if needed
sudo ufw allow 8080/tcp
```

### Step 3: Check Backend is Running

```bash
# SSH into your VPS
ssh ubuntu@135.125.133.211

# Check if backend is running
docker ps | grep rispo
# OR
systemctl status rispo
```

## Solutions

### Option 1: Use Local Network (Recommended for Testing)

If your phone and PC are on the same WiFi:

1. **Find your PC's local IP:**
```powershell
ipconfig
```
Look for "IPv4 Address" (usually 192.168.x.x)

2. **Start backend on your PC:**
```powershell
cd C:\DevCode\Rispo
docker-compose up
# OR
mvn spring-boot:run
```

3. **Update mobile app .env.production:**
```bash
REACT_APP_API_URL=http://192.168.x.x:8080/api
```

4. **Rebuild APK:**
```powershell
.\build-apk.ps1
```

### Option 2: Use Port Forwarding/Tunneling

If VPS is unreachable, create a tunnel:

**Using ngrok (easiest):**
```bash
# On your PC where backend runs
ngrok http 8080
```

This gives you a public URL like: `https://abc123.ngrok.io`

Update `.env.production`:
```bash
REACT_APP_API_URL=https://abc123.ngrok.io/api
```

### Option 3: Use HTTPS with Domain Name

If you have a domain pointing to your VPS:

1. **Set up SSL certificate:**
```bash
# On VPS
sudo certbot --nginx -d yourdomain.com
```

2. **Update .env.production:**
```bash
REACT_APP_API_URL=https://yourdomain.com/api
```

3. **Update network security config** to remove cleartext permission

### Option 4: Debug VPS Network Access

**Check VPS is accessible:**
```powershell
# From your PC
Test-NetConnection -ComputerName 135.125.133.211 -Port 8080

# Or use curl
curl http://135.125.133.211:8080/actuator/health
```

**If PC can access but phone cannot:**
- Mobile carrier may block port 8080
- Try connecting phone to same WiFi as PC
- Try using mobile data vs WiFi (or vice versa)

## Quick Fix: Test with Local Backend

**Fastest way to test if app works:**

1. **Connect phone and PC to same WiFi**

2. **Find your PC's IP:**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -eq "Dhcp"}).IPAddress
```

3. **Start backend on PC:**
```powershell
cd C:\DevCode\Rispo
# Option A: Docker
docker-compose up

# Option B: Maven
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

4. **Update .env.production with your PC's IP:**
```bash
# Example: if your PC IP is 192.168.1.100
REACT_APP_API_URL=http://192.168.1.100:8080/api
```

5. **Rebuild APK:**
```powershell
.\build-apk.ps1
```

6. **Test on phone**

## Verify Mobile App Configuration

Check the console logs to see what URL the app is actually using:

```powershell
# Connect phone via USB with debugging enabled
adb logcat | Select-String "AUTH SERVICE"
```

You should see:
```
AUTH SERVICE - API_BASE_URL: http://135.125.133.211:8080/api
```

## Check Backend Logs

If phone CAN reach VPS but still fails:

```bash
# On VPS
docker logs -f rispo-backend
# OR
journalctl -u rispo -f
```

Look for incoming requests from your phone's IP.

## Common Fixes

### Issue: "Network Error" 
**Cause:** Phone cannot reach server
**Fix:** Use local backend or ngrok tunnel

### Issue: "ERR_CONNECTION_REFUSED"
**Cause:** Backend not running or port closed
**Fix:** Start backend and check firewall

### Issue: "ERR_CONNECTION_TIMED_OUT"
**Cause:** Firewall blocking connection
**Fix:** Open port 8080 on VPS firewall

### Issue: Works on WiFi but not mobile data
**Cause:** Carrier blocking port 8080
**Fix:** 
- Use standard HTTPS port (443)
- Set up reverse proxy with nginx
- Use domain with SSL

## Need More Help?

Run this diagnostic script:

# Hostinger VPS Deployment Guide — AttendoSchool HRMS

This guide walks you through deploying the **AttendoSchool Educational Institution HRMS** onto a **Hostinger VPS** (Ubuntu 22.04 / 24.04 LTS).

---

## 🏛️ Architecture Overview
- **Hostinger VPS:** Runs a high-performance **Nginx** web server serving the optimized React 19 + Vite frontend.
- **Firebase Cloud:** Manages Authentication, Cloud Firestore (Database), and Cloud Storage securely.
- **Client-to-Firebase:** The frontend in the browser connects directly and securely to your Firebase project over HTTPS.

---

## Step 1: Connect to Your Hostinger VPS via SSH
From your local terminal (PowerShell, Command Prompt, or Terminal):
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```
*(Enter your VPS root password when prompted)*

---

## Step 2: Install Node.js 20 LTS, Git, and Nginx
Run this one-line command on your VPS:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Git and Nginx
sudo apt install -y git nginx ufw certbot python3-certbot-nginx

# Install Node.js 20 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node -v    # Should show v20.x
npm -v     # Should show v10.x
nginx -v   # Should show nginx version
```

---

## Step 3: Clone the Repository to the Web Directory
```bash
# Create web directory
sudo mkdir -p /var/www
cd /var/www

# Clone your GitHub repository
git clone https://github.com/Mrinmoypatratint/attendoschool-HRMS.git attendoschool-hrms

# Enter the project directory
cd /var/www/attendoschool-hrms
```

---

## Step 4: Configure Production Environment (`frontend/.env`)
Create the `.env` file for the frontend:
```bash
nano frontend/.env
```
Paste your **real Firebase Web App configuration**:
```env
VITE_USE_EMULATOR=false
VITE_USE_AUTH_EMULATOR=false

VITE_FIREBASE_API_KEY=AIzaSy...your_real_api_key...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_web_app_id
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit).*

---

## Step 5: Install Dependencies and Build the Production Bundle
```bash
cd /var/www/attendoschool-hrms

# Install all workspace dependencies
npm install

# Build the optimized production bundle
npm -w frontend run build
```
The compiled files will now be located at `/var/www/attendoschool-hrms/frontend/dist`.

---

## Step 6: Configure Nginx
Copy the pre-configured Nginx config:
```bash
sudo cp deploy/nginx-hrms.conf /etc/nginx/sites-available/attendoschool-hrms
```

Edit the file to set your domain or VPS IP:
```bash
sudo nano /etc/nginx/sites-available/attendoschool-hrms
```
Change `server_name hrms.yourdomain.com;` to your domain (or your VPS IP address if you don't have a domain yet).

Enable the site and reload Nginx:
```bash
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/attendoschool-hrms /etc/nginx/sites-enabled/

# Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 7: Setup Free SSL Certificate (HTTPS)
If you have pointed your domain (e.g. `hrms.attendoschool.com`) to your Hostinger VPS IP:
```bash
sudo certbot --nginx -d hrms.yourdomain.com
```
Certbot will automatically install the Let's Encrypt SSL certificate and configure HTTPS redirection!

---

## Step 8: Configure Firewall
Allow HTTP, HTTPS, and SSH traffic:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable
```

---

## 🔄 Future Updates / Deployment Script
Whenever you push changes to GitHub, update your VPS with this quick 3-command script:
```bash
cd /var/www/attendoschool-hrms
git pull origin main
npm -w frontend run build
sudo systemctl reload nginx
```
Done! Your live application on Hostinger VPS is updated in seconds.

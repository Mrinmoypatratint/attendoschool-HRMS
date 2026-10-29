# Hostinger VPS Hardening & Production Server Setup

**Domain:** `https://hrms.attendoschool.online`  
**Target OS:** Ubuntu 22.04 / 24.04 LTS (Hostinger VPS)  
**Security Model:** Least-Privilege Deploy User (`deployer`) + Passwordless Sudo restricted to Nginx Reload only  

---

## Step 1: Initial VPS Connection & Package Updates

Log in as `root` to your new Hostinger VPS:
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx curl git ufw
```

---

## Step 2: Create Dedicated Least-Privilege Deploy User

Routine deployments must **never** run as `root`. We create a dedicated user named `deployer`:

```bash
# Create deployer user with home directory and bash shell
sudo adduser --disabled-password --gecos "" deployer

# Create .ssh directory for deployer
sudo mkdir -p /home/deployer/.ssh
sudo chmod 700 /home/deployer/.ssh
```

---

## Step 3: Configure Granular Sudo Access (Nginx Reload Only)

The `deployer` user needs permission to test and reload Nginx upon release activation without giving full root access:

```bash
# Create sudoers rule file
sudo tee /etc/sudoers.d/deployer-nginx << 'EOF'
deployer ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /bin/systemctl reload nginx, /usr/bin/systemctl reload nginx
EOF

sudo chmod 440 /etc/sudoers.d/deployer-nginx
```

---

## Step 4: Prepare Application Directory Hierarchy

```bash
# Create application root directory
sudo mkdir -p /var/www/hrms-attendoschool/releases
sudo mkdir -p /var/www/hrms-attendoschool/shared
sudo mkdir -p /var/www/certbot

# Grant ownership to deployer and read access to www-data (Nginx)
sudo chown -R deployer:www-data /var/www/hrms-attendoschool
sudo chmod -R 775 /var/www/hrms-attendoschool

# Set SGID bit so newly created files inherit group ownership
sudo chmod g+s /var/www/hrms-attendoschool/releases
```

---

## Step 5: Configure SSH Keys for GitHub Actions CI/CD

On your local workstation (or on the server), generate a dedicated Ed25519 SSH deployment key:

```bash
ssh-keygen -t ed25519 -C "github-actions-deployer@attendoschool" -f deploy_key -N ""
```
This generates:
- `deploy_key` (Private key $\rightarrow$ to be placed in GitHub Secrets as `VPS_SSH_PRIVATE_KEY`)
- `deploy_key.pub` (Public key $\rightarrow$ to be registered on the VPS)

Install the public key into the VPS `deployer` account:
```bash
sudo tee /home/deployer/.ssh/authorized_keys << 'EOF'
PASTE_CONTENTS_OF_deploy_key.pub_HERE
EOF

sudo chown -R deployer:deployer /home/deployer/.ssh
sudo chmod 600 /home/deployer/.ssh/authorized_keys
```

### Obtain Server Host Fingerprint for GitHub `VPS_SSH_KNOWN_HOSTS`
Run this command from your local machine to obtain the exact `known_hosts` entry:
```bash
ssh-keyscan -H -t ed25519 YOUR_HOSTINGER_VPS_IP
```
Save the entire output line into GitHub Secrets as `VPS_SSH_KNOWN_HOSTS`.

---

## Step 6: Configure Nginx Virtual Host

Copy the production Nginx virtual host configuration:

```bash
sudo cp /var/www/hrms-attendoschool/deploy/nginx/hrms.attendoschool.online.conf /etc/nginx/sites-available/hrms.attendoschool.online.conf
```
*(Or create `/etc/nginx/sites-available/hrms.attendoschool.online.conf` using the file in `deploy/nginx/`).*

Enable the site and verify syntax:
```bash
# Link to sites-enabled
sudo ln -s /etc/nginx/sites-available/hrms.attendoschool.online.conf /etc/nginx/sites-enabled/

# Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 7: Issue Trusted Let's Encrypt TLS Certificate

Once your DNS A record (`hrms.attendoschool.online` $\rightarrow$ VPS IP) is active:

```bash
sudo certbot --nginx -d hrms.attendoschool.online --agree-tos --email admin@attendoschool.online --non-interactive --redirect
```

Verify automated renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 8: Configure Host Firewall (UFW)

Lock down all ports except SSH, HTTP, and HTTPS:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status verbose
```

#!/bin/bash

set -e

# ==========================================
# Config - Adjust these vars as needed
# ==========================================
SSID="EkosLive"
PASSWORD="MySecurePassword123"
# Set to a safe subnet to avoid home router conflicts (192.168.(1|0).x, 10.0.0.x, etc)
SUBNET_IP="192.168.50.1/24"
CONNECTION_NAME="Hotspot"

if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run this script as root (sudo)."
  exit 1
fi

echo "==========================================="
echo "Detecting wireless interface..."

WIFI_IFACE=$(iw dev | grep Interface | awk '{print $2}' | head -n 1)

if [ -z "$WIFI_IFACE" ]; then
    # Fallback to ip link detection if iw dev isn't installed
    WIFI_IFACE=$(ip -o link show | awk -F': ' '{print $2}' | grep -E '^w' | head -n 1)
fi

if [ -z "$WIFI_IFACE" ]; then
    echo "Error: No wireless interface detected on this system."
    exit 1
fi
echo "Found wireless interface: $WIFI_IFACE"

echo "==========================================="
echo "Creating NetworkManager hotspot profile..."

# prevent duplicate profiles
if nmcli connection show "$CONNECTION_NAME" >/dev/null 2>&1; then
    echo "Removing existing '$CONNECTION_NAME' profile..."
    nmcli connection delete "$CONNECTION_NAME"
fi

nmcli device wifi hotspot ifname "$WIFI_IFACE" ssid "$SSID" password "$PASSWORD"

echo "Configuring subnet ($SUBNET_IP) on '$CONNECTION_NAME'..."
nmcli connection modify "$CONNECTION_NAME" ipv4.addresses "$SUBNET_IP" ipv4.method "shared"

# Stop connection for now (systemd fallback script will handle starting it if needed)
nmcli connection down "$CONNECTION_NAME" || true

echo "==========================================="
echo "Generating the runtime checker script at /usr/local/bin/wifi-fallback.sh..."

cat << 'EOF' > /usr/local/bin/wifi-fallback.sh
#!/bin/bash
# Automatically generated fallback script

HOTSPOT_NAME="Hotspot"

# Check for internet access by pinging a public DNS server
# Modify 8.8.8.8 if you prefer to ping a local gateway instead
if ! ping -c 2 -W 3 8.8.8.8 > /dev/null 2>&1; then
    echo "[$(date)] No internet detected. Checking if hotspot is already active..."
    
    # Check if the connection is already active to prevent spamming
    if ! nmcli connection show --active | grep -q "$HOTSPOT_NAME"; then
        echo "[$(date)] Hotspot is inactive. Activating hotspot fallback..."
        nmcli connection up "$HOTSPOT_NAME"
    else
        echo "[$(date)] Hotspot is already running."
    fi
else
    echo "[$(date)] Active internet connection detected. Hotspot is not required."
fi
EOF

chmod +x /usr/local/bin/wifi-fallback.sh

echo "==========================================="
echo "Setting up systemd background service..."

cat << EOF > /etc/systemd/system/wifi-fallback.service
[Unit]
Description=Fallback to Wi-Fi Hotspot if no internet connection exists
After=network-online.target NetworkManager.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/wifi-fallback.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable wifi-fallback.service

echo "==========================================="
echo " Successfully completed hotspot setup"
echo "Hotspot SSID: $SSID"
echo "Hotspot IP:   $SUBNET_IP"
echo "The script will test your connection on every system boot."

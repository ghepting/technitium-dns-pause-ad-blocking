# Technitium DNS: Pause Ad Blocking App

A React + Node.js application to temporarily pause ad blocking on your network via a secure backend proxy.

## Features

- **Pause Ad Blocking**: Select a duration (1 min to 24 hours) and pause ad blocking.
- **Countdown Timer**: Real-time countdown showing when blocking will resume.
- **State Persistence**: Timer and state persist across page refreshes using `localStorage`.
- **Health Monitoring**:
  - Automatically checks DNS server health every 30 seconds.
  - Displays "Healthy" or "Unhealthy" status.
  - Disables the pause button if the server is unreachable.
- **Backend Proxy**: Securely manages your API token and resolves CORS issues.

## 🛠 Project Setup (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/technitium-dns-pause-ad-blocking.git
   cd technitium-dns-pause-ad-blocking
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env # if example exists, otherwise create new
   ```

   Add your API token and DNS server URL:

   ```env
   TECHNITIUM_DNS_API_TOKEN=your_actual_api_token_here
   TECHNITIUM_DNS_SERVER_URL=https://dns.example.com
   KAMAL_REGISTRY_TOKEN=your_github_personal_access_token_here
   PORT=3000
   ```

### Running Locally

You need to run both the backend server (to proxy API requests) and the frontend development server.

1. **Start the Backend & Frontend (Concurrent):**

   ```bash
   npm start
   ```

   This runs `node server.js` and `vite` concurrently. Open [http://localhost:5173](http://localhost:5173) in your browser.

   > **Note:** The backend runs on port `3000`. The Vite frontend proxies `/api` requests to this port.

## 🚀 Deployment

This project uses **Docker**, **Kamal**, and **GitHub Actions** for automated deployment.

### 1. Server SSH Setup

Ensure your deployment server allows SSH access using a public/private key pair.

1. **Generate a key pair** (if you don't have one):

   ```bash
   ssh-keygen -t ed25519 -C "deploy@example.com" -f deploy_key
   ```

2. **Copy the public key** (`deploy_key.pub`) to your server's `~/.ssh/authorized_keys` file for the user you intend to deploy with (e.g., `root`).

   ```bash
   ssh-copy-id -i deploy_key.pub user@server_ip
   ```

3. **Keep the private key** (`deploy_key`) safe; you will need its content for the `SSH_PRIVATE_KEY` secret below.

### 2. WireGuard VPN Setup (Optional)

If your server is behind a private network (like a homelab), you can use WireGuard to allow GitHub Actions to connect to it.

1. **Install WireGuard tools** locally to generate keys:

   ```bash
   # macOS
   brew install wireguard-tools
   # Ubuntu/Debian
   sudo apt install wireguard-tools
   ```

2. **Generate Client Keys**:

   ```bash
   wg genkey | tee privatekey | wg pubkey > publickey
   ```

3. **Add Peer to Server**:
   On your Technitium/Deployment server, add the _public key_ you just generated to the server's WireGuard configuration (e.g., `/etc/wireguard/wg0.conf`):

   ```ini
   [Peer]
   # GitHub Actions Client
   PublicKey = <CONTENT_OF_publickey>
   AllowedIPs = 10.0.0.2/32
   ```

   Restart WireGuard on the server (`systemctl restart wg-quick@wg0`).

4. **Create Client Config**:
   Create a file named `wg0.conf` locally with the following content (using the _private key_ you generated and your server's details). This will be your `WIREGUARD_CONFIG` secret.

   ```ini
   [Interface]
   PrivateKey = <CONTENT_OF_privatekey>
   Address = 10.0.0.2/32

   [Peer]
   PublicKey = <SERVER_PUBLIC_KEY>
   Endpoint = <YOUR_HOME_IP>:51820
   AllowedIPs = 10.0.0.0/24
   PersistentKeepalive = 25
   ```

### 3. GitHub Configuration

To enable the CD pipeline, you must configure **Secrets** and **Variables** in your repository settings.

#### A. Repository Secrets

Go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

| Secret Name                | Value / How to Generate                                               |
| :------------------------- | :-------------------------------------------------------------------- |
| `TECHNITIUM_DNS_API_TOKEN` | The secure token for your DNS API (same as local `.env`).             |
| `KAMAL_REGISTRY_TOKEN`     | A GitHub Personal Access Token (Classic) with `write:packages` scope. |
| `SSH_PRIVATE_KEY`          | Private SSH key for accessing the deployment server.                  |
| `SSH_KNOWN_HOSTS`          | Output of `ssh-keyscan -H <your-server-ip>`.                          |
| `WIREGUARD_CONFIG`         | (Optional) Content of `wg0.conf` for VPN connection.                  |

#### B. Repository Variables

Go to **Settings** -> **Secrets and variables** -> **Actions** -> **Variables** -> **New repository variable**.

| Variable Name               | Value Description                           | Example                   |
| :-------------------------- | :------------------------------------------ | :------------------------ |
| `TECHNITIUM_DNS_SERVER_URL` | The full URL of your Technitium DNS server. | `https://dns.example.com` |
| `KAMAL_DESTINATION`         | The IP address of your deployment server.   | `10.0.0.1`                |
| `KAMAL_PROXY_HOST`          | The domain name for the application.        | `pause.example.com`       |
| `SSH_USER`                  | The SSH username for the server.            | `root` or `ubuntu`        |

### 4. Trigger Deployment

Once configuration is complete, push to the `main` branch to deploy:

```bash
git push origin main
```

## 🐳 Docker (Manual Build)

If you want to build and run the Docker container locally:

```bash
# Build the image
docker build -t pause-blocking .

# Run the container (passing the API token)
docker run -p 3000:3000 -e TECHNITIUM_DNS_API_TOKEN=your_actual_api_token_here -e TECHNITIUM_DNS_SERVER_URL=https://dns.example.com pause-blocking
```

Access the app at `http://localhost:3000`.

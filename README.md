# 🛡️ TLS AUDITOR
### **High-Fidelity Infrastructure Security Analysis Enginee**

[![HACKATHON](https://img.shields.io/badge/GSSS_HACK_THE_HACKERS-4th_PLACE-gold?style=for-the-badge&logo=target)](https://github.com/bharathkumar000/tls-auditor)
[![SECURITY](https://img.shields.io/badge/MISSION-CRITICAL-red?style=for-the-badge&logo=shield)](https://github.com/bharathkumar000/tls-auditor)
[![LICENSE](https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge)](LICENSE)

---

## 🚀 THE MISSION
**TLS AUDITOR** was engineered to solve a critical gap in infrastructure security: the invisible vulnerability of misconfigured TLS/SSL layers. Developed for the **GSSS "Hack the Hackers" Cyber Security Hackathon** (where it secured **4th Place**), this engine provides automated, socket-level auditing to identify cryptographic weaknesses before they can be exploited.

---

## 🔬 THE TECHNOLOGY
At its core, TLS Auditor employs a **Rule-Based Parser** to evaluate the security posture of an endpoint. Unlike generic scanners, it performs active handshakes to verify the actual availability of protocols and ciphers.

### 🛡️ Core Engine: Rule-Based Parser
*   **Protocol Detection**: Deep-scans SSLv2, SSLv3, TLS 1.0, 1.1, 1.2, and 1.3.
*   **Weak Cipher Identification**: Specifically targets **BROKEN** (RC4, MD5), **LEGACY** (3DES), and **VULNERABLE** (CBC mode in TLS < 1.3) ciphers.
*   **Weighted Scoring Matrix**: Calculates a dynamic Safety Score based on a hierarchical penalty system synchronized via **Supabase Real-time Database**.

### ✨ Stretch Feature: Secure Blueprint Generator
The engine doesn't just find problems—it solves them. For every vulnerability detected, TLS Auditor generates a **Hardened Configuration Snippet** (Nginx/Apache) designed to immediately remediate the security gap while maintaining modern compatibility.

---

## ⚡ KEY CAPABILITIES

| Feature | Description |
|---|---|
| **Handshake Fingerprinting** | Prevents redundant results by uniquely identifying Protocol/Cipher combinations. |
| **Intelligence Fusion** | Merges Local Scan data (40%) with Global Threat Intel from **CryptCheck** (60%). |
| **Tactical Dashboard** | A macOS-inspired terminal UI with live audit logs and a high-fidelity radar threat map. |
| **PDF Intelligence Export** | Generates professional, branded Security Assessment Reports in one click. |

---

## 🛠️ STACK ARCHITECTURE

*   **Frontend**: React 19, Framer Motion (Ceremonial Animations), Lucide Icons.
*   **Backend**: Node.js Express Server with the native `tls` module.
*   **Database**: Supabase PostgreSQL for the Unified Threat Intelligence Vault.
*   **Reporting**: jsPDF Engine for high-resolution document generation.

---

## 🚀 DEPLOYMENT

### 1️⃣ Environment Blueprint
Create a `.env` in the root directory:
```env
# MISSION_CRITICAL_CONFIG
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
CRYPT_CHECK_API=https://cryptcheck.fr/api/v1/host/
PORT=3000
```

### 2️⃣ Operational Launch
```bash
# Install Dependencies
npm install

# Start Unified Security Console
npm run dev
```
Navigate to **`http://localhost:3000`** to begin the mission.

---

## 🔒 SECURITY DISCLOSURE
This tool is intended for legitimate security auditing and developer infrastructure verification. Use responsibly and only on authorized endpoints.

---

**Built for the GSSS Cyber Security Hackathon.**  
**Audited with intent. Secured with precision.** 🚀

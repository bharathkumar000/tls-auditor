# 🛡️ TLS AUDITOR
### **High-Fidelity Automated Infrastructure Scanning & Threat Intelligence**

![TLS_AUDITOR_BANNER](https://img.shields.io/badge/SECURITY-MISSION_CRITICAL-gold?style=for-the-badge&logo=shield)
![VERSION](https://img.shields.io/badge/VERSION-1.3.0-blue?style=for-the-badge)
![LICENSE](https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge)

**TLS AUDITOR** is a high-performance, developer-centric security engine designed to audit SSL/TLS configurations, detect cryptographic vulnerabilities, and provide a unified safety score based on internal scans and global threat intelligence.

---

## ⚡ KEY CAPABILITIES

### 🔬 Multi-Layered Auditing
*   **Protocol Stack Analysis**: Real-time detection of TLS versions (v1.0 - v1.3).
*   **Cipher Suite Deep-Scan**: Identifies broken (RC4, MD5), legacy (3DES), and weak (CBC mode) encryption.
*   **Certificate Integrity**: Granular RSA key strength checking with custom penalties for <1024 and <2048 bit keys.
*   **Signature Verification**: Detects collision-prone SHA-1 signatures.

### 🧠 Intelligence Fusion
*   **Unified Threat Index**: A weighted security score (40% Internal Scan | 60% External Intelligence).
*   **CryptCheck Integration**: Seamlessly pulls external assessment grades (A+ to F) from global security feeds.
*   **Dynamic Vuln Database**: Periodically synchronizes the latest known insecure ciphers from a central **Supabase** master list.

### 🖥️ Mission-Critical UI
*   **Terminal Interface**: Live audit logs and protocol stack results rendered in a high-fidelity macOS-style terminal.
*   **Dual-Ring Radar Chart**: Visual comparison of internal security vs. external intelligence.
*   **Exportable Reports**: Generate premium, branded PDF Security Assessments in one click.

---

## 🛠️ TECH ARCHITECTURE

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Scanning Engine** | Native Node.js `tls` module (Socket-level handshakes) |
| **Database** | Supabase (PostgreSQL) |
| **PDF Engine** | jsPDF |

---

## 🚀 GETTING STARTED

### 1️⃣ PREREQUISITES
*   **Node.js v18+**
*   **Supabase Project** (for the vulnerability database)

### 2️⃣ ENVIRONMENT CONFIGURATION
Create a `.env` file in the root directory:
```env
CRYPT_CHECK_API=https://cryptcheck.fr/api/v1/host/
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
PORT=3000
```

### 3️⃣ INSTALLATION
```bash
npm install
```

### 4️⃣ RUNNING THE ENGINE
Launch the unified security console with a single command:
```bash
npm run dev
```
Navigate to **`http://localhost:3000`** to begin auditing.

---

## 🔒 SECURITY DISCLOSURE
This tool is intended for **legitimate security auditing** and developer infrastructure verification only. The scanning methodology involves active TLS handshakes and should be used responsibly.

---

**Developed with precision. Audited with intent.** 🚀

const express = require("express");
const cors = require("cors");
const tls = require("tls");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const weakProtocols = ["SSLv2", "SSLv3", "TLSv1", "TLSv1.1"];
const weakCiphers = ["RC4", "3DES", "MD5", "NULL", "DES"];

async function testProtocol(host, protocol) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: host,
      port: 443,
      minVersion: protocol,
      maxVersion: protocol,
      rejectUnauthorized: false,
      timeout: 5000
    }, () => {
      const cipher = socket.getCipher();
      const usedProtocol = socket.getProtocol();
      const cert = socket.getPeerCertificate();

      resolve({
        protocol: usedProtocol,
        cipher: cipher.name,
        cert: {
          issuer: cert.issuer?.CN || 'Unknown',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          subject: cert.subject?.CN || 'Unknown'
        }
      });
      socket.end();
    });

    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

app.post("/api/audit", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const host = url.replace("https://", "").replace("http://", "").split('/')[0];
  const protocols = ["TLSv1", "TLSv1.1", "TLSv1.2", "TLSv1.3"];
  const finalResults = {
    target: host,
    timestamp: new Date().toISOString(),
    scans: [],
    overallStatus: "SECURE"
  };

  for (const proto of protocols) {
    const result = await testProtocol(host, proto);
    if (result) {
      const issues = [];
      if (weakProtocols.includes(result.protocol)) {
        issues.push(`Weak protocol detected: ${result.protocol}`);
        finalResults.overallStatus = "VULNERABLE";
      }

      weakCiphers.forEach(c => {
        if (result.cipher.includes(c)) {
          issues.push(`Weak cipher detected: ${c}`);
          finalResults.overallStatus = "VULNERABLE";
        }
      });

      finalResults.scans.push({
        protocol: result.protocol,
        cipher: result.cipher,
        issues,
        cert: result.cert,
        recommendations: issues.map(i => 
          i.includes("protocol") ? "Disable SSLv3, TLSv1, TLSv1.1. Use TLSv1.2 or TLSv1.3." : "Remove weak ciphers like RC4, DES, or 3DES."
        )
      });
    }
  }

  res.json(finalResults);
});

app.listen(PORT, () => {
  console.log(`Auditor Engine running on http://localhost:${PORT}`);
});

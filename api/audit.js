const tls = require("tls");
const { createClient } = require('@supabase/supabase-js');

// ── VULN DATA ──
const badCipherSuites = [
  { id: 1,  cipherName: "TLS_RSA_WITH_NULL_SHA", severity: "CRITICAL" },
  { id: 2,  cipherName: "TLS_RSA_WITH_NULL_MD5", severity: "CRITICAL" },
  { id: 4,  cipherName: "TLS_RSA_EXPORT_WITH_RC4_40_MD5", severity: "CRITICAL" },
  { id: 7,  cipherName: "TLS_RSA_WITH_RC4_128_SHA", severity: "HIGH" },
  { id: 10, cipherName: "TLS_RSA_WITH_3DES_EDE_CBC_SHA", severity: "HIGH" },
  { id: 17, cipherName: "TLS_RSA_WITH_AES_128_CBC_SHA", severity: "MEDIUM" },
];

const protocolVulnerabilities = [
  { id: "SSL_V23", name: "SSL v2 / v3",    severity: "CRITICAL", rationale: "Broken POODLE/DROWN.", alt: "TLS 1.3" },
  { id: "TLS_10",  name: "TLS 1.0 / 1.1",  severity: "HIGH",     rationale: "Vulnerable to BEAST.", alt: "TLS 1.2+" },
];

const certVulnerabilities = [
  { id: "VERY_SMALL_RSA", name: "Critically Weak RSA Key", severity: "HIGH", rationale: "RSA < 1024 bits.", alt: "RSA 3072+" },
  { id: "SMALL_RSA", name: "Small RSA Key", severity: "MEDIUM", rationale: "RSA < 2048 bits.", alt: "RSA 3072+" },
  { id: "SHA1_CERT",  name: "SHA-1 Certificate", severity: "HIGH", rationale: "SHA-1 collision-prone.", alt: "SHA-256+" },
];

async function testProtocol(host, protocol) {
  return new Promise((resolve) => {
    try {
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
          cipher: cipher?.name || 'Unknown',
          cert: {
            issuer: cert.issuer?.CN || 'Unknown',
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            subject: cert.subject?.CN || 'Unknown',
            bits: cert.bits || 0,
            sigAlgorithm: cert.sig_alg || cert.sigalg || 'Unknown'
          },
          authorized: socket.authorized,
          authError: socket.authorizationError
        });
        socket.end();
      });
      socket.on("error", () => resolve(null));
      socket.on("timeout", () => { socket.destroy(); resolve(null); });
    } catch (e) { resolve(null); }
  });
}

function matchCipherVulnerabilities(cipherName) {
  const c = cipherName.toUpperCase();
  const matched = [];
  if (c.includes("NULL"))   matched.push({ category: "NULL", severity: "CRITICAL" });
  if (c.includes("EXPORT")) matched.push({ category: "EXPORT", severity: "CRITICAL" });
  if (c.includes("RC4"))    matched.push({ category: "RC4", severity: "HIGH" });
  if (c.includes("3DES"))   matched.push({ category: "3DES", severity: "HIGH" });
  if (c.includes("CBC"))    matched.push({ category: "CBC", severity: "MEDIUM" });
  return matched;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const host = url.replace("https://", "").replace("http://", "").split('/')[0];
  const testableProtocols = ["TLSv1", "TLSv1.1", "TLSv1.2", "TLSv1.3"];
  
  const finalResults = {
    target: host,
    timestamp: new Date().toISOString(),
    scans: [],
    overallStatus: "SECURE"
  };

  for (const proto of testableProtocols) {
    const result = await testProtocol(host, proto);
    if (result) {
      const foundIssues = [];
      const matchedVulnerabilities = [];

      if (result.protocol.includes("TLSv1.0") || result.protocol === "TLSv1") {
        foundIssues.push("[HIGH] TLS 1.0/1.1 used.");
      }

      const cipherMatches = matchCipherVulnerabilities(result.cipher);
      cipherMatches.forEach(m => {
        foundIssues.push(`[${m.severity}] ${m.category} detected.`);
        matchedVulnerabilities.push(m);
      });

      if (result.cert.bits > 0 && result.cert.bits < 2048) {
        const sev = result.cert.bits < 1024 ? "RSA_PENALTY_20" : "RSA_PENALTY_10";
        foundIssues.push(`[${result.cert.bits < 1024 ? 'HIGH' : 'MEDIUM'}] RSA Key strength too low.`);
        matchedVulnerabilities.push({ severity: sev });
      }

      if (foundIssues.length > 0) finalResults.overallStatus = "VULNERABLE";

      finalResults.scans.push({
        protocol: result.protocol,
        cipher: result.cipher,
        status: result.authorized ? "SECURE" : "UNTRUSTED",
        issues: foundIssues,
        cert: result.cert,
        matchedVulnerabilities
      });
    }
  }

  // Scoring Logic
  let penalty = 0;
  finalResults.scans.flatMap(s => s.matchedVulnerabilities).forEach(v => {
    if (v.severity === 'CRITICAL') penalty += 25;
    if (v.severity === 'HIGH') penalty += 15;
    if (v.severity === 'MEDIUM') penalty += 8;
    if (v.severity === 'RSA_PENALTY_20') penalty += 20;
    if (v.severity === 'RSA_PENALTY_10') penalty += 10;
  });

  finalResults.externalSafety = { 
    provider: 'INTERNAL_SCANNER', 
    score: Math.max(10, 100 - penalty) 
  };

  res.json(finalResults);
};

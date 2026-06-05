const crypto = require("crypto");
const { Blob } = require("buffer");

const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function boolEnv(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function getIpfsConfig() {
  return {
    enabled: boolEnv("IPFS_ENABLED", false),
    required: boolEnv("IPFS_REQUIRED", false),
    provider: (process.env.IPFS_PROVIDER || "pinata").toLowerCase(),
    pinataJwt: process.env.PINATA_JWT || "",
    gateway: normalizeGateway(process.env.IPFS_GATEWAY || ""),
  };
}

function normalizeGateway(value) {
  let gateway = String(value || "").trim();

  if (!gateway) {
    gateway = "https://gateway.pinata.cloud/ipfs/";
  }

  if (!/^https?:\/\//i.test(gateway)) {
    gateway = `https://${gateway}`;
  }

  gateway = gateway.replace(/\/+$/, "");

  if (!gateway.endsWith("/ipfs")) {
    gateway = `${gateway}/ipfs`;
  }

  return `${gateway}/`;
}

function getIpfsUrl(cid) {
  if (!cid) return "";
  return `${getIpfsConfig().gateway}${cid}`;
}

function createEvidenceHash(buffer) {
  return `sha256:${crypto.createHash("sha256").update(buffer).digest("hex")}`;
}

function createFallbackResult({ buffer, warning }) {
  return {
    storage: "ipfs",
    provider: "pinata",
    uploadStatus: "hash_only",
    evidenceHash: createEvidenceHash(buffer),
    ipfsCid: "",
    ipfsUrl: "",
    imageUrl: "",
    warning,
  };
}

async function uploadEvidenceToIpfs({ buffer, filename, mimetype }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    const err = new Error("Evidence file buffer is required");
    err.status = 400;
    throw err;
  }

  const config = getIpfsConfig();

  if (!config.enabled) {
    return createFallbackResult({
      buffer,
      warning:
        "IPFS upload is disabled. Evidence hash was calculated, but no CID was created.",
    });
  }

  if (config.provider !== "pinata") {
    const message = `Unsupported IPFS_PROVIDER: ${config.provider}`;
    if (config.required) {
      const err = new Error(message);
      err.status = 502;
      throw err;
    }
    return createFallbackResult({ buffer, warning: message });
  }

  if (!config.pinataJwt) {
    const message = "PINATA_JWT is not configured on backend";
    if (config.required) {
      const err = new Error(message);
      err.status = 502;
      throw err;
    }
    return createFallbackResult({ buffer, warning: message });
  }

  const evidenceHash = createEvidenceHash(buffer);
  const formData = new FormData();
  const safeFilename = filename || `agritrace-evidence-${Date.now()}.jpg`;

  formData.append("file", new Blob([buffer], { type: mimetype }), safeFilename);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: safeFilename,
      keyvalues: {
        app: "AgriTrace",
        evidenceHash,
      },
    })
  );

  try {
    const response = await fetch(PINATA_PIN_FILE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.pinataJwt}`,
      },
      body: formData,
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.IpfsHash) {
      const message =
        body.error?.details ||
        body.error ||
        body.message ||
        `Pinata upload failed with HTTP ${response.status}`;
      throw new Error(message);
    }

    const ipfsCid = body.IpfsHash;
    const ipfsUrl = getIpfsUrl(ipfsCid);

    return {
      storage: "ipfs",
      provider: "pinata",
      uploadStatus: "pinned",
      evidenceHash,
      ipfsCid,
      ipfsUrl,
      imageUrl: ipfsUrl,
      pinSize: body.PinSize || null,
      pinnedAt: body.Timestamp || null,
    };
  } catch (error) {
    if (config.required) {
      error.status = error.status || 502;
      throw error;
    }

    return createFallbackResult({
      buffer,
      warning: `Pinata upload failed: ${error.message}`,
    });
  }
}

module.exports = {
  createEvidenceHash,
  getIpfsConfig,
  getIpfsUrl,
  uploadEvidenceToIpfs,
};

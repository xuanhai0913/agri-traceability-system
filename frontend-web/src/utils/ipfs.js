const PUBLIC_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function extractIpfsCid(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-zA-Z0-9]+)$/i.test(text)) {
    return text;
  }

  const protocolMatch = text.match(/^ipfs:\/\/([^/?#]+)/i);
  if (protocolMatch?.[1]) return protocolMatch[1];

  const gatewayMatch = text.match(/\/ipfs\/([^/?#]+)/i);
  return gatewayMatch?.[1] || "";
}

export function getPublicIpfsUrl(value) {
  const cid = extractIpfsCid(value);
  return cid ? `${PUBLIC_IPFS_GATEWAY}${cid}` : "";
}

export function resolveIpfsAssetUrl(url, ipfsCid = "") {
  return getPublicIpfsUrl(ipfsCid) || getPublicIpfsUrl(url) || url || "";
}

import axios from "axios";
import crypto from "crypto";

// === 🔐 CREDENTIALS ===
const consumer_key = '0b0def16674f6cffe1818edf73908e6555558a4444a701a80b7661fe8ec69edb';
const consumer_secret = '21989bca80147f6c74c01d2f4ce1d3e7698e75bcd246719bb46a8f955116355c';
const token_id = 'c2eab8cead2da76028c0535b0a1c769f9513cae2475e2111f962eb9ddfaf8a35';
const token_secret = '886a08d0fb83e9bd7ecc944fc5904cf69e4caa082b7cb267dd835792b4a7c48b';
const account = '9533937_SB1'; // realm/account
const script = '513';
const deploy = '1';
const baseUrl = `https://9533937-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl`;
const baseUrlWithParameters = baseUrl + `?script=${script}&deploy=${deploy}`;
const oauthSignatureMethod = 'HMAC-SHA256';
const oauthVersion = '1.0';

export async function getRequest() {

  const oauthNonce = crypto.randomBytes(32).toString("hex");
  const oauthTimestamp = Math.floor(Date.now() / 1000);

  const oauthParameters = {
    script: script,
    oauth_consumer_key: consumer_key,
    oauth_token: token_id,
    oauth_nonce: oauthNonce,
    oauth_timestamp: oauthTimestamp,
    oauth_signature_method: oauthSignatureMethod,
    oauth_version: oauthVersion,
    deploy: deploy
  };

  const sortedParameters = Object.keys(oauthParameters)
    .sort()
    .map((key) => `${key}=${oauthParameters[key]}`)
    .join("&");

  const signatureBaseString = `GET&${encodeURIComponent(baseUrl)}&${encodeURIComponent(sortedParameters)}`;

  const signingKey = `${consumer_secret}&${token_secret}`;

  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(signatureBaseString);

  let oauthSignature = encodeURIComponent(hmac.digest("base64"));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `OAuth realm="${account}",oauth_nonce="${oauthNonce}",oauth_signature_method="${oauthSignatureMethod}",oauth_consumer_key="${consumer_key}",oauth_token="${token_id}",oauth_timestamp="${oauthTimestamp}",oauth_version="${oauthVersion}",oauth_signature="${oauthSignature}"`
  };

  return axios.get(baseUrlWithParameters, { headers });

}
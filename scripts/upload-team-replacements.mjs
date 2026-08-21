import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing Cloudinary credentials in .env.local or .env");
  process.exit(1);
}

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

async function uploadImage(filePath, publicId) {
  const folder = "sabrang-2026/team";
  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    folder,
    invalidate: "true",
    overwrite: "true",
    public_id: publicId,
    timestamp: timestamp.toString(),
  };

  const signature = generateSignature(params, API_SECRET);

  const fileData = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  const base64Data = `data:${mimeType};base64,${fileData.toString("base64")}`;

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("overwrite", "true");
  formData.append("invalidate", "true");

  console.log(`Uploading ${filePath} -> ${folder}/${publicId}...`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const optimizedUrl = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
  console.log(`✓ Success: ${publicId} -> ${optimizedUrl}`);
  return {
    publicId,
    secureUrl: data.secure_url,
    optimizedUrl,
    version: data.version,
  };
}

async function main() {
  const items = [
    {
      file: path.resolve("public/rishika.jpeg"),
      publicId: "rishika-singh",
      name: "Rishika Singh",
      mappingKey: "/team/rishika-singh.png",
    },
  ];

  const results = {};

  for (const item of items) {
    if (!fs.existsSync(item.file)) {
      console.error(`File not found: ${item.file}`);
      continue;
    }
    try {
      const res = await uploadImage(item.file, item.publicId);
      results[item.name] = { ...item, ...res };
    } catch (err) {
      console.error(`Failed to upload ${item.name}:`, err.message);
    }
  }

  // 1. Update lib/team-urls.json
  const teamUrlsPath = path.resolve("lib/team-urls.json");
  if (fs.existsSync(teamUrlsPath)) {
    const teamUrls = JSON.parse(fs.readFileSync(teamUrlsPath, "utf-8"));
    for (const [name, data] of Object.entries(results)) {
      teamUrls[name] = data.optimizedUrl;
    }
    fs.writeFileSync(teamUrlsPath, JSON.stringify(teamUrls, null, 2), "utf-8");
    console.log("Updated lib/team-urls.json");
  }

  // 2. Update cloudinary-mapping.json
  const mappingPath = path.resolve("cloudinary-mapping.json");
  if (fs.existsSync(mappingPath)) {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
    for (const data of Object.values(results)) {
      mapping[data.mappingKey] = data.optimizedUrl;
    }
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), "utf-8");
    console.log("Updated cloudinary-mapping.json");
  }

  // 3. Update lib/constants.ts
  const constantsPath = path.resolve("lib/constants.ts");
  if (fs.existsSync(constantsPath)) {
    let content = fs.readFileSync(constantsPath, "utf-8");
    for (const [name, data] of Object.entries(results)) {
      const regex = new RegExp(`("${name}":\\s*)"[^"]+"`, "g");
      content = content.replace(regex, `$1"${data.optimizedUrl}"`);
    }
    fs.writeFileSync(constantsPath, content, "utf-8");
    console.log("Updated lib/constants.ts");
  }

  // 4. Remove local files from public folder
  for (const item of items) {
    if (fs.existsSync(item.file)) {
      fs.unlinkSync(item.file);
      console.log(`Cleaned up local file: ${path.basename(item.file)}`);
    }
  }

  console.log("\nAll images replaced in Cloudinary and references updated successfully!");
}

main();

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { isRateLimited } from "@/lib/security";
import crypto from "crypto";


// Scrypt parameters — deliberately slow to resist brute-force attacks
const SCRYPT_N = 16384; // CPU/memory cost factor (2^14)
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LEN = 32;

/**
 * Derives a scrypt hash of a password with a random salt.
 * Returns a self-describing string: "scrypt:<salt_hex>:<hash_hex>"
 */
async function deriveScryptHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verifies a password against a scrypt-format stored hash using constant-time comparison.
 */
async function verifyScryptHash(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expectedHash = Buffer.from(parts[2], "hex");
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, SCRYPT_KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    return expectedHash.length === derived.length && crypto.timingSafeEqual(expectedHash, derived);
  } catch {
    return false;
  }
}

/**
 * M-1 fix: Legacy SHA-256 check for backward compatibility with old stored hashes.
 * If the stored hash is exactly 64 lowercase hex chars (SHA-256 format), verify against it.
 */
function verifyLegacySha256(password: string, stored: string): boolean {
  const normalizedStored = stored.toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalizedStored)) return false;
  // codeql[js/insufficient-password-hash] - This is a temporary legacy fallback used strictly to migrate old users to scrypt.
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(normalizedStored, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Take only the first IP to prevent x-forwarded-for spoofing
    const rawIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ip = rawIp.split(",")[0].trim();

    if (isRateLimited(ip, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { identifier, password } = body;

    if (!identifier || !password || typeof identifier !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const cleanIdentifier = identifier.trim();
    const isUid = /^AAR-/i.test(cleanIdentifier);

    // Query volunteers via Admin SDK — no public Firestore client read needed
    let volSnap;
    if (isUid) {
      volSnap = await adminDb
        .collection("volunteers")
        .where("uid", "==", cleanIdentifier.toUpperCase())
        .limit(1)
        .get();
    } else {
      volSnap = await adminDb
        .collection("volunteers")
        .where("email", "==", cleanIdentifier.toLowerCase())
        .limit(1)
        .get();
    }

    // 404 = not a volunteer at all; caller falls through to Firebase Auth for admin/scanner
    if (volSnap.empty) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 404 });
    }

    const volDocRef = volSnap.docs[0];
    const volData = volDocRef.data();
    const volId = volDocRef.id;
    const storedHash: string = volData.passwordHash || "";

    let isValidPassword = false;
    let needsMigration = false;

    if (storedHash.startsWith("scrypt:")) {
      // Modern scrypt hash — verify directly
      isValidPassword = await verifyScryptHash(password, storedHash);
    } else {
      // Legacy SHA-256 hash — verify and mark for migration to scrypt
      isValidPassword = verifyLegacySha256(password, storedHash);
      if (isValidPassword) {
        needsMigration = true;
      }
    }

    if (!isValidPassword) {
      // 401 = volunteer found but wrong password; caller should NOT fall through to Firebase Auth
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Silently upgrade old SHA-256 hash to scrypt in the background
    if (needsMigration) {
      try {
        const newHash = await deriveScryptHash(password);
        await adminDb.collection("volunteers").doc(volId).update({ passwordHash: newHash });
        console.log(`Password hash migrated to scrypt for volunteer: ${volId}`);
      } catch (migrationErr) {
        // Non-fatal — login still succeeds with the old hash for now
        console.error("Hash migration failed (non-fatal):", migrationErr);
      }
    }

    // Issue a Firebase Auth custom token so the client gets a real authenticated session.
    // The custom token uid equals the Firestore volunteers doc ID, so the Firestore rule
    // "request.auth.uid == id" correctly gates each volunteer to their own data.
    const customToken = await adminAuth.createCustomToken(volId, {
      role: volData.role === "Team Leader" ? "team_leader" : "volunteer",
    });

    const sessionData = {
      uid: volId,
      email: volData.email || "",
      role: volData.role === "Team Leader" ? "team_leader" : "volunteer",
      name: volData.name || "",
      volUid: volData.uid || "",
    };

    console.log(`Volunteer login successful for: ${volData.email || volData.uid || volId}`);
    return NextResponse.json({ success: true, customToken, sessionData });
  } catch (error: any) {
    console.error("Volunteer login API error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}

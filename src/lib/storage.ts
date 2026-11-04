import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves a base64 data string (or raw buffer) to local storage.
 * If data is already an HTTP or local URL, it returns it unchanged.
 */
export async function saveFile(
  dataOrBase64: string | Buffer,
  originalFileName: string
): Promise<string> {
  if (typeof dataOrBase64 === "string" && (dataOrBase64.startsWith("http://") || dataOrBase64.startsWith("https://") || dataOrBase64.startsWith("/uploads/"))) {
    return dataOrBase64;
  }

  let buffer: Buffer;
  let extension = path.extname(originalFileName) || "";

  if (typeof dataOrBase64 === "string") {
    // Check if it has a data URL prefix: "data:image/png;base64,..."
    const matches = dataOrBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches) {
      const mime = matches[1];
      if (!extension) {
        if (mime === "image/jpeg") extension = ".jpg";
        else if (mime === "image/png") extension = ".png";
        else if (mime === "application/pdf") extension = ".pdf";
        else extension = ".bin";
      }
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(dataOrBase64, "base64");
    }
  } else {
    buffer = dataOrBase64;
  }

  const hash = crypto.randomBytes(16).toString("hex");
  const fileName = `${Date.now()}-${hash}${extension}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

/**
 * Deletes a file from the uploads directory if it's stored locally.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  const fileName = path.basename(fileUrl);
  const filePath = path.join(UPLOADS_DIR, fileName);
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn(`[Storage] Failed to delete file ${filePath}:`, err);
  }
}


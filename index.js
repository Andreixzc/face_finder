import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";
import multer from "multer";

const app = express();
const port = 3000;

app.use(express.json());

// Configure Multer to handle file uploads
const upload = multer({ storage: multer.memoryStorage() });

const createPresignedUrlWithClient = ({ key }) => {
  const client = new S3Client({ region: "sa-east-1" });
  const command = new PutObjectCommand({ Bucket: "xinedsbucks", Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file received" });
    }

    const { originalname, buffer, mimetype } = req.file;
    const KEY = originalname;

    // Generate a presigned URL for the S3 object
    const clientUrl = await createPresignedUrlWithClient({ key: KEY });

    // Upload the received image to S3 using the presigned URL
    await fetch(clientUrl, {
      method: "PUT",
      headers: { "Content-Type": mimetype },
      body: buffer,
    });

    console.log(`${originalname} uploaded successfully to S3 as ${KEY}`);

    res.status(200).json({ message: "Image uploaded to S3 successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

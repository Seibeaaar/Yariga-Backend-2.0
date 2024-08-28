import { FILE_SIZE_LIMIT_BYTES } from "@/constants/media";
import aws from "aws-sdk";
import multer from "multer";

aws.config.update({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMIT_BYTES,
  },
});

export const uploadPhotoToAWS = async (
  file: Express.Multer.File,
): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: file.originalname,
    Body: file.buffer,
  };

  const upload = await s3.upload(params).promise();
  return upload.Location;
};

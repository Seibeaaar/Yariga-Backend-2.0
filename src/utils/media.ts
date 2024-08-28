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
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadPhotoToAWS = async (
  file: Express.Multer.File,
): Promise<string> => {
  const params = {
    Bucket: "yariga",
    Key: file.originalname,
    Body: file.buffer,
  };

  const upload = await s3.upload(params).promise();
  return upload.Location;
};

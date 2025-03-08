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

export const uploadPhotosToAWS = async (
  files: Express.Multer.File[],
): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.originalname,
      Body: file.buffer,
    };

    return (await s3.upload(params).promise()).Location;
  });

  try {
    const uploadLocations = await Promise.all(uploadPromises);
    return uploadLocations;
  } catch (err) {
    throw new Error(`Upload failed. None of the files were uploaded: ${err}`);
  }
};

export const deleteAWSPhotos = async (urls: string[]) => {
  const keys = urls.map((url) => new URL(url).pathname.substring(1));
  await s3.deleteObjects({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Delete: {
      Objects: keys.map((key) => ({
        Key: key,
      })),
    },
  });
};

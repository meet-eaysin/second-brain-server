import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import logger from '../logger';

dotenv.config();

const LOCAL_STORAGE_PATH = path.join(__dirname, '../../uploads');

if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
  fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
}

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

export const storage = {
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, LOCAL_STORAGE_PATH);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
};

export const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and document files are allowed!'));
  }
};

export const upload = multer({
  storage: storage.local,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    
    fs.unlinkSync(file.path);
    
    logger.info(`File uploaded to S3: ${result.Location}`);
    return result.Location;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`S3 upload failed: ${error.message}`);
    } else {
      logger.error('Unknown error during S3 upload');
    }
    throw error;
  }
};

export const deleteFromS3 = async (fileUrl: string): Promise<boolean> => {
  try {
    const key = fileUrl.split('.com/')[1];
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key
    };

    await s3.deleteObject(params).promise();
    logger.info(`File deleted from S3: ${fileUrl}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`S3 delete failed: ${error.message}`);
    } else {
      logger.error('Unknown error during S3 delete');
    }
    return false;
  }
};

export default { upload, uploadToS3, deleteFromS3 };
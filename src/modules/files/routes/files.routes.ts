import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../middlewares/validation';
import * as filesController from '../controllers/files.controller';
import * as validators from '../validators/files.validators';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/json',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Please upload a supported file format.'));
    }
  }
});

// Single file upload
router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  validateBody(validators.uploadFileSchema),
  filesController.uploadFile
);

// Bulk file upload
router.post(
  '/bulk-upload',
  authenticateToken,
  upload.array('files', 10), // Max 10 files
  validateBody(validators.bulkUploadSchema),
  filesController.bulkUploadFiles
);

// Get file details
router.get(
  '/:id',
  authenticateToken,
  validateParams(validators.fileIdSchema),
  filesController.getFileById
);

// Download file
router.get(
  '/:id/download',
  authenticateToken,
  validateParams(validators.fileIdSchema),
  filesController.downloadFile
);

// Delete file
router.delete(
  '/:id',
  authenticateToken,
  validateParams(validators.fileIdSchema),
  filesController.deleteFile
);

// List user's files
router.get(
  '/',
  authenticateToken,
  validateQuery(validators.getFilesQuerySchema),
  filesController.getUserFiles
);

export default router;

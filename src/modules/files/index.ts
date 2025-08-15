// Routes
export { default as filesRoutes } from './routes/files.routes';

// Controllers
export {
  uploadFile,
  bulkUploadFiles,
  getFileById,
  downloadFile,
  deleteFile,
  getUserFiles
} from './controllers/files.controller';

// Services
export {
  uploadFile as uploadFileService,
  bulkUploadFiles as bulkUploadFilesService,
  getFileById as getFileByIdService,
  downloadFile as downloadFileService,
  deleteFile as deleteFileService,
  getUserFiles as getUserFilesService
} from './services/files.service';

// Types
export type {
  TFileUploadData,
  TFileResponse,
  TFileQueryParams,
  TFilesListResponse
} from './types/files.types';

// Validators
export * from './validators/files.validators';

// Models
export { FileModel, type IFile } from './models/file.model';

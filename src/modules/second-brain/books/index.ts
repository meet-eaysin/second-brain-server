// Routes
export { default as bookRoutes } from './routes/book.routes';

// Controllers
export * as bookController from './controllers/book.controller';
export * as bookDocumentViewController from './controllers/book-document-view.controller';

// Services
export * as bookService from './services/book.service';
export * as bookDocumentViewService from './services/book-document-view.service';

// Models
export { Book, type IBook } from './models/book.model';

// Validators
export * as bookValidators from './validators/book.validators';

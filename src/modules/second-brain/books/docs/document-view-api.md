# Books Module Document-View API Documentation

This document describes the document-view integration for the Books module, providing a unified interface for managing books through the centralized document-view system.

## Base URL
All document-view endpoints for books are prefixed with:
```
/second-brain/books/document-view
```

## Authentication
All endpoints require authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Configuration Endpoints

#### Get Module Configuration
```http
GET /second-brain/books/document-view/config
```
Returns the complete configuration for the books module including properties, views, and capabilities.

**Response:**
```json
{
  "success": true,
  "message": "Books module configuration retrieved successfully",
  "data": {
    "moduleType": "books",
    "displayName": "Book",
    "displayNamePlural": "Books",
    "description": "Track your reading list and book reviews",
    "icon": "📚",
    "capabilities": {
      "canCreate": true,
      "canEdit": true,
      "canDelete": true,
      "canShare": true,
      "canExport": true,
      "canImport": true
    },
    "ui": {
      "enableViews": true,
      "enableSearch": true,
      "enableFilters": true,
      "enableSorts": true,
      "enableGrouping": true,
      "supportedViewTypes": ["TABLE", "BOARD", "GALLERY", "LIST"],
      "defaultViewType": "TABLE"
    },
    "defaultProperties": [...],
    "defaultViews": [...]
  }
}
```

### View Management Endpoints

#### Get All Views
```http
GET /second-brain/books/document-view/views
```
Returns all views configured for the books module.

#### Create New View
```http
POST /second-brain/books/document-view/views
```
**Request Body:**
```json
{
  "name": "My Custom View",
  "type": "TABLE",
  "description": "Custom view for books",
  "filters": [
    {
      "propertyId": "status",
      "operator": "equals",
      "value": "currently_reading",
      "enabled": true
    }
  ],
  "sorts": [
    {
      "propertyId": "createdAt",
      "direction": "desc",
      "order": 0
    }
  ],
  "visibleProperties": ["title", "author", "status", "rating"],
  "isDefault": false,
  "isPublic": false
}
```

#### Get Specific View
```http
GET /second-brain/books/document-view/views/:viewId
```

#### Update View
```http
PUT /second-brain/books/document-view/views/:viewId
```

#### Delete View
```http
DELETE /second-brain/books/document-view/views/:viewId
```

#### Duplicate View
```http
POST /second-brain/books/document-view/views/:viewId/duplicate
```

### Property Management Endpoints

#### Get All Properties
```http
GET /second-brain/books/document-view/properties
```

#### Add New Property
```http
POST /second-brain/books/document-view/properties
```
**Request Body:**
```json
{
  "id": "custom_field",
  "name": "Custom Field",
  "type": "text",
  "description": "A custom field for books",
  "required": false,
  "order": 20
}
```

#### Update Property
```http
PUT /second-brain/books/document-view/properties/:propertyId
```

#### Delete Property
```http
DELETE /second-brain/books/document-view/properties/:propertyId
```

### Record Management Endpoints

#### Get All Records (Books)
```http
GET /second-brain/books/document-view/records
```
**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of records per page
- `search` (string): Search query
- `sort` (string): Sort field
- `filters` (object): Filter criteria

**Response:**
```json
{
  "success": true,
  "message": "Books records retrieved successfully",
  "data": {
    "records": [
      {
        "id": "book_id_123",
        "properties": {
          "title": "The Great Gatsby",
          "author": "F. Scott Fitzgerald",
          "isbn": "978-0-7432-7356-5",
          "genre": "fiction",
          "status": "completed",
          "rating": 5,
          "pages": 180,
          "currentPage": 180,
          "startDate": "2024-01-01T00:00:00.000Z",
          "finishDate": "2024-01-15T00:00:00.000Z",
          "notes": "Excellent book about the American Dream",
          "tags": ["classic", "american-literature"],
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-15T00:00:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z",
        "createdBy": "user_id_123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### Get Single Record (Book)
```http
GET /second-brain/books/document-view/records/:recordId
```

#### Create New Record (Book)
```http
POST /second-brain/books/document-view/records
```
**Request Body:**
```json
{
  "properties": {
    "title": "New Book Title",
    "author": "Author Name",
    "isbn": "978-1-234-56789-0",
    "genre": "fiction",
    "status": "want_to_read",
    "pages": 300,
    "tags": ["new", "fiction"]
  }
}
```

#### Update Record (Book)
```http
PUT /second-brain/books/document-view/records/:recordId
```
**Request Body:**
```json
{
  "properties": {
    "status": "currently_reading",
    "currentPage": 50,
    "startDate": "2024-01-20T00:00:00.000Z"
  }
}
```

#### Delete Record (Book)
```http
DELETE /second-brain/books/document-view/records/:recordId
```

## Property Types and Values

### Standard Properties
- **title** (text, required): Book title
- **author** (text, required): Book author
- **isbn** (text): Book ISBN
- **genre** (select): Book genre (fiction, non_fiction, biography, etc.)
- **status** (select, required): Reading status (want_to_read, currently_reading, completed, on_hold, abandoned)
- **rating** (select): Book rating (1-5 stars)
- **pages** (number): Total number of pages
- **currentPage** (number): Current reading page
- **startDate** (date): Date started reading
- **finishDate** (date): Date finished reading
- **notes** (text): Reading notes and thoughts
- **tags** (multiSelect): Book tags
- **createdAt** (date, frozen): Date added to library
- **updatedAt** (date, frozen): Last update date

### Status Values
- `want_to_read`: Want to Read
- `currently_reading`: Currently Reading
- `completed`: Completed
- `on_hold`: On Hold
- `abandoned`: Abandoned

### Genre Values
- `fiction`: Fiction
- `non_fiction`: Non-Fiction
- `biography`: Biography
- `science`: Science
- `technology`: Technology
- `business`: Business
- `self_help`: Self-Help
- `history`: History
- `philosophy`: Philosophy

## Default Views

### All Books
- **ID**: `all-books`
- **Type**: TABLE
- **Description**: View all books in library
- **Visible Properties**: title, author, genre, status, rating

### Currently Reading
- **ID**: `currently-reading`
- **Type**: TABLE
- **Description**: Books currently being read
- **Filter**: status = currently_reading
- **Visible Properties**: title, author, pages, currentPage, startDate

### Completed Books
- **ID**: `completed-books`
- **Type**: TABLE
- **Description**: Completed books
- **Filter**: status = completed
- **Visible Properties**: title, author, rating, finishDate, genre

### By Genre
- **ID**: `by-genre`
- **Type**: BOARD
- **Description**: Books grouped by genre
- **Group By**: genre
- **Visible Properties**: title, author, status, rating

### Reading List
- **ID**: `reading-list`
- **Type**: LIST
- **Description**: Books to read
- **Filter**: status = want_to_read
- **Visible Properties**: title, author, genre

## Integration with Centralized Document-View

The books module integrates seamlessly with the centralized document-view system at `/document-views/books`. Both endpoints provide the same functionality:

### Centralized Endpoints
```
GET /document-views/books/config
GET /document-views/books/views
GET /document-views/books/records
...
```

### Module-Specific Endpoints
```
GET /second-brain/books/document-view/config
GET /second-brain/books/document-view/views
GET /second-brain/books/document-view/records
...
```

This dual approach allows for both centralized management and module-specific customization while maintaining consistency across the application.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

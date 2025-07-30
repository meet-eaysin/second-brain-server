import * as XLSX from 'xlsx';
import { Parser as CsvParser } from 'json2csv';
import Papa from 'papaparse';
import {
  EPropertyType,
  TDatabaseExportOptions,
  TDatabaseImportOptions,
  TRecordsListResponse
} from '../types/database.types';
import * as databaseService from './database.service';
import {
  createExportFormatInvalidError,
  createImportFormatInvalidError,
  createImportDataInvalidError,
  createExportFailedError,
  createImportFailedError
} from '../utils/database-errors';

type ExportRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  [propertyName: string]: unknown;
};

type ImportRow = Record<string, unknown>;

type PropertyValue = string | number | boolean | Date | string[] | null;

type ParsedJsonData = {
  records?: unknown[];
} | unknown[];

export const exportDatabase = async (databaseId: string, userId: string, options: TDatabaseExportOptions): Promise<string | Buffer> => {
  try {
    const database = await databaseService.getDatabaseById(databaseId, userId);

    // Validate export format
    if (!['json', 'csv', 'xlsx'].includes(options.format)) {
      throw createExportFormatInvalidError(options.format);
    }

    // Get records with filters
    const queryParams = {
      viewId: options.viewId,
      filters: options.filters,
      limit: 10000 // Large limit to get all records
    };

    const recordsResult: TRecordsListResponse = await databaseService.getRecords(databaseId, userId, queryParams);
    const records = recordsResult.records;

  // Determine which properties to include
  const propertiesToInclude = options.includeProperties || database.properties.map(p => p.id);
  const includedProperties = database.properties.filter(p => propertiesToInclude.includes(p.id));

  // Transform records for export
  const exportData: ExportRecord[] = records.map(record => {
    const exportRecord: ExportRecord = {
      id: record._id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };

    includedProperties.forEach(property => {
      const value = record.properties[property.id];
      exportRecord[property.name] = formatValueForExport(value, property.type);
    });

    return exportRecord;
  });

  switch (options.format) {
    case 'csv':
      return exportToCsv(exportData);
    case 'xlsx':
      return exportToXlsx(exportData, database.name);
    case 'json':
    default:
      return JSON.stringify({
        database: {
          id: database._id,
          name: database.name,
          description: database.description,
          properties: includedProperties
        },
        records: exportData,
        exportedAt: new Date().toISOString(),
        totalRecords: exportData.length
      }, null, 2);
  }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
    throw createExportFailedError(errorMessage);
  }
};

export const importData = async (databaseId: string, userId: string, file: Express.Multer.File, options: TDatabaseImportOptions): Promise<{ imported: number; errors: string[] }> => {
  try {
    // Validate import format
    if (!['json', 'csv', 'xlsx'].includes(options.format)) {
      throw createImportFormatInvalidError(options.format);
    }

    const database = await databaseService.checkDatabasePermission(databaseId, userId, 'write');

  let data: ImportRow[] = [];
  const errors: string[] = [];

  try {
    switch (options.format) {
      case 'csv':
        data = await parseCsvFile(file);
        break;
      case 'xlsx':
        data = await parseXlsxFile(file);
        break;
      case 'json':
        const parsedJson: unknown = JSON.parse(file.buffer.toString('utf8'));
        if (Array.isArray(parsedJson)) {
          data = parsedJson;
        } else if (parsedJson && typeof parsedJson === 'object' && 'records' in parsedJson) {
          const jsonObject = parsedJson as { records: unknown };
          if (Array.isArray(jsonObject.records)) {
            data = jsonObject.records;
          } else {
            throw createImportDataInvalidError('JSON records property must be an array');
          }
        } else {
          throw createImportDataInvalidError('JSON must contain an array of records or an object with a records array');
        }
        break;
      default:
        throw createImportFormatInvalidError(options.format);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    throw createImportDataInvalidError(errorMessage);
  }

  if (data.length === 0) {
    throw createImportDataInvalidError('No data found in file');
  }

  // Process property mapping and create missing properties
  const propertyMapping = options.propertyMapping || {};
  const existingPropertyNames = database.properties.map(p => p.name.toLowerCase());

  // Get column names from first row
  const sampleRow = data[0];
  const columnNames = Object.keys(sampleRow);

  // Create missing properties if requested
  if (options.createMissingProperties) {
    for (const columnName of columnNames) {
      const mappedPropertyId = propertyMapping[columnName];

      // Skip if already mapped to existing property
      if (mappedPropertyId && database.properties.find(p => p.id === mappedPropertyId)) {
        continue;
      }

      // Skip if property with same name already exists
      if (existingPropertyNames.includes(columnName.toLowerCase())) {
        continue;
      }

      // Detect property type from sample data
      const sampleValue = sampleRow[columnName];
      const detectedType = detectPropertyType(sampleValue, data.map(row => row[columnName]));

      try {
        await databaseService.addProperty(databaseId, userId, {
          name: columnName,
          type: detectedType,
          description: `Auto-created from import`
        });

        // Refresh database to get new property
        const updatedDatabase = await databaseService.getDatabaseById(databaseId, userId);
        const newProperty = updatedDatabase.properties.find(p => p.name === columnName);
        if (newProperty) {
          propertyMapping[columnName] = newProperty.id;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create property "${columnName}": ${errorMessage}`);
      }
    }

    // Refresh database after adding properties
    database.properties = (await databaseService.getDatabaseById(databaseId, userId)).properties;
  }

  // Import records
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    try {
      // Map columns to properties
      const properties: Record<string, PropertyValue> = {};

      for (const [columnName, value] of Object.entries(row)) {
        let propertyId: string | undefined = propertyMapping[columnName];

        // If not mapped, try to find by name
        if (!propertyId) {
          const property = database.properties.find(p =>
            p.name.toLowerCase() === columnName.toLowerCase()
          );
          propertyId = property?.id;
        }

        if (propertyId) {
          const property = database.properties.find(p => p.id === propertyId);
          if (property && value !== null && value !== undefined && value !== '') {
            properties[propertyId] = parseValueForImport(value, property.type);
          }
        }
      }

      // Create record
      await databaseService.createRecord(databaseId, userId, { properties });
      imported++;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${i + 1}: ${errorMessage}`);
    }
  }

  return { imported, errors };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error; // Re-throw structured errors
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
    throw createImportFailedError(errorMessage);
  }
};

// Helper functions
const formatValueForExport = (value: unknown, propertyType: EPropertyType): string | number | boolean => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (propertyType) {
    case EPropertyType.DATE:
    case EPropertyType.CREATED_TIME:
    case EPropertyType.LAST_EDITED_TIME:
      return value instanceof Date ? value.toISOString() : String(value);
    case EPropertyType.MULTI_SELECT:
    case EPropertyType.FILE:
      return Array.isArray(value) ? value.join(', ') : String(value);
    case EPropertyType.RELATION:
      return Array.isArray(value) ? value.join(', ') : String(value);
    case EPropertyType.NUMBER:
      return typeof value === 'number' ? value : Number(value) || 0;
    case EPropertyType.CHECKBOX:
      return Boolean(value);
    default:
      return String(value);
  }
};

const parseValueForImport = (value: unknown, propertyType: EPropertyType): PropertyValue => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (propertyType) {
    case EPropertyType.NUMBER:
      const num = Number(value);
      return isNaN(num) ? null : num;

    case EPropertyType.CHECKBOX:
      if (typeof value === 'boolean') return value;
      const str = String(value).toLowerCase();
      return str === 'true' || str === '1' || str === 'yes' || str === 'on';

    case EPropertyType.DATE:
    case EPropertyType.CREATED_TIME:
    case EPropertyType.LAST_EDITED_TIME:
      const dateValue = new Date(String(value));
      return isNaN(dateValue.getTime()) ? null : dateValue;

    case EPropertyType.MULTI_SELECT:
      if (Array.isArray(value)) return value.map(v => String(v));
      return String(value).split(',').map(v => v.trim()).filter(v => v);

    case EPropertyType.RELATION:
      if (Array.isArray(value)) return value.map(v => String(v));
      return String(value).split(',').map(v => v.trim()).filter(v => v);

    default:
      return String(value);
  }
};

const detectPropertyType = (sampleValue: unknown, allValues: unknown[]): EPropertyType => {
  // Check if all non-empty values are numbers
  const nonEmptyValues = allValues.filter(v => v !== null && v !== undefined && v !== '');

  if (nonEmptyValues.length === 0) {
    return EPropertyType.TEXT;
  }

  // Check for boolean
  const booleanValues = nonEmptyValues.filter(v => {
    const str = String(v).toLowerCase();
    return ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(str);
  });

  if (booleanValues.length === nonEmptyValues.length) {
    return EPropertyType.CHECKBOX;
  }

  // Check for numbers
  const numberValues = nonEmptyValues.filter(v => !isNaN(Number(v)));
  if (numberValues.length === nonEmptyValues.length) {
    return EPropertyType.NUMBER;
  }

  // Check for dates
  const dateValues = nonEmptyValues.filter(v => !isNaN(Date.parse(String(v))));
  if (dateValues.length === nonEmptyValues.length) {
    return EPropertyType.DATE;
  }

  // Check for emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValues = nonEmptyValues.filter(v => emailRegex.test(String(v)));
  if (emailValues.length === nonEmptyValues.length) {
    return EPropertyType.EMAIL;
  }

  // Check for URLs
  const urlValues = nonEmptyValues.filter(v => {
    try {
      new URL(String(v));
      return true;
    } catch {
      return false;
    }
  });
  if (urlValues.length === nonEmptyValues.length) {
    return EPropertyType.URL;
  }

  // Default to text
  return EPropertyType.TEXT;
};

const exportToCsv = (data: ExportRecord[]): string => {
  if (data.length === 0) {
    return '';
  }

  const fields = Object.keys(data[0]);
  const parser = new CsvParser({ fields });
  return parser.parse(data);
};

const exportToXlsx = (data: ExportRecord[], sheetName: string): Buffer => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel sheet name limit

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const parseCsvFile = async (file: Express.Multer.File): Promise<ImportRow[]> => {
  return new Promise((resolve, reject) => {
    const csvContent = file.buffer.toString('utf8');

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results: Papa.ParseResult<ImportRow>) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors.map(e =>
            typeof e === 'object' && e !== null && 'message' in e
              ? String(e.message)
              : 'Unknown parsing error'
          );
          reject(createImportDataInvalidError(`CSV parsing errors: ${errorMessages.join(', ')}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error: Error) => {
        reject(createImportDataInvalidError(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};

const parseXlsxFile = async (file: Express.Multer.File): Promise<ImportRow[]> => {
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw createImportDataInvalidError('No worksheets found in Excel file');
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  // Ensure the data is properly typed as ImportRow[]
  return jsonData as ImportRow[];
};
export interface IAuth0Error {
  message?: string;
  statusCode?: number;
}

export interface IMongoCastError {
  name: 'CastError';
  path: string;
  value: unknown;
  kind: string;
}

export interface IMongoDuplicateError {
  name: 'MongoServerError';
  code: 11000;
  keyValue: Record<string, unknown>;
}

export interface IMongoValidationError {
  name: 'ValidationError';
  errors: Record<
    string,
    {
      message: string;
      path: string;
      value: unknown;
    }
  >;
}
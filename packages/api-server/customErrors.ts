export class HTTPError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.statusCode = statusCode;
  }
}

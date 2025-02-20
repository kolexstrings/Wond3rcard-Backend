class HttpException extends Error {
  public statusCode: number;
  public status: string;
  public message: string;

  constructor(statusCode: number, status: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.message = message;
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default HttpException;

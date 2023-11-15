export class ErrorResponse {
  success: false;
  constructor(public message: string, public statusCode: number) {
    this.success = false;
  }
}

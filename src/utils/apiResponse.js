/**
 * Standardized API Response Helper
 */
export class ApiResponse {
  static success(res, message = 'Success', data = {}, statusCode = 200, meta = {}) {
    const legacyData = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      // Keep the legacy static frontend working while preserving the modern
      // { success, data } response contract used by newer clients.
      ...legacyData,
      errors: [],
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    });
  }

  static error(res, message = 'Error occurred', errors = [], statusCode = 500, meta = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: message,
      data: null,
      errors: Array.isArray(errors) ? errors : [errors],
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    });
  }
}

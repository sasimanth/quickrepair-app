/**
 * Error Classifier Utility for Fixvo Authentication & API Requests
 * 
 * Classifies exceptions into diagnostic codes for development logs:
 * - NETWORK_UNREACHABLE
 * - CORS_ERROR
 * - HTTP_4XX
 * - HTTP_5XX
 * - TIMEOUT
 * - INVALID_RESPONSE
 * - AUTHENTICATION_FAILURE
 * 
 * Returns safe, user-friendly messages without exposing sensitive tokens or credentials.
 */

export const classifyAuthError = (err) => {
  if (!err) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    };
  }

  // 1. Connection Timeout
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    console.error('🔍 [AuthDiagnostic] Code: TIMEOUT | Details:', err.message);
    return {
      code: 'TIMEOUT',
      message: 'Connection timed out while reaching Fixvo servers. Please check your internet connection and try again.'
    };
  }

  // 2. Network Unreachable / CORS Blocked (No Response Object)
  if (!err.response) {
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
      console.error('🔍 [AuthDiagnostic] Code: NETWORK_UNREACHABLE / CORS_ERROR | Message:', err.message);
      return {
        code: 'NETWORK_UNREACHABLE',
        message: 'Network Error: Unable to reach Fixvo authentication servers. Please verify your connection.'
      };
    }
    console.error('🔍 [AuthDiagnostic] Code: NETWORK_UNREACHABLE | Message:', err.message);
    return {
      code: 'NETWORK_UNREACHABLE',
      message: 'Unable to connect to service. Please check your internet connection.'
    };
  }

  const status = err.response.status;
  const serverMsg = err.response.data?.message;

  // 3. Authentication Failure (401 / 403)
  if (status === 401 || status === 403) {
    console.error(`🔍 [AuthDiagnostic] Code: AUTHENTICATION_FAILURE | HTTP ${status} | Server Msg:`, serverMsg || err.message);
    return {
      code: 'AUTHENTICATION_FAILURE',
      message: serverMsg || 'Invalid credentials or unauthorized access.'
    };
  }

  // 4. Client Request Error (4xx)
  if (status >= 400 && status < 500) {
    console.error(`🔍 [AuthDiagnostic] Code: HTTP_4XX | HTTP ${status} | Server Msg:`, serverMsg || err.message);
    return {
      code: 'HTTP_4XX',
      message: serverMsg || 'Please verify your details and try again.'
    };
  }

  // 5. Server Maintenance / Internal Error (5xx)
  if (status >= 500) {
    console.error(`🔍 [AuthDiagnostic] Code: HTTP_5XX | HTTP ${status} | Server Msg:`, serverMsg || err.message);
    return {
      code: 'HTTP_5XX',
      message: serverMsg || 'Fixvo server is experiencing heavy load or maintenance. Please try again shortly.'
    };
  }

  // 6. Invalid Response Format
  console.error('🔍 [AuthDiagnostic] Code: INVALID_RESPONSE | Data:', err.response.data);
  return {
    code: 'INVALID_RESPONSE',
    message: serverMsg || 'Received an unexpected response from server.'
  };
};

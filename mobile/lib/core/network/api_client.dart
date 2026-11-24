import 'dart:convert';

class ApiResponse {
  final int statusCode;
  final bool isSuccess;
  final Map<String, dynamic> data;
  final String? errorMessage;

  ApiResponse({
    required this.statusCode,
    required this.isSuccess,
    required this.data,
    this.errorMessage,
  });

  factory ApiResponse.fromJson(int statusCode, String jsonStr) {
    try {
      final decoded = jsonDecode(jsonStr);
      return ApiResponse(
        statusCode: statusCode,
        isSuccess: statusCode >= 200 && statusCode < 300,
        data: decoded is Map<String, dynamic> ? decoded : {'data': decoded},
      );
    } catch (e) {
      return ApiResponse(
        statusCode: statusCode,
        isSuccess: false,
        data: {},
        errorMessage: 'Failed to parse server response',
      );
    }
  }

  factory ApiResponse.success(Map<String, dynamic> data) {
    return ApiResponse(
      statusCode: 200,
      isSuccess: true,
      data: data,
    );
  }

  factory ApiResponse.error(int statusCode, String message) {
    return ApiResponse(
      statusCode: statusCode,
      isSuccess: false,
      data: {},
      errorMessage: message,
    );
  }
}

class ApiClient {
  final String baseUrl;
  String? authToken;
  String organizationId;
  String userId;

  ApiClient({
    this.baseUrl = 'http://10.0.2.2:8000/api/v1',
    this.authToken,
    this.organizationId = 'org-11111111-1111-1111-1111-111111111111',
    this.userId = 'usr-inspector-01',
  });

  Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Organization-Id': organizationId,
        'X-User-Id': userId,
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  Map<String, String> headersWithIdempotency(String idempotencyKey) => {
        ...defaultHeaders,
        'Idempotency-Key': idempotencyKey,
      };

  /// Set authenticated session credentials
  void setSession({required String token, required String orgId, required String user}) {
    authToken = token;
    organizationId = orgId;
    userId = user;
  }

  /// Clear session credentials
  void clearSession() {
    authToken = null;
  }

  /// Diagnostic Health Check
  Future<Map<String, dynamic>> checkHealth() async {
    return {
      'client': 'vahancheck_mobile',
      'base_url': baseUrl,
      'status': 'ready',
      'min_target_dp': 48,
      'offline_capable': true,
      'organization_id': organizationId,
    };
  }
}

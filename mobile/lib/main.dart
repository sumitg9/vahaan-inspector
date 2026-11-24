import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/network/api_client.dart';
import 'features/auth/presentation/login_screen.dart';

void main() {
  runApp(const VahanCheckMobileApp());
}

class VahanCheckMobileApp extends StatelessWidget {
  const VahanCheckMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiClient = ApiClient(baseUrl: 'http://10.0.2.2:8000/api/v1');

    return MaterialApp(
      title: 'VahanCheck Inspector',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: LoginScreen(apiClient: apiClient),
    );
  }
}

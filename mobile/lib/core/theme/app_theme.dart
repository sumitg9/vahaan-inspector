import 'package:flutter/material.dart';

class AppTheme {
  // Brand & Navigation Surfaces
  static const Color darkNavy = Color(0xFF0F172A);
  static const Color darkNavySurface = Color(0xFF1E293B);
  static const Color canvasLight = Color(0xFFF8FAFC);
  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color primaryBlueDark = Color(0xFF1D4ED8);

  // Semantic Status Colors
  static const Color tealSuccess = Color(0xFF0D9488);
  static const Color amberWarning = Color(0xFFD97706);
  static const Color redAlert = Color(0xFFDC2626);

  // Minimum touch target dimension for outdoor field usability
  static const double minTouchTargetSize = 48.0;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: canvasLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
        secondary: tealSuccess,
        error: redAlert,
        surface: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(minTouchTargetSize, minTouchTargetSize),
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.0),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../navigation/presentation/main_nav_screen.dart';

class LoginScreen extends StatefulWidget {
  final ApiClient apiClient;

  const LoginScreen({super.key, required this.apiClient});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'inspector@vahancheck.com');
  final _passwordController = TextEditingController(text: 'password123');
  String _selectedRole = 'INSPECTOR';
  bool _isLoading = false;

  void _handleLogin() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 400));

    // Configure authenticated session
    widget.apiClient.setSession(
      token: 'mock_token_${DateTime.now().millisecondsSinceEpoch}',
      orgId: 'org-11111111-1111-1111-1111-111111111111',
      user: _selectedRole == 'INSPECTOR' ? 'usr-inspector-01' : 'usr-manager-01',
    );

    setState(() => _isLoading = false);

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => MainNavScreen(
            apiClient: widget.apiClient,
            userRole: _selectedRole,
            userEmail: _emailController.text,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkNavy,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Brand Icon
                const Icon(
                  Icons.shield_outlined,
                  size: 64,
                  color: AppTheme.primaryBlue,
                ),
                const SizedBox(height: 12),
                const Text(
                  'VAHANCHECK',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                    color: Colors.white,
                  ),
                ),
                const Text(
                  'Inspector & Surveyor Field Suite',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.tealSuccess,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 32),

                // Card Container
                Container(
                  padding: const EdgeInsets.all(20.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16.0),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Authorized Personnel Login',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Role Switcher
                      SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(
                            value: 'INSPECTOR',
                            label: Text('Field Inspector'),
                            icon: Icon(Icons.badge_outlined),
                          ),
                          ButtonSegment(
                            value: 'MANAGER',
                            label: Text('Valuer / QC'),
                            icon: Icon(Icons.manage_accounts_outlined),
                          ),
                        ],
                        selected: {_selectedRole},
                        onSelectionChanged: (val) {
                          setState(() {
                            _selectedRole = val.first;
                            _emailController.text = _selectedRole == 'INSPECTOR'
                                ? 'inspector@vahancheck.com'
                                : 'manager@vahancheck.com';
                          });
                        },
                      ),
                      const SizedBox(height: 16),

                      // Email Field
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          labelText: 'Work Email Address',
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Password Field
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Security Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Submit Button (Min 48dp touch target)
                      SizedBox(
                        height: AppTheme.minTouchTargetSize,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('AUTHENTICATE SESSION'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Offline Notice
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock_clock, size: 14, color: Colors.white70),
                    SizedBox(width: 6),
                    Text(
                      'AES-256 Encrypted SQLite Storage Active',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

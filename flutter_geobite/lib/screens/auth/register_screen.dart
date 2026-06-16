import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../widgets/glass_toast.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController(); // local digits only (9-10 digits)
  String _role = 'customer';
  bool _agreedToTerms = false;
  double _passwordStrength = 0.0;
  String _passwordStrengthText = '';
  Color _passwordStrengthColor = Colors.grey;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  void _checkPasswordStrength(String value) {
    double strength = 0;
    if (value.length >= 8) strength += 0.25;
    if (value.contains(RegExp(r'[A-Z]'))) strength += 0.25;
    if (value.contains(RegExp(r'[a-z]'))) strength += 0.25;
    if (value.contains(RegExp(r'[0-9!@#\$&*~]'))) strength += 0.25;

    setState(() {
      _passwordStrength = strength;
      if (value.isEmpty) {
        _passwordStrengthText = '';
        _passwordStrengthColor = Colors.grey;
      } else if (strength <= 0.25) {
        _passwordStrengthText = 'Weak';
        _passwordStrengthColor = Colors.red;
      } else if (strength <= 0.5) {
        _passwordStrengthText = 'Fair';
        _passwordStrengthColor = Colors.orange;
      } else if (strength <= 0.75) {
        _passwordStrengthText = 'Good';
        _passwordStrengthColor = Colors.yellow;
      } else {
        _passwordStrengthText = 'Strong';
        _passwordStrengthColor = Colors.green;
      }
    });
  }

  Future<void> _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;
    // Phone: combine +63 prefix with local number input
    final localDigits = _phoneController.text.trim();
    if (localDigits.isEmpty) {
      GlassToast.info(context, 'Please enter your mobile number');
      return;
    }
    if (localDigits.length < 9 || localDigits.length > 10) {
      GlassToast.error(context, 'Mobile number must be 9–10 digits after +63 (e.g. 9171234567)');
      return;
    }
    final phone = '+63$localDigits';

    if (name.isEmpty || email.isEmpty || password.isEmpty || confirmPassword.isEmpty) {
      GlassToast.info(context, 'Please fill in all required fields');
      return;
    }

    if (password != confirmPassword) {
      GlassToast.error(context, 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      GlassToast.error(context, 'Password must be at least 8 characters long');
      return;
    }

    if (!password.contains(RegExp(r'[A-Z]'))) {
      GlassToast.error(context, 'Password must contain at least one capital letter');
      return;
    }

    if (!password.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>\-_=+\\\/\[\]]'))) {
      GlassToast.error(context, 'Password must contain at least one symbol/special character');
      return;
    }

    if (!_agreedToTerms) {
      GlassToast.info(context, 'You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await Provider.of<AuthProvider>(context, listen: false).signUp(
        name: name,
        email: email,
        password: password,
        role: _role,
        phone: phone,
      );
      // Sign out immediately so they are forced to log in manually
      await Provider.of<AuthProvider>(context, listen: false).signOut();
      
      if (mounted) {
        GlassToast.success(context, 'Account created successfully! Please sign in.');
        Navigator.of(context).pop(); // Pop back to LoginScreen
      }
    } catch (e) {
      if (mounted) GlassToast.error(context, e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Custom Header with Back button and Brand Name
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(
                      Icons.arrow_back_ios_new,
                      color: theme.colorScheme.onSurface,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const Spacer(),
                  ShaderMask(
                    shaderCallback: (bounds) => AppColors.primaryGradient.createShader(bounds),
                    child: Text(
                      'GEOBITES',
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.0,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), // To balance the back button width
                  const Spacer(),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Create Account',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Join GeoBites to start ordering or delivering',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(height: 32),
                    TextField(
                      controller: _nameController,
                      style: TextStyle(color: theme.colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Full Name',
                        labelStyle: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.person_outline)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      style: TextStyle(color: theme.colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Email Address',
                        labelStyle: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.email_outlined)),
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),
                    // ── Phone number field with locked +63 prefix ────────────
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Locked +63 badge
                        Container(
                          height: 56,
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.08)
                                : Colors.white.withValues(alpha: 0.6),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.05),
                            ),
                            borderRadius: BorderRadius.circular(kSharpRadius),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('🇵🇭', style: TextStyle(fontSize: 18)),
                              const SizedBox(width: 6),
                              Text(
                                '+63',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Local digits input
                        Expanded(
                          child: TextField(
                            controller: _phoneController,
                            style: TextStyle(color: theme.colorScheme.onSurface),
                            decoration: InputDecoration(
                              labelText: 'Mobile Number',
                              hintText: '9XX XXX XXXX',
                              labelStyle: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                              filled: true,
                              fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                              counterText: '${_phoneController.text.length}/10',
                            ),
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(10),
                            ],
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      style: TextStyle(color: theme.colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        labelStyle: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.lock_outline)),
                        suffixIcon: Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                        ),
                      ),
                      obscureText: _obscurePassword,
                      onChanged: _checkPasswordStrength,
                    ),
                    if (_passwordController.text.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: _passwordStrength,
                                backgroundColor: theme.colorScheme.onSurface.withValues(alpha: 0.1),
                                valueColor: AlwaysStoppedAnimation<Color>(_passwordStrengthColor),
                                minHeight: 6,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _passwordStrengthText,
                            style: TextStyle(
                              color: _passwordStrengthColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextField(
                      controller: _confirmPasswordController,
                      style: TextStyle(color: theme.colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Confirm Password',
                        labelStyle: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.lock_outline)),
                        suffixIcon: Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: IconButton(
                            icon: Icon(
                              _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureConfirmPassword = !_obscureConfirmPassword;
                              });
                            },
                          ),
                        ),
                      ),
                      obscureText: _obscureConfirmPassword,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _role,
                      style: TextStyle(color: theme.colorScheme.onSurface),
                      dropdownColor: theme.colorScheme.surface,
                      decoration: InputDecoration(
                        labelText: 'Account Type',
                        labelStyle: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.badge_outlined)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'customer', child: Text('Customer')),
                        DropdownMenuItem(value: 'seller', child: Text('Vendor / Seller')),
                        DropdownMenuItem(value: 'rider', child: Text('Delivery Rider')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _role = val);
                      },
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Checkbox(
                          value: _agreedToTerms,
                          onChanged: (val) {
                            setState(() => _agreedToTerms = val ?? false);
                          },
                          activeColor: AppColors.primary,
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _agreedToTerms = !_agreedToTerms);
                            },
                            child: Text.rich(
                              TextSpan(
                                text: 'I agree to the ',
                                style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 13),
                                children: [
                                  TextSpan(
                                    text: 'Terms of Service',
                                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                  ),
                                  const TextSpan(text: ' and '),
                                  TextSpan(
                                    text: 'Privacy Policy',
                                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(kSharpRadius),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 5),
                          )
                        ],
                      ),
                      child: FilledButton(
                        onPressed: _isLoading ? null : _handleRegister,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 20),
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                        ),
                        child: _isLoading
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('SIGN UP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: RichText(
                        text: TextSpan(
                          text: 'Already have an account? ',
                          style: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                          children: const [
                            TextSpan(
                              text: 'Sign in',
                              style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

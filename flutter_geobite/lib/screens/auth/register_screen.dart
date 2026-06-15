import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:geolocator/geolocator.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';

import '../../theme/glass_theme.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  String _role = 'customer';
  bool _isLoading = false;
  String? _error;

  Future<void> _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final phone = _phoneController.text.trim();

    if (name.isEmpty || email.isEmpty || password.isEmpty || phone.isEmpty) {
      setState(() => _error = 'Please fill in all required fields');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await Provider.of<AuthProvider>(context, listen: false).signUp(
        name: name,
        email: email,
        password: password,
        role: _role,
        phone: phone,
      );
      
      // Successfully registered, now ask for location permissions
      final status = await Permission.location.request();
      if (status.isGranted) {
        try {
          final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
          // Optional: We could save this initial GPS location to the profile here 
          // or just proceed since they granted permission.
        } catch (e) {
          print("Location fetch failed after permission granted: $e");
        }
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Background for the 3D art
      body: Column(
        children: [
          Expanded(
            flex: 2,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Image.asset('assets/images/login_illustration.png', fit: BoxFit.contain),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? Colors.white.withValues(alpha: 0.05) 
                        : Colors.transparent,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).brightness == Brightness.dark ? Colors.black.withValues(alpha: 0.8) : Colors.black.withValues(alpha: 0.05),
                    blurRadius: 30,
                    offset: const Offset(0, -10),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 40.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) => AppColors.primaryGradient.createShader(bounds),
                        child: Text(
                          'GEOBITES',
                          style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 4.0,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create an account',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                      TextField(
                        controller: _nameController,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                        decoration: InputDecoration(
                          labelText: 'Full Name',
                          labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          filled: true,
                          fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                          prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.person_outline)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                        decoration: InputDecoration(
                          labelText: 'Email Address',
                          labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          filled: true,
                          fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                          prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.email_outlined)),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _phoneController,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                        decoration: InputDecoration(
                          labelText: 'Mobile Number',
                          labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          filled: true,
                          fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                          prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.phone_outlined)),
                        ),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                        decoration: InputDecoration(
                          labelText: 'Password',
                          labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          filled: true,
                          fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                          prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.lock_outline)),
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _role,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                        dropdownColor: Theme.of(context).colorScheme.surface,
                        decoration: InputDecoration(
                          labelText: 'Account Type',
                          labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          filled: true,
                          fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
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
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style: TextStyle(color: Theme.of(context).colorScheme.error),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      const SizedBox(height: 32),
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(30),
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
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          ),
                          child: _isLoading 
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('SIGN UP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.white)),
                        ),
                      ),
                      const SizedBox(height: 24),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (_) => LoginScreen()),
                          );
                        },
                        child: RichText(
                          text: TextSpan(
                            text: 'Already have an account? ',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
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
            ),
          ),
        ],
      ),
    );
  }
}

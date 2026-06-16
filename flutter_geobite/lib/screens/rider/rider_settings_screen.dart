import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../core/api_client.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';
import '../../services/upload_service.dart';

class RiderSettingsScreen extends StatefulWidget {
  const RiderSettingsScreen({Key? key}) : super(key: key);

  @override
  State<RiderSettingsScreen> createState() => _RiderSettingsScreenState();
}

class _RiderSettingsScreenState extends State<RiderSettingsScreen> {
  final _phoneCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  bool _isSaving = false;
  PlatformFile? _selectedImageFile;
  String? _existingImageUrl;
  bool _isUploadingImage = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  void _loadUserData() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user != null) {
      if (user.phone != null) _phoneCtrl.text = user.phone!;
      _nameCtrl.text = user.name;
      _emailCtrl.text = user.email;
      _existingImageUrl = user.image;
    }
  }

  Future<void> _saveProfile() async {
    final name = _nameCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    
    if (name.isEmpty || phone.isEmpty) {
      GlassToast.info(context, 'Please fill all required fields');
      return;
    }
    final phonePattern = RegExp(r'^(?:\+639|09)\d{9}$');
    if (!phonePattern.hasMatch(phone)) {
      GlassToast.error(context, 'Phone must start with +639 or 09 and have 11 digits');
      return;
    }

    setState(() => _isSaving = true);
    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        await apiClient.dio.post('/auth/update-user', data: {
          'name': name,
          'phone': phone,
          'image': _existingImageUrl,
        });

        if (!mounted) return;
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        await authProvider.checkSession();
        
        if (!mounted) return;
        GlassToast.success(context, 'Profile changes saved!');
      }
    } catch (e) {
      if (!mounted) return;
      GlassToast.error(context, 'Error saving: $e');
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _pickProfileImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: kIsWeb,
      );
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.single;
        setState(() {
          _isUploadingImage = true;
          _selectedImageFile = file;
        });

        // Upload immediately
        String? uploadedUrl;
        if (kIsWeb && file.bytes != null) {
          uploadedUrl = await uploadService.uploadImageBytes(file.bytes!, file.name);
        } else if (!kIsWeb && file.path != null) {
          uploadedUrl = await uploadService.uploadImage(file.path!);
        }

        setState(() {
          if (uploadedUrl != null) {
            _existingImageUrl = uploadedUrl;
          }
          _isUploadingImage = false;
        });
      }
    } catch (e) {
      setState(() => _isUploadingImage = false);
      if (mounted) GlassToast.error(context, 'Failed to upload profile picture: $e');
    }
  }

  Widget _buildProfilePictureSection() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final initials = user != null && user.name.isNotEmpty
        ? user.name.split(' ').map((e) => e[0]).take(2).join('').toUpperCase()
        : '?';

    ImageProvider? imageProvider;
    if (_selectedImageFile != null) {
      if (kIsWeb && _selectedImageFile!.bytes != null) {
        imageProvider = MemoryImage(_selectedImageFile!.bytes!);
      } else if (!kIsWeb && _selectedImageFile!.path != null) {
        imageProvider = FileImage(File(_selectedImageFile!.path!));
      }
    } else if (_existingImageUrl != null && _existingImageUrl!.isNotEmpty) {
      final fullUrl = _existingImageUrl!.startsWith('http')
          ? _existingImageUrl!
          : "${ApiClient.socketUrl}$_existingImageUrl";
      imageProvider = NetworkImage(fullUrl);
    }

    return Center(
      child: Stack(
        alignment: Alignment.bottomRight,
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1), width: 4),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: CircleAvatar(
              radius: 54,
              backgroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
              backgroundImage: imageProvider,
              child: imageProvider == null && !_isUploadingImage
                  ? Text(
                      initials,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    )
                  : null,
            ),
          ),
          if (_isUploadingImage)
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.black45,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              ),
            ),
          GestureDetector(
            onTap: _isUploadingImage ? null : _pickProfileImage,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(color: Theme.of(context).cardColor, width: 2),
              ),
              child: const Icon(
                Icons.camera_alt,
                size: 20,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField(String label, IconData icon, TextEditingController controller, {bool readOnly = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontSize: 12, letterSpacing: 1, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
          child: TextField(
            controller: controller,
            readOnly: readOnly,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            style: TextStyle(fontSize: 16, color: readOnly ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5) : Theme.of(context).colorScheme.onSurface),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: Navigator.canPop(context),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              color: isDark ? Colors.white : Colors.black,
              child: Text('G', style: TextStyle(color: isDark ? Colors.black : Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            ),
            const SizedBox(width: 12),
            Text('GEOBITES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).colorScheme.onSurface, letterSpacing: 1.5)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () => Provider.of<ThemeProvider>(context, listen: false).toggleTheme(),
          ),
          IconButton(
            icon: Icon(Icons.menu, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('CONFIGURE', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Settings', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Theme.of(context).colorScheme.onSurface, letterSpacing: -1)),
            const SizedBox(height: 16),
            Text(
              'Configure your profile settings, business details, and set system preferences.',
              style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), height: 1.5),
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
              child: Text('BACK TO DASHBOARD', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            ),
            const SizedBox(height: 32),
            
            Text('PROFILE DETAILS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 24),
            _buildProfilePictureSection(),
            const SizedBox(height: 32),
            _buildFormField('FULL NAME', Icons.person_outline, _nameCtrl),
            const SizedBox(height: 24),
            _buildFormField('PHONE NUMBER', Icons.phone_outlined, _phoneCtrl),
            const SizedBox(height: 24),
            _buildFormField('EMAIL ADDRESS', Icons.email_outlined, _emailCtrl, readOnly: true),
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: FilledButton(
                onPressed: _isSaving ? null : _saveProfile,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSaving 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 48),
            Center(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontSize: 16, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                onPressed: () => auth.signOut(),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}

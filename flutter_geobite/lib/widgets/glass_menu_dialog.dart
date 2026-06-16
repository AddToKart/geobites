import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:ui';
import '../theme/glass_theme.dart';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import '../services/upload_service.dart';
import '../widgets/glass_toast.dart';

import '../models/menu_item.dart';

class GlassMenuDialog extends StatefulWidget {
  final Function(String name, String description, double price, String? imageUrl) onSave;
  final MenuItem? initialItem;

  const GlassMenuDialog({Key? key, required this.onSave, this.initialItem}) : super(key: key);

  @override
  _GlassMenuDialogState createState() => _GlassMenuDialogState();
}

class _GlassMenuDialogState extends State<GlassMenuDialog> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _imageUrlController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  PlatformFile? _selectedFile;
  String? _existingImageUrl;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialItem != null) {
      _nameController.text = widget.initialItem!.name;
      _descController.text = widget.initialItem!.description ?? '';
      _priceController.text = widget.initialItem!.price.toString();
      _existingImageUrl = widget.initialItem!.imageUrl;
    }
  }

  Future<void> _pickImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: kIsWeb, // Required for web to get bytes
      );
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedFile = result.files.single;
          _existingImageUrl = null;
        });
      }
    } catch (e) {
      if (mounted) GlassToast.error(context, 'Failed to pick image: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.1),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                )
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                    Text(
                      widget.initialItem == null ? 'Add Menu Item' : 'Edit Menu Item',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  const SizedBox(height: 24),
                  _buildTextField(
                    context: context,
                    controller: _nameController,
                    label: 'Name',
                    icon: Icons.fastfood_outlined,
                    validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    context: context,
                    controller: _descController,
                    label: 'Description',
                    icon: Icons.description_outlined,
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    context: context,
                    controller: _priceController,
                    label: 'Price',
                    prefixText: '₱ ',
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                    validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: _pickImage,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      height: 120,
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                        image: _selectedFile != null
                            ? (kIsWeb && _selectedFile!.bytes != null
                                ? DecorationImage(image: MemoryImage(_selectedFile!.bytes!), fit: BoxFit.cover)
                                : DecorationImage(image: FileImage(File(_selectedFile!.path!)), fit: BoxFit.cover))
                            : (_existingImageUrl != null && _existingImageUrl!.isNotEmpty
                                ? DecorationImage(image: NetworkImage(_existingImageUrl!), fit: BoxFit.cover)
                                : null),
                      ),
                      child: _selectedFile == null && (_existingImageUrl == null || _existingImageUrl!.isEmpty)
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_photo_alternate_outlined, size: 40, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                                const SizedBox(height: 8),
                                Text('Tap to select image', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                              ],
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Text('Cancel', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: FilledButton(
                          onPressed: _isSubmitting ? null : () async {
                            if (_formKey.currentState!.validate()) {
                              setState(() => _isSubmitting = true);
                              try {
                                String? finalImageUrl = _existingImageUrl;
                                if (_selectedFile != null) {
                                  if (kIsWeb && _selectedFile!.bytes != null) {
                                    finalImageUrl = await uploadService.uploadImageBytes(_selectedFile!.bytes!, _selectedFile!.name);
                                  } else if (_selectedFile!.path != null) {
                                    finalImageUrl = await uploadService.uploadImage(_selectedFile!.path!);
                                  }
                                }
                                
                                widget.onSave(
                                  _nameController.text.trim(),
                                  _descController.text.trim(),
                                  double.tryParse(_priceController.text.trim()) ?? 0.0,
                                  finalImageUrl,
                                );
                                if (mounted) Navigator.pop(context);
                              } catch (e) {
                                if (mounted) GlassToast.error(context, e.toString());
                                setState(() => _isSubmitting = false);
                              }
                            }
                          },
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _isSubmitting 
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text(widget.initialItem == null ? 'Save Item' : 'Save Changes', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required BuildContext context,
    required TextEditingController controller,
    required String label,
    IconData? icon,
    String? prefixText,
    int maxLines = 1,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
        prefixIcon: icon != null && maxLines == 1 ? Icon(icon, color: AppColors.primary.withValues(alpha: 0.5)) : null,
        prefixText: prefixText,
        prefixStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
        filled: true,
        fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.red.withValues(alpha: 0.5), width: 2),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:ui';
import '../theme/glass_theme.dart';

import '../models/menu_item.dart';

class GlassMenuDialog extends StatefulWidget {
  final Function(String name, String description, double price) onSave;
  final MenuItem? initialItem;

  const GlassMenuDialog({Key? key, required this.onSave, this.initialItem}) : super(key: key);

  @override
  _GlassMenuDialogState createState() => _GlassMenuDialogState();
}

class _GlassMenuDialogState extends State<GlassMenuDialog> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    if (widget.initialItem != null) {
      _nameController.text = widget.initialItem!.name;
      _descController.text = widget.initialItem!.description ?? '';
      _priceController.text = widget.initialItem!.price.toString();
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
                          onPressed: () {
                            if (_formKey.currentState!.validate()) {
                              widget.onSave(
                                _nameController.text.trim(),
                                _descController.text.trim(),
                                double.parse(_priceController.text),
                              );
                              Navigator.pop(context);
                            }
                          },
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Text(widget.initialItem == null ? 'Save Item' : 'Save Changes', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
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

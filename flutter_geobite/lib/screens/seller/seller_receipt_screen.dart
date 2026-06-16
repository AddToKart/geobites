import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../theme/glass_theme.dart';
import '../../utils/pdf_generator.dart';
import 'package:intl/intl.dart';

class SellerReceiptScreen extends StatefulWidget {
  final Order order;

  const SellerReceiptScreen({Key? key, required this.order}) : super(key: key);

  @override
  State<SellerReceiptScreen> createState() => _SellerReceiptScreenState();
}

class _SellerReceiptScreenState extends State<SellerReceiptScreen> {
  bool _isGeneratingPdf = false;

  Future<void> _handleDownload() async {
    setState(() => _isGeneratingPdf = true);
    try {
      await ReceiptPdfGenerator.downloadReceipt(widget.order);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download PDF: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }
    }
  }

  Future<void> _handlePrint() async {
    setState(() => _isGeneratingPdf = true);
    try {
      await ReceiptPdfGenerator.printReceipt(widget.order);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to print receipt: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: const GlassAppBar(
        title: Text('Transaction Complete', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Success Icon
                const Icon(Icons.check_circle_outline, color: Colors.green, size: 80),
                const SizedBox(height: 16),
                const Text(
                  'Payment Successful',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 32),

                // Digital Receipt Preview Card
                NeumorphicCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        widget.order.vendor?.name ?? 'Geobites Store',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      
                      _buildRow('Date', DateFormat('MM/dd/yyyy HH:mm').format(DateTime.tryParse(widget.order.createdAt)?.toLocal() ?? DateTime.now())),
                      _buildRow('Order ID', widget.order.id.length > 8 ? widget.order.id.substring(0, 8) : widget.order.id),
                      if (widget.order.paymentMethod != null)
                        _buildRow('Payment', widget.order.paymentMethod!),
                      
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      
                      const Row(
                        children: [
                          Expanded(flex: 2, child: Text('Item', style: TextStyle(fontWeight: FontWeight.bold))),
                          Expanded(flex: 1, child: Text('Qty', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold))),
                          Expanded(flex: 1, child: Text('Price', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold))),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...widget.order.items.map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 2, child: Text(item.name)),
                            Expanded(flex: 1, child: Text('${item.quantity}', textAlign: TextAlign.center)),
                            Expanded(flex: 1, child: Text('₱${(item.price * item.quantity).toStringAsFixed(2)}', textAlign: TextAlign.right)),
                          ],
                        ),
                      )),
                      
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('TOTAL', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Text(
                            '₱${widget.order.totalAmount.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Actions
                if (_isGeneratingPdf)
                  const Center(child: CircularProgressIndicator())
                else
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _handleDownload,
                          icon: const Icon(Icons.download),
                          label: const Text('Download PDF'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _handlePrint,
                          icon: const Icon(Icons.print),
                          label: const Text('Print Receipt'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                          ),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    // Close the receipt screen, return to POS
                    Navigator.pop(context);
                  },
                  child: const Text('Back to POS / New Order', style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

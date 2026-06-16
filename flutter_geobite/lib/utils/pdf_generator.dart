import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';

class ReceiptPdfGenerator {
  static Future<Uint8List> generateReceipt(Order order) async {
    final pdf = pw.Document(version: PdfVersion.pdf_1_5, compress: true);

    // Using a standard 80mm receipt width. 
    // 80mm is ~226 points. We'll use a slightly larger page length that adjusts to content.
    final pageFormat = PdfPageFormat.roll80;

    // Load fonts if needed, but for simple receipts standard fonts work.
    
    pdf.addPage(
      pw.Page(
        pageFormat: pageFormat,
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            mainAxisSize: pw.MainAxisSize.min,
            children: [
              // Header
              pw.Text(
                order.vendor?.name ?? 'Geobites Store',
                style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
                textAlign: pw.TextAlign.center,
              ),
              pw.SizedBox(height: 4),
              pw.Text(
                'POS Receipt',
                style: const pw.TextStyle(fontSize: 12),
                textAlign: pw.TextAlign.center,
              ),
              pw.Divider(borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 8),

              // Order Details
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Date:', style: const pw.TextStyle(fontSize: 10)),
                  pw.Text(
                    DateFormat('MM/dd/yyyy HH:mm').format(DateTime.tryParse(order.createdAt)?.toLocal() ?? DateTime.now()),
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Order ID:', style: const pw.TextStyle(fontSize: 10)),
                  pw.Text(
                    order.id.length > 8 ? order.id.substring(0, 8) : order.id,
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),
              if (order.paymentMethod != null)
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Payment:', style: const pw.TextStyle(fontSize: 10)),
                    pw.Text(order.paymentMethod!, style: const pw.TextStyle(fontSize: 10)),
                  ],
                ),
              pw.SizedBox(height: 8),
              pw.Divider(borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 8),

              // Items
              pw.Row(
                children: [
                  pw.Expanded(flex: 2, child: pw.Text('Item', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 1, child: pw.Text('Qty', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 1, child: pw.Text('Price', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                ],
              ),
              pw.SizedBox(height: 4),
              ...order.items.map((item) {
                return pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 2),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Expanded(flex: 2, child: pw.Text(item.name, style: const pw.TextStyle(fontSize: 10))),
                      pw.Expanded(flex: 1, child: pw.Text('${item.quantity}', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 10))),
                      pw.Expanded(flex: 1, child: pw.Text('P${(item.price * item.quantity).toStringAsFixed(2)}', textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 10))),
                    ],
                  ),
                );
              }),
              
              pw.SizedBox(height: 8),
              pw.Divider(borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 8),

              // Totals
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Total Items:', style: const pw.TextStyle(fontSize: 10)),
                  pw.Text(
                    '${order.items.fold<int>(0, (sum, item) => sum + item.quantity)}',
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),
              pw.SizedBox(height: 4),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('TOTAL', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.Text(
                    'P${order.totalAmount.toStringAsFixed(2)}',
                    style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
                  ),
                ],
              ),
              pw.SizedBox(height: 16),
              pw.Divider(borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 16),

              // Footer
              pw.Text(
                'Thank you for your purchase!',
                style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
                textAlign: pw.TextAlign.center,
              ),
              pw.SizedBox(height: 24),
              pw.Text(
                'Powered by Geobites',
                style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey),
                textAlign: pw.TextAlign.center,
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static Future<void> printReceipt(Order order) async {
    final pdfBytes = await generateReceipt(order);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'Receipt_${order.id}',
    );
  }

  static Future<void> downloadReceipt(Order order) async {
    final pdfBytes = await generateReceipt(order);
    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: 'Receipt_${order.id}.pdf',
    );
  }
}

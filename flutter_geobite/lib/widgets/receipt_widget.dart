import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';

class ReceiptWidget extends StatelessWidget {
  final Order order;

  const ReceiptWidget({Key? key, required this.order}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Calculate subtotal
    double subtotal = 0;
    for (var item in order.items) {
      subtotal += item.price * item.quantity;
    }
    
    // Calculate delivery fee
    double deliveryFee = order.totalAmount - subtotal;
    if (deliveryFee < 0) deliveryFee = 0;

    // Parse date
    DateTime date;
    try {
      date = DateTime.parse(order.createdAt);
    } catch (e) {
      date = DateTime.now();
    }
    final formattedDate = DateFormat('M/d/yyyy, h:mm:ss a').format(date);

    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: DefaultTextStyle(
        style: const TextStyle(
          fontFamily: 'monospace',
          color: Colors.black,
          fontSize: 14,
          height: 1.5,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('GEOBITES\nReceipt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('DATE', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(formattedDate),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            const _DashedLine(),
            const SizedBox(height: 16),
            Center(
              child: Text(
                order.vendor?.name ?? 'Vendor Details',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 16),
            const _DashedLine(),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('STATUS', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(order.status.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            const _DashedLine(),
            const SizedBox(height: 16),
            const Text('ITEMS', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...order.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text('${item.name} x${item.quantity}'),
                      ),
                      Text('₱${(item.price * item.quantity).toStringAsFixed(2)}'),
                    ],
                  ),
                )),
            const SizedBox(height: 8),
            const _DashedLine(),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Subtotal'),
                Text('₱${subtotal.toStringAsFixed(2)}'),
              ],
            ),
            if (deliveryFee > 0) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Delivery Fee'),
                  Text('₱${deliveryFee.toStringAsFixed(2)}'),
                ],
              ),
            ],
            const SizedBox(height: 8),
            const _DashedLine(),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('₱${order.totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 8),
            const _DashedLine(),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Payment Method'),
                Text((order.paymentMethod ?? 'COD').toUpperCase()),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Payment Status'),
                Text((order.paymentStatus ?? 'PENDING').toUpperCase()),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DashedLine extends StatelessWidget {
  const _DashedLine({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final boxWidth = constraints.constrainWidth();
        const dashWidth = 8.0;
        const dashHeight = 1.0;
        final dashCount = (boxWidth / (2 * dashWidth)).floor();
        return Flex(
          direction: Axis.horizontal,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(dashCount, (_) {
            return SizedBox(
              width: dashWidth,
              height: dashHeight,
              child: const DecoratedBox(
                decoration: BoxDecoration(color: Colors.black),
              ),
            );
          }),
        );
      },
    );
  }
}

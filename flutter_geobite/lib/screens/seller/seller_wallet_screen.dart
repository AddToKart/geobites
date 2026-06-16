import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/glass_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/wallet_service.dart';
import '../../widgets/glass_toast.dart';
import '../../widgets/animated_tap_card.dart';
import 'seller_shop_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/api_client.dart';

class SellerWalletScreen extends StatefulWidget {
  const SellerWalletScreen({Key? key}) : super(key: key);

  @override
  _SellerWalletScreenState createState() => _SellerWalletScreenState();
}

class _SellerWalletScreenState extends State<SellerWalletScreen> {
  // ── Loading & Setup States ────────────────────────────────────────────────
  bool _isLoading = true;
  bool _setupRequired = false;
  bool _isSubmittingWithdraw = false;

  // ── Wallet Data ──────────────────────────────────────────────────────────
  double _balance = 0.0;
  List<Map<String, dynamic>> _transactions = [];
  List<Map<String, dynamic>> _withdrawals = [];

  // ── Withdraw Form ─────────────────────────────────────────────────────────
  final TextEditingController _withdrawAmountCtrl = TextEditingController();
  final TextEditingController _withdrawAccountNameCtrl = TextEditingController();
  final TextEditingController _withdrawAccountNumberCtrl = TextEditingController();
  String? _selectedProviderId;

  // ── Cash In Form ──────────────────────────────────────────────────────────
  final TextEditingController _cashInAmountCtrl = TextEditingController();
  String _paymentMethod = 'GCASH'; // GCASH, MAYA, QRPH
  bool _isSubmittingCashIn = false;
  bool _isCashInMode = true;

  // ── UI States ─────────────────────────────────────────────────────────────
  int _activeTab = 0; // 0: Activity, 1: Withdrawals

  // Providers list matching the web frontend
  final List<Map<String, dynamic>> _providers = [
    {'id': 'gcash', 'label': 'GCash', 'type': 'ewallet', 'icon': Icons.phone_android},
    {'id': 'maya', 'label': 'Maya', 'type': 'ewallet', 'icon': Icons.phone_android},
    {'id': 'bdo', 'label': 'BDO', 'type': 'bank', 'icon': Icons.account_balance},
    {'id': 'bpi', 'label': 'BPI', 'type': 'bank', 'icon': Icons.account_balance},
    {'id': 'metro', 'label': 'Metrobank', 'type': 'bank', 'icon': Icons.account_balance},
    {'id': 'pnb', 'label': 'PNB', 'type': 'bank', 'icon': Icons.account_balance},
    {'id': 'landbank', 'label': 'LandBank', 'type': 'bank', 'icon': Icons.account_balance},
    {'id': 'unionbank', 'label': 'UnionBank', 'type': 'bank', 'icon': Icons.account_balance},
    {'id': 'security', 'label': 'Security Bank', 'type': 'bank', 'icon': Icons.account_balance},
  ];

  @override
  void initState() {
    super.initState();
    _loadWalletData();
  }

  @override
  void dispose() {
    _withdrawAmountCtrl.dispose();
    _withdrawAccountNameCtrl.dispose();
    _withdrawAccountNumberCtrl.dispose();
    _cashInAmountCtrl.dispose();
    super.dispose();
  }

  String _prepareCheckoutUrl(String url) {
    try {
      final baseUri = Uri.parse(apiClient.dio.options.baseUrl);
      final host = baseUri.host;
      if (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1') {
        return url
            .replaceAll('//localhost', '//$host')
            .replaceAll('//127.0.0.1', '//$host');
      }
    } catch (_) {}
    return url;
  }

  Future<void> _handleCashIn() async {
    final amountText = _cashInAmountCtrl.text.trim();
    if (amountText.isEmpty) {
      GlassToast.info(context, 'Enter an amount to cash in');
      return;
    }
    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      GlassToast.error(context, 'Enter a valid positive amount');
      return;
    }
    if (amount > 50000) {
      GlassToast.error(context, 'Maximum cash-in is ₱50,000');
      return;
    }

    setState(() => _isSubmittingCashIn = true);
    try {
      final result = await walletService.initiateVendorCashIn(amount, _paymentMethod);
      final rawCheckoutUrl = result['checkoutUrl'] as String?;
      if (rawCheckoutUrl != null && rawCheckoutUrl.isNotEmpty) {
        var checkoutUrl = _prepareCheckoutUrl(rawCheckoutUrl);
        try {
          const storage = FlutterSecureStorage();
          final token = await storage.read(key: 'jwt_token');
          if (token != null && token.isNotEmpty) {
            final connector = checkoutUrl.contains('?') ? '&' : '?';
            checkoutUrl = '$checkoutUrl${connector}token=${Uri.encodeComponent(token)}';
          }
        } catch (e) {
          debugPrint('Error reading jwt_token for cash-in: $e');
        }

        GlassToast.success(context, 'Redirecting to payment processor...');
        final uri = Uri.parse(checkoutUrl);
        try {
          await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
          await _loadWalletData();
        } catch (e) {
          throw 'Could not launch payment URL: $e';
        }
        _cashInAmountCtrl.clear();
      } else {
        throw 'Invalid checkout URL received';
      }
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Cash-in failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingCashIn = false);
      }
    }
  }

  Future<void> _loadWalletData() async {
    setState(() => _isLoading = true);
    try {
      final wallet = await walletService.getVendorWallet();
      if (wallet.containsKey('needsSetup') && wallet['needsSetup'] == true) {
        setState(() {
          _setupRequired = true;
          _isLoading = false;
        });
        return;
      }
      
      _balance = (wallet['balance'] as num?)?.toDouble() ?? 0.0;
      _transactions = await walletService.getVendorTransactions();
      _withdrawals = await walletService.getVendorWithdrawals();
      _setupRequired = false;
    } catch (e) {
      final errorMsg = e.toString();
      if (errorMsg.contains('403') || errorMsg.contains('profile required') || errorMsg.contains('needsSetup')) {
        setState(() => _setupRequired = true);
      } else {
        if (mounted) {
          GlassToast.error(context, 'Failed to load vendor wallet: $e');
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleWithdraw() async {
    final amountText = _withdrawAmountCtrl.text.trim();
    final name = _withdrawAccountNameCtrl.text.trim();
    final number = _withdrawAccountNumberCtrl.text.trim();

    if (amountText.isEmpty) {
      GlassToast.info(context, 'Enter withdrawal amount');
      return;
    }
    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      GlassToast.error(context, 'Enter a valid positive amount');
      return;
    }
    if (amount > _balance) {
      GlassToast.error(context, 'Insufficient balance');
      return;
    }
    if (amount > 50000) {
      GlassToast.error(context, 'Maximum withdrawal is ₱50,000');
      return;
    }
    if (_selectedProviderId == null) {
      GlassToast.info(context, 'Select a bank or e-wallet');
      return;
    }
    if (name.isEmpty || number.isEmpty) {
      GlassToast.info(context, 'All account details are required');
      return;
    }

    final provider = _providers.firstWhere((p) => p['id'] == _selectedProviderId);

    setState(() => _isSubmittingWithdraw = true);
    try {
      await walletService.requestVendorWithdrawal(amount, {
        'accountName': name,
        'accountNumber': number,
        'accountType': provider['type'] as String,
        'accountProvider': provider['label'] as String,
      });
      if (mounted) {
        GlassToast.success(context, 'Withdrawal request submitted successfully');
      }
      _withdrawAmountCtrl.clear();
      _withdrawAccountNameCtrl.clear();
      _withdrawAccountNumberCtrl.clear();
      setState(() => _selectedProviderId = null);
      await _loadWalletData();
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Withdrawal request failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingWithdraw = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    if (_setupRequired) {
      return GlassScaffold(
        appBar: GlassAppBar(
          title: Text('GeoPay Wallet', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
          automaticallyImplyLeading: true,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: NeumorphicCard(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.storefront_outlined, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    'Shop Profile Required',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Save your shop profile details first to activate your GeoPay Wallet.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: FilledButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SellerShopScreen()),
                        ).then((_) => _loadWalletData());
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                      ),
                      child: const Text('Go to Shop Settings', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return GlassScaffold(
      appBar: GlassAppBar(
        title: Text('GeoPay Wallet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Theme.of(context).colorScheme.onSurface)),
        automaticallyImplyLeading: true,
      ),
      body: RefreshIndicator(
        onRefresh: _loadWalletData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.only(top: 100.0, left: 16.0, right: 16.0, bottom: 120.0),
                children: [
                  // ── Balance Display Card ──────────────────────────────────
                  NeumorphicCard(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.wallet, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Text(
                              'AVAILABLE BALANCE',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.5,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '₱${_balance.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w900,
                            color: Theme.of(context).colorScheme.onSurface,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          user?.name ?? 'Seller Account',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Cash In / Cash Out Interactive Toggle Card ───────────
                  _buildInteractiveWalletCard(),
                  const SizedBox(height: 24),

                  // ── Dual Tab Activity / Withdrawals Card ──────────────────
                  NeumorphicCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Tab selectors
                        Row(
                          children: [
                            Expanded(
                              child: _buildTabButton(0, Icons.history, 'Activity'),
                            ),
                            Expanded(
                              child: _buildTabButton(1, Icons.payments_outlined, 'Withdrawals'),
                            ),
                          ],
                        ),
                        const Divider(height: 1),
                        _activeTab == 0 ? _buildActivityTab() : _buildWithdrawalsTab(),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildTabButton(int index, IconData icon, String label) {
    final isSelected = _activeTab == index;
    return InkWell(
      onTap: () => setState(() => _activeTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        color: isSelected ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05) : Colors.transparent,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: isSelected ? AppColors.primary : Colors.grey),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: isSelected ? AppColors.primary : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityTab() {
    if (_transactions.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40.0),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.history, size: 40, color: Colors.grey),
              SizedBox(height: 12),
              Text('No history available.', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: _transactions.length,
      separatorBuilder: (_, __) => const Divider(height: 24),
      itemBuilder: (context, index) {
        final tx = _transactions[index];
        final amount = (tx['amount'] as num?)?.toDouble() ?? 0.0;
        final isCredit = amount > 0;
        final dateStr = tx['createdAt'] as String?;
        final date = dateStr != null ? DateTime.parse(dateStr) : DateTime.now();

        // Label formatting
        String label = 'Payment Received';
        if (tx['type'] == 'withdrawal') {
          label = 'Withdrawal';
        } else if (tx['type'] == 'vendor_payout') {
          label = 'GeoPay Payout';
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  isCredit ? Icons.add_circle_outline : Icons.remove_circle_outline,
                  color: isCredit ? Colors.green : AppColors.primary,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      '${date.month}/${date.day}/${date.year}',
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
            Text(
              '${isCredit ? "+" : "-"}₱${amount.abs().toStringAsFixed(2)}',
              style: TextStyle(fontWeight: FontWeight.bold, color: isCredit ? Colors.green : Theme.of(context).colorScheme.onSurface),
            ),
          ],
        );
      },
    );
  }

  Widget _buildWithdrawalsTab() {
    if (_withdrawals.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40.0),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.payments_outlined, size: 40, color: Colors.grey),
              SizedBox(height: 12),
              Text('No payouts requested yet.', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: _withdrawals.length,
      separatorBuilder: (_, __) => const Divider(height: 24),
      itemBuilder: (context, index) {
        final wd = _withdrawals[index];
        final amount = (wd['amount'] as num?)?.toDouble() ?? 0.0;
        final dateStr = wd['createdAt'] as String?;
        final date = dateStr != null ? DateTime.parse(dateStr) : DateTime.now();
        final status = wd['status'] as String? ?? 'pending';

        Color statusColor = Colors.orange;
        if (status == 'completed') {
          statusColor = Colors.green;
        } else if (status == 'failed') {
          statusColor = Colors.red;
        } else if (status == 'processing') {
          statusColor = Colors.blue;
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(Icons.account_balance_wallet_outlined, color: Colors.grey),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(wd['accountProvider'] as String? ?? 'Payout', style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      '${wd['accountName']} • ${wd['accountNumber']}',
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${date.month}/${date.day}/${date.year}',
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('₱${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: statusColor),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildInteractiveWalletCard() {
    final activeColor = _isCashInMode ? Colors.green.shade600 : Colors.red.shade600;

    return NeumorphicCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Mode Toggle Switcher
          Container(
            height: 50,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(kSharpRadius),
              border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
            ),
            child: Stack(
              children: [
                AnimatedAlign(
                  alignment: _isCashInMode ? Alignment.centerLeft : Alignment.centerRight,
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeInOutCubic,
                  child: FractionallySizedBox(
                    widthFactor: 0.5,
                    child: Container(
                      margin: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: activeColor,
                        borderRadius: BorderRadius.circular(kSharpRadius),
                        boxShadow: [
                          BoxShadow(
                            color: activeColor.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isCashInMode = true),
                        behavior: HitTestBehavior.opaque,
                        child: Center(
                          child: Text(
                            'CASH IN',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                              color: _isCashInMode ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isCashInMode = false),
                        behavior: HitTestBehavior.opaque,
                        child: Center(
                          child: Text(
                            'CASH OUT',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                              color: !_isCashInMode ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Render active card content
          _isCashInMode ? _buildCashInContent() : _buildCashOutContent(),
        ],
      ),
    );
  }

  Widget _buildCashInContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _cashInAmountCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            prefixText: '₱ ',
            prefixStyle: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
            hintText: '0.00',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(kSharpRadius),
              borderSide: const BorderSide(color: Colors.green, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        const SizedBox(height: 12),
        // Quick amounts helper
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [100, 200, 500, 1000].map((amt) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: OutlinedButton(
                  onPressed: () => setState(() => _cashInAmountCtrl.text = amt.toString()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    foregroundColor: Colors.green.shade600,
                    backgroundColor: Colors.green.shade600.withValues(alpha: 0.15),
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('+$amt'),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        const Text('FUNDING SOURCE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.grey)),
        const SizedBox(height: 8),
        Row(
          children: ['GCASH', 'MAYA', 'QRPH'].map((method) {
            final isSelected = _paymentMethod == method;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: ElevatedButton(
                  onPressed: () => setState(() => _paymentMethod = method),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isSelected ? Colors.green.shade600 : Colors.grey.withValues(alpha: 0.1),
                    foregroundColor: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(method, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: FilledButton(
            onPressed: _isSubmittingCashIn ? null : _handleCashIn,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.green.shade600,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
            ),
            child: _isSubmittingCashIn
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Proceed to Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
          ),
        ),
      ],
    );
  }

  Widget _buildCashOutContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _withdrawAmountCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            prefixText: '₱ ',
            prefixStyle: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
            hintText: '0.00',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(kSharpRadius),
              borderSide: const BorderSide(color: Colors.red, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        const SizedBox(height: 12),
        // Quick amounts selectors
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [500, 1000, 2000, 5000].map((amt) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: OutlinedButton(
                  onPressed: () => setState(() => _withdrawAmountCtrl.text = amt.toString()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    foregroundColor: Colors.red.shade600,
                    backgroundColor: Colors.red.shade600.withValues(alpha: 0.15),
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('+${amt.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}'),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        const Text('BANK / E-WALLET', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.grey)),
        const SizedBox(height: 12),
        // Providers Selection Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 1.8,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: _providers.length,
          itemBuilder: (context, idx) {
            final prov = _providers[idx];
            final isSelected = _selectedProviderId == prov['id'];
            return AnimatedTapCard(
              onTap: () => setState(() => _selectedProviderId = prov['id'] as String),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected ? Colors.red.shade600 : Colors.transparent,
                  border: Border.all(color: isSelected ? Colors.red.shade600 : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.15)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(prov['icon'] as IconData, size: 16, color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface),
                    const SizedBox(height: 4),
                    Text(
                      prov['label'] as String,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _withdrawAccountNameCtrl,
          decoration: InputDecoration(
            labelText: 'ACCOUNT NAME',
            labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(kSharpRadius),
              borderSide: const BorderSide(color: Colors.red, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _withdrawAccountNumberCtrl,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'ACCOUNT NUMBER',
            labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(kSharpRadius),
              borderSide: const BorderSide(color: Colors.red, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: FilledButton(
            onPressed: _isSubmittingWithdraw ? null : _handleWithdraw,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
            ),
            child: _isSubmittingWithdraw
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Withdraw', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
          ),
        ),
      ],
    );
  }
}

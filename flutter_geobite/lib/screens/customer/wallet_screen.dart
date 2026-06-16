import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/api_client.dart';
import '../../providers/auth_provider.dart';
import '../../services/wallet_service.dart';
import '../../services/geopay_service.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/pagination_controls.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({Key? key}) : super(key: key);

  @override
  _WalletScreenState createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  // ── Loading States ────────────────────────────────────────────────────────
  bool _isLoading = true;
  bool _isSubmittingCashIn = false;
  bool _isSubmittingWithdraw = false;
  bool _isSubmittingRedeem = false;
  bool _isSubmittingReferral = false;

  // ── Wallet Data ───────────────────────────────────────────────────────────
  double _balance = 0.0;
  List<dynamic> _transactions = [];
  int _txPage = 1;
  int _totalTransactions = 0;
  final int _txLimit = 5;

  // ── GeoPay Rewards Data ───────────────────────────────────────────────────
  Map<String, dynamic>? _rewardsBalance;
  List<dynamic> _rewardsHistory = [];
  int _selectedRedeemPoints = 100;

  // ── Referral Data ─────────────────────────────────────────────────────────
  Map<String, dynamic>? _referralCodeInfo;
  List<dynamic> _referralHistory = [];
  bool _showReferralInput = false;
  final TextEditingController _referralInputCtrl = TextEditingController();

  // ── Form Controllers & Settings ───────────────────────────────────────────
  final TextEditingController _cashInAmountCtrl = TextEditingController();
  String _paymentMethod = 'GCASH'; // GCASH, MAYA, QRPH

  // Rider Cash Out Form
  final TextEditingController _withdrawAmountCtrl = TextEditingController();
  final TextEditingController _withdrawAccountNameCtrl = TextEditingController();
  final TextEditingController _withdrawAccountNumberCtrl = TextEditingController();
  String _withdrawAccountType = 'ewallet'; // ewallet, bank
  String _withdrawProvider = 'GCASH'; // GCASH, MAYA, BDO, BPI, UNIONBANK, METROBANK

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  @override
  void dispose() {
    _referralInputCtrl.dispose();
    _cashInAmountCtrl.dispose();
    _withdrawAmountCtrl.dispose();
    _withdrawAccountNameCtrl.dispose();
    _withdrawAccountNumberCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    setState(() => _isLoading = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final isCustomer = auth.user?.role == 'customer';

      // Load wallet and transactions
      final wallet = await walletService.getWallet();
      _balance = (wallet['balance'] as num?)?.toDouble() ?? 0.0;
      await _loadTransactions();

      if (isCustomer) {
        // Load GeoPay and referrals
        final rewards = await geopayService.getRewardsBalance();
        final rewHistory = await geopayService.getRewardHistory();
        final refCode = await geopayService.getReferralCode();
        final refHistory = await geopayService.getReferralHistory();

        setState(() {
          _rewardsBalance = rewards;
          _rewardsHistory = rewHistory;
          _referralCodeInfo = refCode;
          _referralHistory = refHistory;
        });
      }
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Error loading wallet: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadTransactions() async {
    try {
      final txResult = await walletService.getTransactions(
        page: _txPage,
        limit: _txLimit,
      );
      setState(() {
        _transactions = txResult['data'] ?? [];
        _totalTransactions = (txResult['total'] as num?)?.toInt() ?? 0;
      });
    } catch (e) {
      debugPrint('Failed to load transactions: $e');
    }
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

  // ── Cash In Execution ─────────────────────────────────────────────────────
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
      final result = await walletService.initiateCashIn(amount, _paymentMethod);
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
          // Refresh the wallet balance and transaction list once the user closes the payment sheet
          await _loadAllData();
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

  // ── Payout Request (Rider) ────────────────────────────────────────────────
  Future<void> _handleRiderWithdrawal() async {
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
    if (name.isEmpty || number.isEmpty) {
      GlassToast.info(context, 'All account details are required');
      return;
    }

    setState(() => _isSubmittingWithdraw = true);
    try {
      await walletService.requestCustomerWithdrawal(amount, {
        'accountName': name,
        'accountNumber': number,
        'accountType': _withdrawAccountType,
        'accountProvider': _withdrawProvider,
      });
      if (mounted) {
        GlassToast.success(context, 'Withdrawal request submitted successfully');
      }
      _withdrawAmountCtrl.clear();
      _withdrawAccountNameCtrl.clear();
      _withdrawAccountNumberCtrl.clear();
      await _loadAllData();
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Withdrawal failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingWithdraw = false);
      }
    }
  }

  // ── Loyalty Rewards Redemption ────────────────────────────────────────────
  Future<void> _handleRedeemRewards() async {
    final currentPoints = (_rewardsBalance?['balance'] as num?)?.toInt() ?? 0;
    if (currentPoints < _selectedRedeemPoints) {
      GlassToast.error(context, 'Insufficient points balance');
      return;
    }

    setState(() => _isSubmittingRedeem = true);
    try {
      await geopayService.redeemPoints(_selectedRedeemPoints);
      if (mounted) {
        GlassToast.success(context, 'Points redeemed successfully!');
      }
      await _loadAllData();
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Redeem points failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingRedeem = false);
      }
    }
  }

  // ── Apply Referral Code ───────────────────────────────────────────────────
  Future<void> _handleApplyReferral() async {
    final code = _referralInputCtrl.text.trim().toUpperCase();
    if (code.isEmpty) {
      GlassToast.info(context, 'Enter a referral code');
      return;
    }

    setState(() => _isSubmittingReferral = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await geopayService.registerReferral(code, auth.user?.email);
      if (mounted) {
        GlassToast.success(context, 'Referral code applied successfully!');
      }
      _referralInputCtrl.clear();
      setState(() => _showReferralInput = false);
      await _loadAllData();
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Failed to apply referral code: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingReferral = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isCustomer = user?.role == 'customer';
    final totalPages = (_totalTransactions / _txLimit).ceil();

    return GlassScaffold(
      appBar: GlassAppBar(
        title: Text(
          isCustomer ? 'GeoPay Wallet' : 'Rider Payouts',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Theme.of(context).colorScheme.onSurface),
        ),
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: _loadAllData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.only(top: 100.0, left: 16.0, right: 16.0, bottom: 120.0),
                children: [
                  // ── Available Balance Card ────────────────────────────────
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
                          user?.name ?? 'Account Holder',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (isCustomer) ...[
                    // ── Customer Cash In Card ───────────────────────────────
                    _buildCustomerCashInCard(),
                    const SizedBox(height: 24),

                    // ── Loyalty Rewards Card ────────────────────────────────
                    _buildLoyaltyRewardsCard(),
                    const SizedBox(height: 24),

                    // ── Referrals Card ──────────────────────────────────────
                    _buildReferralCard(),
                  ] else ...[
                    // ── Rider Cash Out Card ─────────────────────────────────
                    _buildRiderCashOutCard(),
                  ],
                  const SizedBox(height: 24),

                  // ── Activity History Card ─────────────────────────────────
                  _buildActivityCard(totalPages),
                ],
              ),
      ),
    );
  }

  // ── View Builders ─────────────────────────────────────────────────────────

  Widget _buildCustomerCashInCard() {
    return NeumorphicCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CASH IN', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.primary)),
          const SizedBox(height: 16),
          TextField(
            controller: _cashInAmountCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              prefixText: '₱ ',
              prefixStyle: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
              hintText: '0.00',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
                      backgroundColor: isSelected ? AppColors.primary : Colors.grey.withValues(alpha: 0.1),
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
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSubmittingCashIn
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Proceed to Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoyaltyRewardsCard() {
    final points = (_rewardsBalance?['balance'] as num?)?.toInt() ?? 0;
    final discount = (_rewardsBalance?['discountBalance'] as num?)?.toDouble() ?? 0.0;
    final lifetime = (_rewardsBalance?['lifetimeEarned'] as num?)?.toInt() ?? 0;

    return NeumorphicCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('LOYALTY REWARDS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.primary)),
              Icon(Icons.stars, color: Colors.orange.shade400, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildRewardStat('Points Balance', '$points pts')),
              Container(width: 1, height: 40, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
              Expanded(child: _buildRewardStat('Discount Pesos', '₱${discount.toStringAsFixed(2)}')),
              Container(width: 1, height: 40, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
              Expanded(child: _buildRewardStat('Lifetime Earned', '$lifetime pts')),
            ],
          ),
          if (discount > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.05),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.sell_outlined, color: AppColors.primary, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You have ₱${discount.toStringAsFixed(2)} in discount credits — applied automatically at checkout.',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            'REDEEM POINTS (10 PTS = ₱1 DISCOUNT)',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.15)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _selectedRedeemPoints,
                      isExpanded: true,
                      items: const [
                        DropdownMenuItem(value: 50, child: Text('50 points (₱5 discount)')),
                        DropdownMenuItem(value: 100, child: Text('100 points (₱10 discount)')),
                        DropdownMenuItem(value: 200, child: Text('200 points (₱20 discount)')),
                        DropdownMenuItem(value: 500, child: Text('500 points (₱50 discount)')),
                        DropdownMenuItem(value: 1000, child: Text('1,000 points (₱100 discount)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedRedeemPoints = val);
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _isSubmittingRedeem || points < _selectedRedeemPoints ? null : _handleRedeemRewards,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isSubmittingRedeem
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Redeem', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          if (_rewardsHistory.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text(
              'POINTS HISTORY',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 150),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 4),
                itemCount: _rewardsHistory.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                itemBuilder: (context, idx) {
                  final tx = _rewardsHistory[idx];
                  final isEarned = tx['type'] == 'earned';
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                    dense: true,
                    title: Text(isEarned ? 'Points Earned' : tx['type'] == 'redeemed' ? 'Discount Redeemed' : 'Points Expired', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: tx['description'] != null ? Text(tx['description'] as String, style: const TextStyle(fontSize: 10)) : null,
                    trailing: Text(
                      '${isEarned ? "+" : ""}${tx['points']} pts',
                      style: TextStyle(fontWeight: FontWeight.bold, color: isEarned ? Colors.green : Colors.red),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRewardStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildReferralCard() {
    final code = _referralCodeInfo?['referralCode'] as String? ?? 'N/A';
    final total = _referralCodeInfo?['totalReferrals'] as num? ?? 0;
    final pending = _referralCodeInfo?['pendingReferrals'] as num? ?? 0;

    return NeumorphicCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('REFER A FRIEND', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.primary)),
              const Icon(Icons.people_outline, color: AppColors.primary, size: 20),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Share your code and earn 500 reward points (worth ₱50 in discounts) for every friend who signs up and completes their first order.',
            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), height: 1.4),
          ),
          const SizedBox(height: 16),
          // Code Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.03),
              border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('YOUR CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4))),
                    const SizedBox(height: 4),
                    Text(code, style: const TextStyle(fontSize: 24, fontStyle: FontStyle.normal, fontWeight: FontWeight.bold, letterSpacing: 2, color: AppColors.primary)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.copy, color: AppColors.primary),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: code));
                    GlassToast.success(context, 'Referral code copied!');
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text('REFERRED', style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('$total', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text('PENDING', style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('$pending', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (!_showReferralInput)
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () => setState(() => _showReferralInput = true),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Have a referral code?', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
              ),
            )
          else
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _referralInputCtrl,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      hintText: 'ENTER CODE',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _isSubmittingReferral ? null : _handleApplyReferral,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _isSubmittingReferral
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Apply', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          if (_referralHistory.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text(
              'REFERRAL HISTORY',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 150),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 4),
                itemCount: _referralHistory.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                itemBuilder: (context, idx) {
                  final entry = _referralHistory[idx];
                  final isRewarded = entry['status'] == 'rewarded';
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                    dense: true,
                    title: Text(entry['referredEmail'] ?? 'User Joined', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text((entry['status'] as String).toUpperCase(), style: TextStyle(fontSize: 10, color: isRewarded ? Colors.green : Colors.orange)),
                    trailing: isRewarded
                        ? const Text('+500 pts', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green))
                        : const Text('--', style: TextStyle(fontWeight: FontWeight.bold)),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRiderCashOutCard() {
    return NeumorphicCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CASH OUT (WITHDRAW)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.primary)),
          const SizedBox(height: 16),
          TextField(
            controller: _withdrawAmountCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              prefixText: '₱ ',
              prefixStyle: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
              hintText: '0.00',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('METHOD TYPE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.15)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _withdrawAccountType,
                          isExpanded: true,
                          items: const [
                            DropdownMenuItem(value: 'ewallet', child: Text('E-Wallet')),
                            DropdownMenuItem(value: 'bank', child: Text('Bank Account')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _withdrawAccountType = val;
                                _withdrawProvider = val == 'ewallet' ? 'GCASH' : 'BDO';
                              });
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('PROVIDER', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.15)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _withdrawProvider,
                          isExpanded: true,
                          items: _withdrawAccountType == 'ewallet'
                              ? const [
                                  DropdownMenuItem(value: 'GCASH', child: Text('GCash')),
                                  DropdownMenuItem(value: 'MAYA', child: Text('Maya')),
                                ]
                              : const [
                                  DropdownMenuItem(value: 'BDO', child: Text('BDO')),
                                  DropdownMenuItem(value: 'BPI', child: Text('BPI')),
                                  DropdownMenuItem(value: 'UNIONBANK', child: Text('UnionBank')),
                                  DropdownMenuItem(value: 'METROBANK', child: Text('Metrobank')),
                                ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _withdrawProvider = val);
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _withdrawAccountNameCtrl,
            decoration: InputDecoration(
              labelText: 'ACCOUNT NAME',
              labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: FilledButton(
              onPressed: _isSubmittingWithdraw ? null : _handleRiderWithdrawal,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSubmittingWithdraw
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Submit Cash Out Request', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityCard(int totalPages) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('ACTIVITY', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.primary)),
              const Icon(Icons.history, color: AppColors.primary, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          _transactions.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.history, size: 48, color: Colors.grey),
                        SizedBox(height: 12),
                        Text('No history available.', style: TextStyle(fontSize: 16, color: Colors.grey)),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _transactions.length,
                  separatorBuilder: (_, __) => Divider(height: 24, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    final amountVal = (tx['amount'] as num?)?.toDouble() ?? 0.0;
                    final isCredit = amountVal > 0;
                    final dateStr = tx['createdAt'] as String?;
                    final date = dateStr != null ? DateTime.parse(dateStr) : DateTime.now();

                    // label
                    String txLabel = 'Order Payment';
                    if (tx['type'] == 'cash_in') {
                      txLabel = 'Cash In';
                    } else if (tx['type'] == 'withdrawal') {
                      txLabel = 'Cash Out';
                    } else if (tx['type'] == 'refund') {
                      txLabel = 'Refund';
                    }

                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: isCredit ? Colors.green.withValues(alpha: 0.1) : AppColors.primary.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                                color: isCredit ? Colors.green : AppColors.primary,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(txLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 4),
                                Text(
                                  '${date.month}/${date.day}/${date.year} • ${date.hour}:${date.minute.toString().padLeft(2, '0')}',
                                  style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${isCredit ? "+" : ""}₱${amountVal.abs().toStringAsFixed(2)}',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: isCredit ? Colors.green : Theme.of(context).colorScheme.onSurface),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              (tx['paymentMethod'] as String? ?? 'GEOPAY').toUpperCase(),
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
          if (totalPages > 1) ...[
            const SizedBox(height: 24),
            PaginationControls(
              currentPage: _txPage - 1,
              totalPages: totalPages,
              bottomPadding: 16,
              onPageChanged: (pageIndex) {
                setState(() {
                  _txPage = pageIndex + 1;
                });
                _loadTransactions();
              },
            ),
          ],
        ],
      ),
    );
  }
}

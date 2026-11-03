import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../widgets/app_section_card.dart';

class AdminConsoleScreen extends StatefulWidget {
  const AdminConsoleScreen({super.key});

  @override
  State<AdminConsoleScreen> createState() => _AdminConsoleScreenState();
}

class _AdminConsoleScreenState extends State<AdminConsoleScreen> {
  final _reportIdCtrl = TextEditingController();
  final _userIdCtrl = TextEditingController();
  final _statusCtrl = TextEditingController(text: 'resolved');
  String _result = 'No action yet';

  Future<void> _run(String label, Future<dynamic> Function() fn) async {
    try {
      final res = await fn();
      setState(() => _result = '$label => ${res.statusCode}');
    } catch (e) {
      setState(() => _result = '$label failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<FullApiService>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppSectionCard(
          title: 'Admin Console',
          subtitle: 'Dashboard, reports, users, ads, featured, categories, cities.',
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.tonal(onPressed: () => _run('dashboard.stats', api.dashboardStats), child: const Text('Stats')),
              FilledButton.tonal(onPressed: () => _run('reports.list', api.reportsList), child: const Text('Reports')),
              FilledButton.tonal(onPressed: () => _run('users.list', api.usersList), child: const Text('Users')),
              FilledButton.tonal(onPressed: () => _run('ads.list', api.adsAdminList), child: const Text('Ads')),
              FilledButton.tonal(onPressed: () => _run('featured.list', api.featuredList), child: const Text('Featured')),
              FilledButton.tonal(onPressed: () => _run('categories.list', api.categoriesList), child: const Text('Categories')),
              FilledButton.tonal(onPressed: () => _run('cities.list', api.citiesList), child: const Text('Cities')),
              FilledButton.tonal(onPressed: () => _run('businesses.pending', api.businessesPending), child: const Text('Pending')),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Report Status',
          child: Column(
            children: [
              TextField(controller: _reportIdCtrl, decoration: const InputDecoration(labelText: 'Report ID')),
              const SizedBox(height: 8),
              TextField(controller: _statusCtrl, decoration: const InputDecoration(labelText: 'Status')),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _run('reports.updateStatus', () => api.reportUpdateStatus(_reportIdCtrl.text, _statusCtrl.text)),
                  child: const Text('Update Report'),
                ),
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'User Controls',
          child: Column(
            children: [
              TextField(controller: _userIdCtrl, decoration: const InputDecoration(labelText: 'User ID')),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _run('users.details', () => api.userDetails(_userIdCtrl.text)),
                      child: const Text('Details'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _run('users.status', () => api.userStatus(_userIdCtrl.text, 'active')),
                      child: const Text('Activate'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(_result, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

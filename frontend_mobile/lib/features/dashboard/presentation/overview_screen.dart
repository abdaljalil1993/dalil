import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../state/session_controller.dart';
import '../../../widgets/app_section_card.dart';

class OverviewScreen extends StatefulWidget {
  const OverviewScreen({super.key});

  @override
  State<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends State<OverviewScreen> {
  String _status = 'Tap quick actions to fetch data.';

  Future<void> _run(String label, Future<dynamic> Function() fn) async {
    try {
      final res = await fn();
      setState(() => _status = '$label => ${res.statusCode}');
    } catch (e) {
      setState(() => _status = '$label failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<FullApiService>();
    final session = context.watch<SessionController>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppSectionCard(
          title: 'Dalilak Mobile',
          subtitle: 'Modern Flutter app with full API integration and role consoles.',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Role: ${session.role}'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton.tonal(onPressed: () => _run('categories', api.categoriesList), child: const Text('Categories')),
                  FilledButton.tonal(onPressed: () => _run('cities', api.citiesList), child: const Text('Cities')),
                  FilledButton.tonal(onPressed: () => _run('businesses', () => api.businessesList()), child: const Text('Businesses')),
                  FilledButton.tonal(onPressed: () => _run('featured', api.featuredActive), child: const Text('Featured')),
                  FilledButton.tonal(onPressed: () => _run('ads', api.adsActive), child: const Text('Advertisements')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(_status, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

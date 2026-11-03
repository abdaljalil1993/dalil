import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../widgets/app_section_card.dart';

class BusinessOwnerScreen extends StatefulWidget {
  const BusinessOwnerScreen({super.key});

  @override
  State<BusinessOwnerScreen> createState() => _BusinessOwnerScreenState();
}

class _BusinessOwnerScreenState extends State<BusinessOwnerScreen> {
  final _businessIdCtrl = TextEditingController();
  final _nameCtrl = TextEditingController(text: 'My Business');
  final _descCtrl = TextEditingController(text: 'Description');
  final _cityCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController();

  String _status = 'No action yet';

  Future<void> _run(String label, Future<dynamic> Function() fn) async {
    try {
      final res = await fn();
      setState(() => _status = '$label => ${res.statusCode}');
    } catch (e) {
      setState(() => _status = '$label failed: $e');
    }
  }

  Future<void> _uploadImages() async {
    final api = context.read<FullApiService>();
    final result = await FilePicker.platform.pickFiles(allowMultiple: true, type: FileType.image);
    if (result == null) return;
    final files = result.paths.whereType<String>().map(File.new).toList();
    if (files.isEmpty) return;

    await _run('business.uploadImages', () => api.businessUploadImages(_businessIdCtrl.text, files));
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<FullApiService>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppSectionCard(
          title: 'Owner Business API',
          subtitle: 'Create, update, images, hours, reviews and reports.',
          child: Column(
            children: [
              TextField(controller: _businessIdCtrl, decoration: const InputDecoration(labelText: 'Business ID')),
              const SizedBox(height: 8),
              TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 8),
              TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description')),
              const SizedBox(height: 8),
              TextField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City ID')),
              const SizedBox(height: 8),
              TextField(controller: _categoryCtrl, decoration: const InputDecoration(labelText: 'Category ID')),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton.tonal(onPressed: () => _run('business.my', api.businessesMy), child: const Text('My Businesses')),
                  FilledButton.tonal(
                    onPressed: () => _run(
                      'business.create',
                      () => api.businessCreate({
                        'name': _nameCtrl.text,
                        'description': _descCtrl.text,
                        'cityId': _cityCtrl.text,
                        'categoryId': _categoryCtrl.text,
                        'address': 'Street 123',
                        'phone': '+96170000000',
                      }),
                    ),
                    child: const Text('Create'),
                  ),
                  FilledButton.tonal(
                    onPressed: () => _run('business.update', () => api.businessUpdate(_businessIdCtrl.text, {'name': _nameCtrl.text})),
                    child: const Text('Update'),
                  ),
                  FilledButton.tonal(
                    onPressed: () => _run(
                      'business.hours',
                      () => api.businessSetHours(_businessIdCtrl.text, [
                        {'day': 'monday', 'open': '09:00', 'close': '18:00'}
                      ]),
                    ),
                    child: const Text('Set Hours'),
                  ),
                  FilledButton.tonal(onPressed: _uploadImages, child: const Text('Upload Images')),
                  FilledButton.tonal(
                    onPressed: () => _run('business.reviews', () => api.businessReviews(_businessIdCtrl.text)),
                    child: const Text('Reviews'),
                  ),
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

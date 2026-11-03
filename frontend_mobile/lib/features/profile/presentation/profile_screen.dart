import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../state/session_controller.dart';
import '../../../widgets/app_section_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  String _status = 'Idle';

  Future<void> _loadMe() async {
    final api = context.read<FullApiService>();
    try {
      final res = await api.me();
      final me = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>? ?? {};
      _nameCtrl.text = (me['name'] ?? '').toString();
      _phoneCtrl.text = (me['phone'] ?? '').toString();
      _bioCtrl.text = (me['bio'] ?? '').toString();
      setState(() => _status = 'Profile loaded');
    } catch (e) {
      setState(() => _status = 'Load failed: $e');
    }
  }

  Future<void> _updateMe() async {
    final api = context.read<FullApiService>();
    try {
      await api.updateMe({'name': _nameCtrl.text, 'phone': _phoneCtrl.text, 'bio': _bioCtrl.text});
      setState(() => _status = 'Profile updated');
    } catch (e) {
      setState(() => _status = 'Update failed: $e');
    }
  }

  Future<void> _uploadAvatar() async {
    final api = context.read<FullApiService>();
    final result = await FilePicker.platform.pickFiles(type: FileType.image);
    if (result == null || result.files.single.path == null) return;

    try {
      await api.uploadAvatar(File(result.files.single.path!));
      setState(() => _status = 'Avatar uploaded');
    } catch (e) {
      setState(() => _status = 'Avatar failed: $e');
    }
  }

  Future<void> _logout() async {
    final session = context.read<SessionController>();
    await session.clear();
    if (!mounted) return;
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppSectionCard(
          title: 'My Profile',
          subtitle: 'Users endpoints: GET/PUT /users/me + POST /users/me/avatar',
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(child: OutlinedButton(onPressed: _loadMe, child: const Text('Load Me'))),
                  const SizedBox(width: 8),
                  Expanded(child: OutlinedButton(onPressed: _uploadAvatar, child: const Text('Upload Avatar'))),
                ],
              ),
              const SizedBox(height: 10),
              TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 8),
              TextField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
              const SizedBox(height: 8),
              TextField(controller: _bioCtrl, decoration: const InputDecoration(labelText: 'Bio')),
              const SizedBox(height: 12),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: _updateMe, child: const Text('Update Profile'))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: OutlinedButton(onPressed: _logout, child: const Text('Logout'))),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(_status, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

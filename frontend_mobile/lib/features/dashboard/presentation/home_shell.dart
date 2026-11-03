import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../state/session_controller.dart';
import '../../admin/presentation/admin_console_screen.dart';
import '../../business/presentation/business_owner_screen.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../workbench/presentation/api_workbench_screen.dart';
import 'overview_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final role = context.watch<SessionController>().role;

    final pages = <Widget>[
      const OverviewScreen(),
      const ApiWorkbenchScreen(),
      const ProfileScreen(),
      role == 'admin' ? const AdminConsoleScreen() : const BusinessOwnerScreen(),
    ];

    final labels = <String>[
      'Overview',
      'Workbench',
      'Profile',
      role == 'admin' ? 'Admin' : 'Owner',
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(labels[_index]),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFE7F7F2), Color(0xFFF7FBFA)],
          ),
        ),
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Overview'),
          const NavigationDestination(icon: Icon(Icons.api_outlined), selectedIcon: Icon(Icons.api), label: 'Workbench'),
          const NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
          NavigationDestination(
            icon: Icon(role == 'admin' ? Icons.admin_panel_settings_outlined : Icons.storefront_outlined),
            selectedIcon: Icon(role == 'admin' ? Icons.admin_panel_settings : Icons.storefront),
            label: role == 'admin' ? 'Admin' : 'Owner',
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';

/// Maps the API's `category.icon` name (Material icon names) to [IconData].
/// Shared by the home grid and the categories list — one source of truth.
IconData categoryIcon(String? name) {
  const map = <String, IconData>{
    'medical_services': Icons.medical_services,
    'restaurant': Icons.restaurant,
    'hotel': Icons.hotel,
    'gavel': Icons.gavel,
    'build': Icons.build,
    'local_shipping': Icons.local_shipping,
    'cleaning_services': Icons.cleaning_services,
    'celebration': Icons.celebration,
    'shopping_cart': Icons.shopping_cart,
    'fitness_center': Icons.fitness_center,
    'school': Icons.school,
    'car_repair': Icons.car_repair,
    'home_repair_service': Icons.home_repair_service,
    'local_laundry_service': Icons.local_laundry_service,
    'spa': Icons.spa,
    'pets': Icons.pets,
    'storefront': Icons.storefront,
    'attractions': Icons.attractions,
    'local_pharmacy': Icons.local_pharmacy,
    'inventory_2': Icons.inventory_2_outlined,
    'apartment': Icons.apartment,
    'directions_car': Icons.directions_car,
    'work': Icons.work_outline,
    'account_balance': Icons.account_balance_outlined,
    'electric_bolt': Icons.electric_bolt_rounded,
    'plumbing': Icons.plumbing,
    'agriculture': Icons.agriculture,
    'local_cafe': Icons.local_cafe,
    'checkroom': Icons.checkroom,
    'photo_camera': Icons.photo_camera_outlined,
    'security': Icons.security_outlined,
  };
  return map[name] ?? Icons.category_rounded;
}

/// Parses `#RRGGBB` (with or without `#`); returns null when invalid.
Color? parseHexColor(String? value) {
  if (value == null || value.isEmpty) return null;
  try {
    final hex = value.replaceAll('#', '');
    if (hex.length == 6) return Color(int.parse('FF$hex', radix: 16));
    if (hex.length == 8) return Color(int.parse(hex, radix: 16));
  } catch (_) {}
  return null;
}
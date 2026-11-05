import 'package:flutter/material.dart';
import '../../../../core/l10n/app_localizations.dart';

class FilterBottomSheet extends StatelessWidget {
  final String currentSort;
  final Function(String) onSortChanged;

  const FilterBottomSheet({
    super.key,
    required this.currentSort,
    required this.onSortChanged,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    final sortOptions = [
      {'value': 'recommended', 'label': l10n.recommended, 'icon': Icons.star},
      {'value': 'rating', 'label': l10n.highestRated, 'icon': Icons.grade},
      {'value': 'newest', 'label': l10n.newest, 'icon': Icons.new_releases},
      {'value': 'name', 'label': l10n.name, 'icon': Icons.sort_by_alpha},
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.sortBy,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          ...sortOptions.map((option) {
            final isSelected = currentSort == option['value'];
            return ListTile(
              leading: Icon(
                option['icon'] as IconData,
                color: isSelected
                    ? Theme.of(context).colorScheme.primary
                    : null,
              ),
              title: Text(
                option['label'] as String,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : null,
                ),
              ),
              trailing: isSelected
                  ? Icon(
                      Icons.check,
                      color: Theme.of(context).colorScheme.primary,
                    )
                  : null,
              onTap: () => onSortChanged(option['value'] as String),
            );
          }),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

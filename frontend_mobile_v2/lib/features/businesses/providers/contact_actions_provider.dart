import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../data/services/contact_actions.dart';

/// Platform side-effect service (track → open intent).
final contactActionsProvider = Provider<ContactActions>(
  (ref) => ContactActions(ref.watch(apiClientProvider)),
);
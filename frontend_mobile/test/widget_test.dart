import 'package:flutter_test/flutter_test.dart';

import 'package:dalilak_mobile/main.dart';

void main() {
  testWidgets('App bootstraps without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const DalilakMobileApp());
    await tester.pump();

    expect(find.textContaining('Welcome').hitTestable(), findsAny);
  });
}

/// Public surface of the `businesses` feature.
///
/// Other features (search, home, catalog screens) must import through this
/// barrel — never reach into `features/businesses/**` internals
/// (CONVENTIONS_AR.md §2).
library;

export 'domain/entities/business.dart';
export 'providers/business_providers.dart';
export 'presentation/widgets/business_card.dart';

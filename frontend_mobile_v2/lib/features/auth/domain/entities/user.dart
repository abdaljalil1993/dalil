/// A registered user (or the guest placeholder is represented by `null`).
class User {
  const User({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.role = 'user',
    this.cityId,
    this.avatarUrl,
    this.isVerified = false,
  });

  final int id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;

  /// `user` | `business_owner` | `admin`
  final String role;
  final int? cityId;
  final String? avatarUrl;
  final bool isVerified;

  String get fullName => '$firstName $lastName'.trim();

  bool get isOwner => role.contains('owner') || role.contains('business');
  bool get isAdmin => role.contains('admin');
}

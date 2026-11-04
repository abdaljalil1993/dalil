/// DTO for `user` objects in auth responses — JSON lives ONLY in data/.
class UserDto {
  const UserDto({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.role,
    this.cityId,
    this.avatarUrl,
    this.isVerified,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) => UserDto(
        id: (json['id'] as num?)?.toInt() ?? 0,
        firstName: (json['firstName'] ?? '').toString(),
        lastName: (json['lastName'] ?? '').toString(),
        email: json['email'] as String?,
        phone: json['phone'] as String?,
        role: json['role'] as String?,
        cityId: (json['cityId'] as num?)?.toInt(),
        avatarUrl: (json['avatarUrl'] ?? json['avatar']) as String?,
        isVerified: json['isVerified'] == true ||
            json['emailVerified'] == true ||
            json['phoneVerified'] == true,
      );

  final int id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final String? role;
  final int? cityId;
  final String? avatarUrl;
  final bool? isVerified;
}

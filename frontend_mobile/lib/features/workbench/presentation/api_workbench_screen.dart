import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../widgets/app_section_card.dart';

class ApiWorkbenchScreen extends StatefulWidget {
  const ApiWorkbenchScreen({super.key});

  @override
  State<ApiWorkbenchScreen> createState() => _ApiWorkbenchScreenState();
}

class _ApiWorkbenchScreenState extends State<ApiWorkbenchScreen> {
  final _emailCtrl = TextEditingController(text: 'john@example.com');
  final _passwordCtrl = TextEditingController(text: 'StrongPassword123!');
  final _refreshCtrl = TextEditingController();
  final _userIdCtrl = TextEditingController();
  final _categoryIdCtrl = TextEditingController();
  final _categorySlugCtrl = TextEditingController(text: 'restaurants');
  final _cityIdCtrl = TextEditingController();
  final _businessIdCtrl = TextEditingController();
  final _businessSlugCtrl = TextEditingController();
  final _reviewIdCtrl = TextEditingController();
  final _reportIdCtrl = TextEditingController();
  final _adIdCtrl = TextEditingController();
  final _featuredIdCtrl = TextEditingController();

  String _result = 'No request executed yet.';

  Future<void> _run(String label, Future<dynamic> Function() action) async {
    try {
      final res = await action();
      final body = res.data.toString();
      setState(() => _result = '$label\nStatus: ${res.statusCode}\n$body');
    } catch (e) {
      setState(() => _result = '$label failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<FullApiService>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppSectionCard(
          title: 'Auth',
          child: Column(
            children: [
              TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 8),
              TextField(controller: _passwordCtrl, decoration: const InputDecoration(labelText: 'Password')),
              const SizedBox(height: 8),
              TextField(controller: _refreshCtrl, decoration: const InputDecoration(labelText: 'Refresh token')),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('auth.register', () => api.register(firstName: 'John', lastName: 'Doe', email: _emailCtrl.text, password: _passwordCtrl.text)), child: const Text('Register')),
                  OutlinedButton(onPressed: () => _run('auth.login', () => api.login(email: _emailCtrl.text, password: _passwordCtrl.text)), child: const Text('Login')),
                  OutlinedButton(onPressed: () => _run('auth.refresh', () => api.refresh(_refreshCtrl.text)), child: const Text('Refresh')),
                  OutlinedButton(onPressed: () => _run('auth.logout', () => api.logout(refreshToken: _refreshCtrl.text)), child: const Text('Logout')),
                  OutlinedButton(onPressed: () => _run('auth.logoutAll', api.logoutAll), child: const Text('Logout All')),
                  OutlinedButton(onPressed: () => _run('auth.changePassword', () => api.changePassword(currentPassword: 'OldPass123', newPassword: 'NewPass123!')), child: const Text('Change Password')),
                ],
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Users',
          child: Column(
            children: [
              TextField(controller: _userIdCtrl, decoration: const InputDecoration(labelText: 'User ID')),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('users.me', api.me), child: const Text('Me')),
                  OutlinedButton(onPressed: () => _run('users.updateMe', () => api.updateMe({'name': 'John Doe', 'phone': '+96170000000', 'bio': 'Business owner'})), child: const Text('Update Me')),
                  OutlinedButton(onPressed: () => _run('users.list', api.usersList), child: const Text('List')),
                  OutlinedButton(onPressed: () => _run('users.details', () => api.userDetails(_userIdCtrl.text)), child: const Text('Details')),
                  OutlinedButton(onPressed: () => _run('users.status', () => api.userStatus(_userIdCtrl.text, 'active')), child: const Text('Activate')),
                ],
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Categories + SubCategories',
          child: Column(
            children: [
              TextField(controller: _categoryIdCtrl, decoration: const InputDecoration(labelText: 'Category ID')),
              const SizedBox(height: 8),
              TextField(controller: _categorySlugCtrl, decoration: const InputDecoration(labelText: 'Category slug')),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('categories.list', api.categoriesList), child: const Text('List')),
                  OutlinedButton(onPressed: () => _run('categories.details', () => api.categoryDetails(_categorySlugCtrl.text)), child: const Text('Details')),
                  OutlinedButton(onPressed: () => _run('categories.create', () => api.categoryCreate({'name': 'Restaurants', 'slug': 'restaurants'})), child: const Text('Create')),
                  OutlinedButton(onPressed: () => _run('categories.update', () => api.categoryUpdate(_categoryIdCtrl.text, {'name': 'Updated', 'slug': 'updated'})), child: const Text('Update')),
                  OutlinedButton(onPressed: () => _run('categories.delete', () => api.categoryDelete(_categoryIdCtrl.text)), child: const Text('Delete')),
                  OutlinedButton(onPressed: () => _run('sub.create', () => api.subCategoryCreate({'name': 'Fast Food', 'categoryId': _categoryIdCtrl.text})), child: const Text('Sub Create')),
                  OutlinedButton(onPressed: () => _run('sub.update', () => api.subCategoryUpdate(_categoryIdCtrl.text, {'name': 'Updated Sub'})), child: const Text('Sub Update')),
                  OutlinedButton(onPressed: () => _run('sub.delete', () => api.subCategoryDelete(_categoryIdCtrl.text)), child: const Text('Sub Delete')),
                ],
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Cities',
          child: Column(
            children: [
              TextField(controller: _cityIdCtrl, decoration: const InputDecoration(labelText: 'City ID')),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('cities.list', api.citiesList), child: const Text('List')),
                  OutlinedButton(onPressed: () => _run('cities.details', () => api.cityDetails(_cityIdCtrl.text)), child: const Text('Details')),
                  OutlinedButton(onPressed: () => _run('cities.create', () => api.cityCreate({'name': 'Beirut'})), child: const Text('Create')),
                  OutlinedButton(onPressed: () => _run('cities.update', () => api.cityUpdate(_cityIdCtrl.text, {'name': 'New Name'})), child: const Text('Update')),
                  OutlinedButton(onPressed: () => _run('cities.delete', () => api.cityDelete(_cityIdCtrl.text)), child: const Text('Delete')),
                ],
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Businesses',
          child: Column(
            children: [
              TextField(controller: _businessIdCtrl, decoration: const InputDecoration(labelText: 'Business ID')),
              const SizedBox(height: 8),
              TextField(controller: _businessSlugCtrl, decoration: const InputDecoration(labelText: 'Business slug')),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('businesses.list', () => api.businessesList()), child: const Text('List')),
                  OutlinedButton(onPressed: () => _run('businesses.search', () => api.businessesSearch(query: 'coffee', page: 1, limit: 10)), child: const Text('Search')),
                  OutlinedButton(onPressed: () => _run('businesses.pending', api.businessesPending), child: const Text('Pending')),
                  OutlinedButton(onPressed: () => _run('businesses.my', api.businessesMy), child: const Text('My')),
                  OutlinedButton(onPressed: () => _run('businesses.details', () => api.businessDetails(_businessSlugCtrl.text)), child: const Text('Details')),
                  OutlinedButton(onPressed: () => _run('businesses.create', () => api.businessCreate({'name': 'My Business', 'cityId': _cityIdCtrl.text, 'categoryId': _categoryIdCtrl.text, 'description': 'Description', 'address': 'Street 123', 'phone': '+96170000000'})), child: const Text('Create')),
                  OutlinedButton(onPressed: () => _run('businesses.update', () => api.businessUpdate(_businessIdCtrl.text, {'name': 'Updated Business'})), child: const Text('Update')),
                  OutlinedButton(onPressed: () => _run('businesses.approve', () => api.businessApprove(_businessIdCtrl.text)), child: const Text('Approve')),
                  OutlinedButton(onPressed: () => _run('businesses.hours', () => api.businessSetHours(_businessIdCtrl.text, [{'day': 'monday', 'open': '09:00', 'close': '18:00'}])), child: const Text('Set Hours')),
                  OutlinedButton(onPressed: () => _run('businesses.reviews', () => api.businessReviews(_businessIdCtrl.text)), child: const Text('Get Reviews')),
                  OutlinedButton(onPressed: () => _run('businesses.createReview', () => api.businessCreateReview(_businessIdCtrl.text, rating: 5, comment: 'Excellent service')), child: const Text('Create Review')),
                  OutlinedButton(onPressed: () => _run('businesses.report', () => api.businessReport(_businessIdCtrl.text, reason: 'Spam', details: 'Details of report')), child: const Text('Report')),
                ],
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Reviews + Favorites',
          child: Column(
            children: [
              TextField(controller: _reviewIdCtrl, decoration: const InputDecoration(labelText: 'Review ID')),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('reviews.my', api.myReviews), child: const Text('My Reviews')),
                  OutlinedButton(onPressed: () => _run('reviews.update', () => api.reviewUpdate(_reviewIdCtrl.text, rating: 4, comment: 'Updated comment')), child: const Text('Update Review')),
                  OutlinedButton(onPressed: () => _run('reviews.delete', () => api.reviewDelete(_reviewIdCtrl.text)), child: const Text('Delete Review')),
                  OutlinedButton(onPressed: () => _run('reviews.reply', () => api.reviewReply(_reviewIdCtrl.text, 'Thanks for your feedback')), child: const Text('Reply')),
                  OutlinedButton(onPressed: () => _run('reviews.like', () => api.reviewLike(_reviewIdCtrl.text)), child: const Text('Like')),
                  OutlinedButton(onPressed: () => _run('favorites.list', api.favoritesList), child: const Text('Favorites')),
                  OutlinedButton(onPressed: () => _run('favorites.toggle', () => api.favoriteToggle(_businessIdCtrl.text)), child: const Text('Toggle Fav')),
                  OutlinedButton(onPressed: () => _run('favorites.check', () => api.favoriteCheck(_businessIdCtrl.text)), child: const Text('Check Fav')),
                ],
              ),
            ],
          ),
        ),
        AppSectionCard(
          title: 'Advertisements + Featured + Reports + Docs',
          child: Column(
            children: [
              TextField(controller: _adIdCtrl, decoration: const InputDecoration(labelText: 'Ad ID')),
              const SizedBox(height: 8),
              TextField(controller: _featuredIdCtrl, decoration: const InputDecoration(labelText: 'Featured ID')),
              const SizedBox(height: 8),
              TextField(controller: _reportIdCtrl, decoration: const InputDecoration(labelText: 'Report ID')),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _run('ads.active', api.adsActive), child: const Text('Ads Active')),
                  OutlinedButton(onPressed: () => _run('ads.click', () => api.adClick(_adIdCtrl.text, userId: _userIdCtrl.text)), child: const Text('Ad Click')),
                  OutlinedButton(onPressed: () => _run('ads.list', api.adsAdminList), child: const Text('Ads List')),
                  OutlinedButton(onPressed: () => _run('ads.create', () => api.adCreate({'title': 'Banner', 'imageUrl': 'https://example.com/a.png', 'link': 'https://example.com', 'active': true})), child: const Text('Ad Create')),
                  OutlinedButton(onPressed: () => _run('ads.update', () => api.adUpdate(_adIdCtrl.text, {'title': 'Updated Banner'})), child: const Text('Ad Update')),
                  OutlinedButton(onPressed: () => _run('ads.delete', () => api.adDelete(_adIdCtrl.text)), child: const Text('Ad Delete')),
                  OutlinedButton(onPressed: () => _run('featured.active', api.featuredActive), child: const Text('Featured Active')),
                  OutlinedButton(onPressed: () => _run('featured.list', api.featuredList), child: const Text('Featured List')),
                  OutlinedButton(onPressed: () => _run('featured.create', () => api.featuredCreate(_businessIdCtrl.text)), child: const Text('Featured Create')),
                  OutlinedButton(onPressed: () => _run('featured.delete', () => api.featuredDelete(_featuredIdCtrl.text)), child: const Text('Featured Delete')),
                  OutlinedButton(onPressed: () => _run('reports.list', api.reportsList), child: const Text('Reports List')),
                  OutlinedButton(onPressed: () => _run('reports.update', () => api.reportUpdateStatus(_reportIdCtrl.text, 'resolved')), child: const Text('Report Resolve')),
                  OutlinedButton(onPressed: () => _run('dashboard.stats', api.dashboardStats), child: const Text('Dashboard')),
                  OutlinedButton(onPressed: () => _run('docs.ui', api.docsUi), child: const Text('Docs UI')),
                  OutlinedButton(onPressed: () => _run('docs.json', api.docsJson), child: const Text('Docs JSON')),
                  OutlinedButton(onPressed: () => _run('health', api.health), child: const Text('Health')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          _result,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

# Dalilak Mobile (Flutter)

Flutter mobile client created inside `frontend_mobile` with full backend API coverage.

## What is implemented

- Modern Material 3 UI theme with custom typography and gradients.
- Full API service layer matching backend endpoints from `all_endpoints.http`.
- Auth flow screens:
  - Login
  - Register
- Role-aware mobile shell:
  - Overview tab
  - API Workbench tab (direct endpoint execution)
  - Profile tab
  - Admin or Owner console tab (based on role)
- Token persistence and refresh handling using `shared_preferences` + Dio interceptor.
- Endpoint workbench includes actions for:
  - Auth
  - Users
  - Categories + Sub-categories
  - Cities
  - Businesses
  - Reviews
  - Favorites
  - Advertisements
  - Featured
  - Reports
  - Dashboard
  - Docs + Health

## Project structure

- `lib/core`: config, network, storage, theme
- `lib/features`: auth, dashboard, profile, business, admin, workbench
- `lib/state`: app session controller
- `lib/widgets`: reusable UI widgets

## Run instructions

1. Install Flutter SDK and add it to PATH.
2. From `frontend_mobile`, run:

```bash
flutter pub get
flutter create .
flutter run
```

`flutter create .` is required in this environment because Flutter CLI was not available during generation, so platform folders are not auto-generated yet.

## Windows prerequisite (required)

If `flutter run` or `flutter build windows` fails with:
`Building with plugins requires symlink support`, enable Developer Mode in Windows:

```bash
start ms-settings:developers
```

Then enable **Developer Mode** and re-run:

```bash
flutter run -d windows
```

## Run on Android emulator

This workspace now includes ready-to-use launch scripts that avoid the `flutter is not recognized` issue:

- PowerShell: `run_android.ps1`
- Batch: `run_android.bat`

They automatically:

- set `ANDROID_SDK_ROOT`
- set `JAVA_HOME`
- launch the `Dalilak_API_36` emulator
- run the Flutter app on `emulator-5554`

Manual command if needed:

```bash
C:\Users\fadi\.puro\envs\dalilak\flutter\bin\flutter.bat run -d emulator-5554
```

## Optional API base override

Use compile-time vars when running:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:5003/api/v1 --dart-define=HEALTH_BASE_URL=http://localhost:5000
```

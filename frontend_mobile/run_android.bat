@echo off
set FLUTTER=C:\Users\fadi\.puro\envs\dalilak\flutter\bin\flutter.bat
set SDK=C:\Users\fadi\AppData\Local\Android\sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_SDK_ROOT=%SDK%
set ANDROID_HOME=%SDK%
set PATH=%JAVA_HOME%\bin;%SDK%\platform-tools;%PATH%
cd /d %~dp0
call "%FLUTTER%" emulators --launch Dalilak_API_36
call "%SDK%\platform-tools\adb.exe" wait-for-device
call "%FLUTTER%" run -d emulator-5554

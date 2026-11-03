$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$flutter = 'C:\Users\fadi\.puro\envs\dalilak\flutter\bin\flutter.bat'
$sdk = 'C:\Users\fadi\AppData\Local\Android\sdk'
$javaHome = 'C:\Program Files\Android\Android Studio\jbr'
$emulatorName = 'Dalilak_API_36'

$env:ANDROID_SDK_ROOT = $sdk
$env:ANDROID_HOME = $sdk
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$sdk\platform-tools;$env:Path"

Set-Location $projectRoot

& $flutter emulators --launch $emulatorName
& "$sdk\platform-tools\adb.exe" wait-for-device
& $flutter run -d emulator-5554

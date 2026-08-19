[app]
title = Zeiterfassung
package.name = zeiterfassung
package.domain = org.zeiterfassung

source.dir = .
source.include_exts = py,png,jpg,kv,atlas,html,css,js

version = 1.0.0
requirements = python3,kivy==2.3.0,kivymd,urllib3,requests

orientation = portrait

fullscreen = 0
android.permissions = INTERNET

android.api = 33
android.minapi = 21
android.sdk_build_tools = 33.0.2
android.ndk = 25b
android.archs = arm64-v8a
android.accept_sdk_license = True

[buildozer]
log_level = 2
warn_on_root = 1

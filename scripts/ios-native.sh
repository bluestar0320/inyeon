#!/bin/bash
# iOS 프로젝트(ios/)를 설정에서 만들고 몇번더에 맞게 고친다.
# 시뮬레이터 확인(ios.yml)과 스토어 빌드(ios-release.yml)가 똑같이 쓴다. 맥에서만 돈다.
# 웹 빌드(out/)가 먼저 있어야 한다.
set -euo pipefail

npx cap add ios
npx cap sync ios

# 앱스토어 아이콘은 1024 한 장(투명 없이). 모서리는 iOS가 깎는다.
d=ios/App/App/Assets.xcassets/AppIcon.appiconset
f=$(ls "$d"/*.png | head -1)
node -e "require('sharp')('public/icon-maskable.png').resize(1024,1024).flatten({background:'#24252d'}).png().toFile(process.argv[1])" "$f"
# 켜는 순간의 화면도 Capacitor 로고 대신 시계로.
node scripts/native-splash.mjs ios/App/App/Assets.xcassets/Splash.imageset/*.png

P=ios/App/App/Info.plist
plist() { /usr/libexec/PlistBuddy -c "$1" "$P"; }
# 암호화는 HTTPS뿐이라 수출 규정 문서가 필요 없다.
plist "Add :ITSAppUsesNonExemptEncryption bool false"
# 내보낸 백업 파일을 「파일」 앱에서 볼 수 있게.
plist "Add :UIFileSharingEnabled bool true"
plist "Add :LSSupportsOpeningDocumentsInPlace bool true"
# 사진 고르기(<input type=file>)에 「사진 찍기」가 같이 뜨고, 공유 시트에 「이미지 저장」이 있다.
# 이 문장이 없으면 그 단추를 누르는 순간 앱이 닫힌다(그리고 심사에서 반려된다).
plist "Add :NSCameraUsageDescription string '사진을 찍어 인연 카드에 넣을 때만 씁니다. Used only when you take a photo for a card.'"
plist "Add :NSPhotoLibraryAddUsageDescription string '공유 카드를 사진 앱에 저장할 때만 씁니다. Used only to save your share card to Photos.'"
# 앱 화면이 지원하는 언어. App Store 「언어」 칸과 시스템 대화상자 언어가 이걸 따른다.
plist "Add :CFBundleLocalizations array"
for l in ko en ja es zh-Hans; do plist "Add :CFBundleLocalizations: string $l"; done
plist "Set :CFBundleDevelopmentRegion ko"

X=ios/App/App.xcodeproj/project.pbxproj
# Next 16이 만드는 스크립트는 Safari 16.4 이상을 바란다. iOS 웹뷰는 iOS 판과 같이 가므로
# 그보다 낮은 iPhone에는 아예 설치되지 않게 한다(템플릿 기본은 15.0 — 빈 화면이 뜬다).
sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]*;/IPHONEOS_DEPLOYMENT_TARGET = 16.4;/g' "$X"
! grep -q 'IPHONEOS_DEPLOYMENT_TARGET = 15' "$X" || exit 1
# iPhone 전용. iPad에서는 iPhone 앱 그대로 돈다. iPad를 따로 내면 iPad 스크린샷이 따로 필요하다.
sed -i '' 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' "$X"
! grep -q 'TARGETED_DEVICE_FAMILY = "1,2"' "$X" || exit 1

# 개인정보 매니페스트를 앱 묶음에 넣는다(설명은 파일 안에). Xcode 프로젝트에 파일을 더하는 건
# CocoaPods와 함께 깔려 있는 xcodeproj gem으로 한다.
cp scripts/ios/PrivacyInfo.xcprivacy ios/App/App/PrivacyInfo.xcprivacy
gem list -i xcodeproj >/dev/null || sudo gem install xcodeproj --no-document
ruby -e 'require "xcodeproj"; p = Xcodeproj::Project.open("ios/App/App.xcodeproj"); t = p.targets.find { |x| x.name == "App" }; t.add_resources([p.main_group["App"].new_file("PrivacyInfo.xcprivacy")]); p.save'
grep -q 'PrivacyInfo.xcprivacy in Resources' "$X"

# 기록(localStorage·IndexedDB)과 사진은 Library/WebKit에 있고, 이 폴더는 iCloud·PC 백업에 실린다.
# 「이 폰 밖으로 나가지 않아요」를 지키려고 켤 때마다 백업에서 뺀다(안드로이드는 apk.yml에서 같은 일을 한다).
# 폰을 바꿀 때는 설정의 내보내기·불러오기로 옮긴다.
A=ios/App/App/AppDelegate.swift
perl -0pi -e 's|// Override point for customization after application launch.|var webkit = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask)[0].appendingPathComponent("WebKit", isDirectory: true)\n        try? FileManager.default.createDirectory(at: webkit, withIntermediateDirectories: true)\n        var noBackup = URLResourceValues()\n        noBackup.isExcludedFromBackup = true\n        try? webkit.setResourceValues(noBackup)|' "$A"
grep -q isExcludedFromBackup "$A"

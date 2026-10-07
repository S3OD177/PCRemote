# Apple release checklist

The source is configured for iOS 16.4 or later with bundle identifier
`com.s3od177.pcremote`, version `1.0.0`, and build `1`.

## Required account setup

1. Join the Apple Developer Program and confirm the bundle identifier is unique
   and owned by the publishing team.
2. Request Apple's Multicast Networking Entitlement. The Wake-on-LAN feature
   sends a UDP broadcast and the app declares
   `com.apple.developer.networking.multicast`.
3. Sign in to Expo/EAS, run `npx eas-cli init` in `iphone-app`, and commit the
   real EAS project ID that command adds.
4. Create the app in App Store Connect with the same bundle identifier.
5. Publish `PRIVACY.md` at a public HTTPS URL and add a monitored support URL.

## Validation and build

```bash
cd iphone-app
npm ci
npm run typecheck
npx expo-doctor
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Test pairing, local-network permission denial/recovery, Wake-on-LAN, every power
action, light/dark appearance, Arabic RTL layout, VoiceOver labels, and offline
errors on at least one physical iPhone before submission.

## App Store Connect

- Use `STORE_LISTING.md` for the draft title, subtitle, description, keywords,
  review notes, and privacy answers.
- Capture current screenshots on the required iPhone display sizes. The included
  `app-preview.png` is promotional artwork, not a complete screenshot set.
- Set the privacy policy and support URLs.
- Complete age rating, export compliance, content rights, and pricing.
- In App Privacy, verify that no data is collected. If any SDK or behavior is
  added later, update this answer.
- Explain in Review Notes that the Windows companion is required, provide a
  public download link, and give the reviewer exact pairing steps.
- Submit only after Apple grants the multicast entitlement and the signed build
  contains it.

## Before publishing a Windows release

- Build `PCRemote.exe` from the committed source in clean CI.
- Code-sign the executable to avoid SmartScreen warnings.
- Publish a SHA-256 checksum and installation instructions.
- Scan the final binary and attach it to a versioned GitHub Release.


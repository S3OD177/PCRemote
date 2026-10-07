# PC Remote

PC Remote is an iPhone app and Windows companion that lets a paired phone wake,
lock, sleep, restart, or shut down a PC on the same local network.

Pairing is performed with a QR code. Commands are authenticated with HMAC-SHA256,
and pairing secrets are stored in the iOS Keychain through Expo SecureStore.

## Repository layout

- `iphone-app/` — Expo/React Native iOS app
- `windows-helper/` — Windows companion executable and Go source
- `STORE_LISTING.md` — draft App Store metadata
- `PRIVACY.md` — privacy policy suitable for publishing at a public URL
- `APPLE_RELEASE.md` — release and App Store Connect checklist

## iPhone development

Requirements: Node.js 20+, npm, an Expo account, an Apple Developer account,
and a macOS/Xcode environment or EAS Build.

```bash
cd iphone-app
npm install
npm run typecheck
npx expo-doctor
npx eas-cli init
npx eas-cli build --platform ios --profile production
```

The app uses the bundle identifier `com.s3od177.pcremote`. Change it before the
first App Store Connect upload if it is not owned by the publishing Apple team.

## Windows helper development

From `windows-helper/source`, install Go and run:

```bash
go test ./...
go build -o PCRemote.exe .
```

The included `windows-helper/PCRemote.exe` is a convenience build. For a public
release, rebuild it from source in a trusted Windows CI environment and publish
its checksum with the release.

## Security and privacy

The app is designed for the local network and has no analytics or advertising
SDKs. See [PRIVACY.md](PRIVACY.md) and [APPLE_RELEASE.md](APPLE_RELEASE.md).


# Troubleshooting Guide for Ehgezli Mobile App

## Common Issues

### Bundling Issues

#### Problem: "Could not connect to development server"

If you see an error like this:

```
Could not connect to development server.

Ensure the following:
- Node server is running and available on the same network - run 'npm start' from react-native root
- Node server URL is correctly set in AppDelegate
- WiFi is enabled and connected to the same network as the Node Server
```

#### Root Causes

1. **Corrupted Metro Bundler Cache**: The Metro bundler (which compiles your React Native code) may have a corrupted cache that prevents proper compilation.

2. **Configuration Conflicts**: Conflicts between app.json and app.config.js files, particularly with asset paths and web configuration.

3. **Router Origin Setting**: The `router.origin: 'localhost:8081'` setting in app.config.js forces the app to connect only to localhost instead of your device's network IP address.

#### Solution: Reset Development Environment

We've added a reset script to package.json that performs a comprehensive cache reset:

```bash
npm run reset
```

This script:
- Clears the Metro bundler cache (`node_modules/.cache`)
- Removes the Expo configuration cache (`.expo` directory)
- Resets the Watchman file watching system (`watchman watch-del-all`)

After running the reset script, start the app again:

```bash
npx expo start -c
```

#### Additional Troubleshooting Steps

If the reset script doesn't work, try these additional approaches:

1. **Kill all Metro processes**:
   ```bash
   killall -9 node
   ```

2. **Delete and reinstall node_modules**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Try using a tunnel connection**:
   ```bash
   npx expo start --tunnel
   ```

4. **Check for conflicting dependencies**:
   - Expo SDK 53 is very recent and might have compatibility issues with some packages

5. **Try running on a specific platform**:
   ```bash
   npx expo start --ios --localhost
   ```
   or
   ```bash
   npx expo start --web --no-dev
   ```

6. **Check your network**:
   - Make sure your computer and device are on the same network
   - Try disabling any VPNs or firewalls temporarily

## Configuration Best Practices

### app.config.js and app.json

When modifying app.config.js and app.json, ensure:

1. Asset paths match exactly between both files
2. Avoid hardcoding network addresses (like `localhost:8081`)
3. After making configuration changes, always run the reset script to clear caches

## Expo SDK Version Considerations

The project currently uses Expo SDK 53, which is a recent version. When adding new dependencies, make sure they are compatible with this SDK version to avoid bundling issues.

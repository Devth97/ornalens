const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const SHIMS_DIR = path.resolve(__dirname, 'shims');

// Intercept ALL react-dom imports — pulled in by @clerk/react (dependency of @clerk/expo v3)
// DOM APIs are never actually called on React Native, so shims are safe
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    const subpath = moduleName === 'react-dom' ? 'index' : moduleName.replace('react-dom/', '');
    const shimPath = path.join(SHIMS_DIR, 'react-dom', `${subpath}.js`);
    // Fall back to index shim if specific subpath shim doesn't exist
    const fs = require('fs');
    const resolvedPath = fs.existsSync(shimPath)
      ? shimPath
      : path.join(SHIMS_DIR, 'react-dom', 'index.js');
    return { filePath: resolvedPath, type: 'sourceFile' };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

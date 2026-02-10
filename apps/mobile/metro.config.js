// ============================================================================
// 1Ummah Mobile — Metro Configuration
// Ensures correct module resolution in the npm workspaces monorepo so that
// all packages share a single React instance (the one in apps/mobile).
// ============================================================================

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so imports from packages/shared work
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve from both the mobile-specific and root node_modules,
//    but prefer mobile-specific first (order matters).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force ALL react imports to resolve from the mobile app's node_modules.
//    The root workspace has React 19.2.3 (hoisted from web app) while mobile
//    needs React 19.1.0 (for Expo SDK 54). Without this, hoisted packages like
//    @tanstack/react-query resolve the root React, creating two instances and
//    causing "Invalid hook call" errors.
const mobileReactDir = path.resolve(projectRoot, 'node_modules/react');

// Map of react subpaths to their actual file paths
const reactFileMap = {};
function buildReactFileMap(dir, prefix) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        buildReactFileMap(fullPath, prefix + '/' + entry.name);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
        reactFileMap[prefix + '/' + entry.name] = fullPath;
      }
    }
  } catch {}
}
buildReactFileMap(mobileReactDir, 'react');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Intercept ALL react imports and return explicit paths to mobile's copy
  if (moduleName === 'react') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(mobileReactDir, 'index.js'),
    };
  }
  if (moduleName === 'react/jsx-runtime') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(mobileReactDir, 'jsx-runtime.js'),
    };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(mobileReactDir, 'jsx-dev-runtime.js'),
    };
  }
  if (moduleName.startsWith('react/')) {
    // Handle any other react subpath imports
    const subpath = moduleName;
    const jsFile = path.resolve(mobileReactDir, moduleName.slice('react/'.length));
    // Try exact path first, then with .js extension
    for (const candidate of [jsFile, jsFile + '.js', jsFile + '/index.js']) {
      if (fs.existsSync(candidate)) {
        return {
          type: 'sourceFile',
          filePath: candidate,
        };
      }
    }
  }

  // Default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

// 4. Block Metro from crawling into other workspace apps' node_modules
//    which may contain incompatible versions.
config.resolver.blockList = [
  /apps\/web\/node_modules\/.*/,
  /apps\/api\/node_modules\/.*/,
];

module.exports = config;

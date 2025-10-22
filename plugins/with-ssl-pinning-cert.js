// Config plugin to copy SSL pinning cert files from the project assets folder
// into native platforms (Android assets and iOS bundle) during prebuild/EAS.
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[with-ssl-pinning-cert] Source file not found: ${src}`);
    return false;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

const withSSLPinningCert = (config, props = {}) => {
  const certFiles = props.certFiles || [];
  const sourceDir = props.sourceDir || 'assets';

  // ANDROID: copy to android/app/src/main/assets
  config = withDangerousMod(config, [
    'android',
    async (conf) => {
      try {
        const androidAssets = path.join(
          conf.modRequest.platformProjectRoot,
          'app',
          'src',
          'main',
          'assets'
        );
        ensureDir(androidAssets);
        for (const file of certFiles) {
          const src = path.join(conf.modRequest.projectRoot, sourceDir, file);
          const dest = path.join(androidAssets, file);
          if (copyIfExists(src, dest)) {
            console.log(`[with-ssl-pinning-cert] Copied ${file} -> ANDROID assets`);
          }
        }
      } catch (e) {
        console.warn('[with-ssl-pinning-cert] Android copy failed:', e);
      }
      return conf;
    },
  ]);

  // iOS: copy to ios/<AppName>/ and add to Xcode project as resource
  config = withDangerousMod(config, [
    'ios',
    async (conf) => {
      try {
        const appName = conf.modRequest.projectName;
        const iosAppDir = path.join(conf.modRequest.platformProjectRoot, appName);
        for (const file of certFiles) {
          const src = path.join(conf.modRequest.projectRoot, sourceDir, file);
          const dest = path.join(iosAppDir, file);
          if (copyIfExists(src, dest)) {
            console.log(`[with-ssl-pinning-cert] Copied ${file} -> iOS project`);
          }
        }
      } catch (e) {
        console.warn('[with-ssl-pinning-cert] iOS copy failed:', e);
      }
      return conf;
    },
  ]);

  config = withXcodeProject(config, (conf) => {
    try {
      const project = conf.modResults;
      const appName = conf.modRequest.projectName;
      const iosAppDir = path.join(conf.modRequest.platformProjectRoot, appName);
      for (const file of certFiles) {
        const filePath = path.join(iosAppDir, file);
        if (fs.existsSync(filePath)) {
          const group = project.findPBXGroupKey({ name: appName }) || project.getFirstProject().firstProject.mainGroup;
          const hasFile = project.hasFile(file);
          if (!hasFile) {
            project.addResourceFile(filePath, { target: project.getFirstTarget().uuid, lastKnownFileType: 'file' }, group);
            console.log(`[with-ssl-pinning-cert] Added ${file} to iOS Resources`);
          }
        }
      }
    } catch (e) {
      console.warn('[with-ssl-pinning-cert] iOS Xcode linking failed:', e);
    }
    return conf;
  });

  return config;
};

module.exports = withSSLPinningCert;

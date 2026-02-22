const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'build.gradle'
);

const javaTarget = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'src',
  'main',
  'java',
  'cn',
  'jystudio',
  'bluetooth',
  'RNBluetoothManagerModule.java'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');
const updated = original
  .replace(/http:\/\/jcenter\.bintray\.com\//g, 'https://jcenter.bintray.com/')
  .replace(/http:\/\/repo\.spring\.io\/plugins-release\//g, 'https://repo.spring.io/plugins-release/')
  .replace(/\bcompile\s+fileTree\(/g, 'implementation fileTree(')
  .replace(/\bcompile\s+group:\s*'com\.android\.support',\s*name:\s*'support-v4',\s*version:\s*'27\.0\.0'/g, "implementation 'androidx.core:core:1.12.0'")
  .replace(/compileSdkVersion\s+27/g, 'compileSdkVersion 35')
  .replace(/targetSdkVersion\s+24/g, 'targetSdkVersion 35')
  .replace(/minSdkVersion\s+16/g, 'minSdkVersion 24')
  .replace(/\s*buildToolsVersion\s+"27\.0\.3"\s*\n/g, '\n')
  .replace(/implementation '\\com\.facebook\.react:react-native:\\+'/g, "implementation 'com.facebook.react:react-android'")
  .replace(/implementation\s+group:\s*'com\.android\.support',[^\n]*\n/g, '');

const withExcludes = updated.includes('configurations.all {')
  ? updated
  : updated.replace(
      /apply plugin: 'com\.android\.library'\n/,
      "apply plugin: 'com.android.library'\n\nconfigurations.all {\n    exclude group: 'com.android.support', module: 'support-media-compat'\n    exclude group: 'com.android.support', module: 'support-v4'\n}\n"
    );

if (withExcludes !== original) {
  fs.writeFileSync(target, withExcludes, 'utf8');
}

if (fs.existsSync(javaTarget)) {
  const javaOriginal = fs.readFileSync(javaTarget, 'utf8');
  const javaUpdated = javaOriginal
    .replace(/import\s+android\.support\.v4\.app\.ActivityCompat;/g, 'import androidx.core.app.ActivityCompat;')
    .replace(/import\s+android\.support\.v4\.content\.ContextCompat;/g, 'import androidx.core.content.ContextCompat;');

  if (javaUpdated !== javaOriginal) {
    fs.writeFileSync(javaTarget, javaUpdated, 'utf8');
  }
}

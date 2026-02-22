const fs = require('fs');
const path = require('path');

// Fix DIRECTION null error in react-native I18nManager
const i18nPaths = [
  path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'ReactNative', 'I18nManager.js'),
  path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Utilities', 'I18nManager.js'),
];

const findI18nPath = () => i18nPaths.find(candidate => fs.existsSync(candidate));
const i18nPath = findI18nPath();

if (i18nPath) {
  let content = fs.readFileSync(i18nPath, 'utf8');

  const hasSafe = content.includes('const safeI18nConstants');
  const hasI18n = content.includes('const i18nConstants: I18nManagerConstants = getI18nManagerConstants();');

  if (!hasSafe && hasI18n) {
    content = content.replace(
      'const i18nConstants: I18nManagerConstants = getI18nManagerConstants();',
      'const i18nConstants: I18nManagerConstants = getI18nManagerConstants();\n' +
        'const safeI18nConstants: I18nManagerConstants & {DIRECTION?: "ltr" | "rtl"} =\n' +
        '  i18nConstants || {isRTL: false, doLeftAndRightSwapInRTL: true};\n' +
        'safeI18nConstants.DIRECTION = safeI18nConstants.isRTL ? "rtl" : "ltr";'
    );

    content = content.replace(/\bi18nConstants\b/g, 'safeI18nConstants');

    fs.writeFileSync(i18nPath, content, 'utf8');
    console.log('[fix-i18n] Applied I18nManager safe constants patch');
  } else if (hasSafe && !hasI18n) {
    // Fix accidental duplicate safeI18nConstants declaration if it exists
    content = content.replace(
      /const safeI18nConstants: I18nManagerConstants = getI18nManagerConstants\(\);\s*const safeI18nConstants: I18nManagerConstants & \{DIRECTION\?: "ltr" \| "rtl"\} =/m,
      'const i18nConstants: I18nManagerConstants = getI18nManagerConstants();\nconst safeI18nConstants: I18nManagerConstants & {DIRECTION?: "ltr" | "rtl"} ='
    );

    fs.writeFileSync(i18nPath, content, 'utf8');
    console.log('[fix-i18n] Fixed duplicate safeI18nConstants declaration');
  }
} else {
  console.log('[fix-i18n] I18nManager not found, skipping patch');
}

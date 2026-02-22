const fs = require('fs');
const path = require('path');

// Fix DIRECTION null error in react-native I18nManager
const i18nPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Utilities', 'I18nManager.js');

if (fs.existsSync(i18nPath)) {
  let content = fs.readFileSync(i18nPath, 'utf8');
  
  // Check if already patched
  if (!content.includes('I18nManager.DIRECTION = I18nManager.DIRECTION ||')) {
    // Add safe initialization for DIRECTION property
    content = content.replace(
      'I18nManager.DIRECTION =',
      'I18nManager.DIRECTION = I18nManager.DIRECTION ||'
    );
    
    fs.writeFileSync(i18nPath, content, 'utf8');
    console.log('[fix-i18n] Applied I18nManager.DIRECTION null safety patch');
  }
} else {
  console.log('[fix-i18n] I18nManager not found, skipping patch');
}

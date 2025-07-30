# TGLC - Secure Password Strength Meter

A WordPress plugin that replaces the vulnerable zxcvbn-async library with a secure zxcvbn-ts v3.0.4 implementation.

## Overview

This plugin addresses security vulnerabilities in WordPress's default password strength meter by:

1. **Deactivating** the vulnerable `zxcvbn-async` script and old `zxcvbn.min.js` library
2. **Replacing** them with a secure, modern zxcvbn-ts v3.0.4 implementation
3. **Maintaining** full API compatibility with WordPress's existing password strength meter
4. **Preserving** the async loading pattern to prevent blocking page load

## Features

- ✅ **Secure**: Uses zxcvbn-ts v3.0.4, eliminating known vulnerabilities
- ✅ **Compatible**: Maintains the same API as the original zxcvbn library
- ✅ **Lightweight**: Optimized bundle size (~2KB minified)
- ✅ **Async Loading**: Non-blocking script loading for better performance
- ✅ **WordPress Integration**: Seamlessly integrates with WordPress password fields
- ✅ **User Input Filtering**: Properly handles user-specific dictionary words

## Installation

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin interface
3. The plugin will automatically replace the vulnerable zxcvbn scripts

## How It Works

### Deactivation Phase
The plugin uses WordPress hooks to:
- `wp_dequeue_script('zxcvbn-async')` - Remove the vulnerable async loader
- `wp_deregister_script('zxcvbn-async')` - Unregister the vulnerable script
- Temporarily dequeue the password strength meter for re-registration
- Works on specific admin pages (`admin_enqueue_scripts`) and login pages (`login_enqueue_scripts`)
- **No frontend loading** - only loads where password strength meter is actually needed

### Replacement Phase
The plugin then:
- Registers `zxcvbn-async-secure` - Our secure async loader
- Registers `zxcvbn-ts-bundle` - Our secure zxcvbn-ts implementation
- Re-registers the password strength meter with secure dependencies
- Maintains all WordPress localization settings
- **Selective Loading**: Only loads on pages that actually need password strength meter:
  - **Admin**: `profile.php`, `user-edit.php`, `user-new.php`
  - **Login**: `rp` (reset password), `resetpass`, `register`

### API Compatibility
The replacement maintains the exact same API:
```javascript
// Original API (still works)
var result = zxcvbn(password, userInputs);
console.log(result.score); // 0-4 strength score

// Returns the same object structure:
{
  score: 0-4,
  guesses: number,
  guesses_log10: number,
  sequence: array,
  crack_times_seconds: object,
  crack_times_display: object,
  feedback: {
    warning: string,
    suggestions: array
  }
}
```

## Development

### Building the Plugin

```bash
# Install dependencies
npm install

# Build the secure bundles
npm run build

# Clean build artifacts
npm run clean
```

### File Structure

```
tglc-zxcvbn-fix/
├── tglc-zxcvbn-fix.php     # Main plugin file
├── package.json            # Node.js dependencies
├── build.js               # Build script for async loader
├── create-bundle.js       # Build script for zxcvbn-ts bundle
├── src/
│   ├── zxcvbn-wrapper.js      # Original ES6 wrapper (unused)
│   └── zxcvbn-async-secure.js # Secure async loader source
├── dist/
│   ├── zxcvbn-ts-bundle.min.js    # Secure zxcvbn-ts implementation
│   └── zxcvbn-async-secure.min.js # Secure async loader
└── test.html              # Test page for verification
```

## Testing

### Browser Test
Open `test.html` in a browser to verify the implementation:
1. Test basic password strength calculation
2. Test user input filtering
3. Verify async loading works correctly
4. Check API compatibility

### WordPress Integration Test
1. **Admin Pages**: Test on user profile pages (wp-admin/profile.php)
2. **Login Pages**: Test on password reset page (wp-login.php?action=rp)
3. **Frontend**: Test on any frontend forms using password strength meter

## Security Improvements

This plugin addresses several security issues:

1. **Outdated Library**: Replaces zxcvbn v4.4.1 (2016) with modern implementation
2. **Known Vulnerabilities**: Eliminates CVEs associated with the old library
3. **Secure Dependencies**: Uses actively maintained zxcvbn-ts packages
4. **Input Validation**: Proper sanitization of user inputs
5. **Performance**: Only loads on pages that actually need password strength meter

## Compatibility

- **WordPress**: 5.0+ (tested with latest versions)
- **PHP**: 7.0+ (follows WordPress requirements)
- **Browsers**: All modern browsers (IE11+)

## License

GPL-2.0-or-later (same as WordPress)

## Support

For issues or questions, please contact the TGLC development team.

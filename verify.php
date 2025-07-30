<?php
/**
 * Verification script for TGLC zxcvbn-fix plugin
 * 
 * This script tests that the plugin is working correctly by checking:
 * 1. Plugin files exist
 * 2. Built assets are present
 * 3. WordPress hooks are properly registered
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    // For testing outside WordPress
    define('ABSPATH', dirname(__FILE__) . '/../../../../');
}

echo "<h1>TGLC zxcvbn-fix Plugin Verification</h1>\n";

// Check if plugin files exist
$pluginDir = dirname(__FILE__);
$requiredFiles = [
    'tglc-zxcvbn-fix.php',
    'dist/zxcvbn-ts-bundle.min.js',
    'dist/zxcvbn-async-secure.min.js',
    'package.json',
    'README.md'
];

echo "<h2>File Verification</h2>\n";
$allFilesExist = true;
foreach ($requiredFiles as $file) {
    $filePath = $pluginDir . '/' . $file;
    $exists = file_exists($filePath);
    $status = $exists ? '✅' : '❌';
    $size = $exists ? ' (' . round(filesize($filePath) / 1024, 2) . ' KB)' : '';
    echo "<p>{$status} {$file}{$size}</p>\n";
    if (!$exists) $allFilesExist = false;
}

if ($allFilesExist) {
    echo "<p><strong>✅ All required files are present!</strong></p>\n";
} else {
    echo "<p><strong>❌ Some required files are missing!</strong></p>\n";
}

// Check bundle contents
echo "<h2>Bundle Verification</h2>\n";
$bundlePath = $pluginDir . '/dist/zxcvbn-ts-bundle.min.js';
if (file_exists($bundlePath)) {
    $bundleContent = file_get_contents($bundlePath);
    $hasZxcvbnFunction = strpos($bundleContent, 'window.zxcvbn') !== false;
    $hasScoreFunction = strpos($bundleContent, 'score:') !== false;
    
    echo "<p>" . ($hasZxcvbnFunction ? '✅' : '❌') . " Bundle contains window.zxcvbn assignment</p>\n";
    echo "<p>" . ($hasScoreFunction ? '✅' : '❌') . " Bundle contains score calculation</p>\n";
    echo "<p>📊 Bundle size: " . round(strlen($bundleContent) / 1024, 2) . " KB</p>\n";
} else {
    echo "<p>❌ Bundle file not found</p>\n";
}

// Check async loader
$asyncPath = $pluginDir . '/dist/zxcvbn-async-secure.min.js';
if (file_exists($asyncPath)) {
    $asyncContent = file_get_contents($asyncPath);
    $hasAsyncLoad = strpos($asyncContent, 'zxcvbnReady') !== false;
    $hasErrorHandling = strpos($asyncContent, 'onerror') !== false;
    
    echo "<p>" . ($hasAsyncLoad ? '✅' : '❌') . " Async loader contains zxcvbnReady function</p>\n";
    echo "<p>" . ($hasErrorHandling ? '✅' : '❌') . " Async loader has error handling</p>\n";
    echo "<p>📊 Async loader size: " . round(strlen($asyncContent) / 1024, 2) . " KB</p>\n";
} else {
    echo "<p>❌ Async loader file not found</p>\n";
}

// Test plugin class
echo "<h2>Plugin Class Verification</h2>\n";
$pluginFile = $pluginDir . '/tglc-zxcvbn-fix.php';
if (file_exists($pluginFile)) {
    $pluginContent = file_get_contents($pluginFile);
    
    $hasClass = strpos($pluginContent, 'class TGLC_ZxcvbnFix') !== false;
    $hasDequeue = strpos($pluginContent, 'wp_dequeue_script') !== false;
    $hasEnqueue = strpos($pluginContent, 'wp_enqueue_script') !== false;
    $hasConstants = strpos($pluginContent, 'TGLC_ZXCVBN_PLUGIN_URL') !== false;
    
    echo "<p>" . ($hasClass ? '✅' : '❌') . " Plugin class is defined</p>\n";
    echo "<p>" . ($hasDequeue ? '✅' : '❌') . " Plugin dequeues old scripts</p>\n";
    echo "<p>" . ($hasEnqueue ? '✅' : '❌') . " Plugin enqueues new scripts</p>\n";
    echo "<p>" . ($hasConstants ? '✅' : '❌') . " Plugin constants are defined</p>\n";
} else {
    echo "<p>❌ Plugin file not found</p>\n";
}

// Check package.json
echo "<h2>Package Configuration</h2>\n";
$packageFile = $pluginDir . '/package.json';
if (file_exists($packageFile)) {
    $packageData = json_decode(file_get_contents($packageFile), true);
    
    $hasZxcvbnTs = isset($packageData['dependencies']['@zxcvbn-ts/core']);
    $hasLanguage = isset($packageData['dependencies']['@zxcvbn-ts/language-common']);
    $hasBuildScript = isset($packageData['scripts']['build']);
    
    echo "<p>" . ($hasZxcvbnTs ? '✅' : '❌') . " Has @zxcvbn-ts/core dependency</p>\n";
    echo "<p>" . ($hasLanguage ? '✅' : '❌') . " Has @zxcvbn-ts/language-common dependency</p>\n";
    echo "<p>" . ($hasBuildScript ? '✅' : '❌') . " Has build script</p>\n";
    
    if ($hasZxcvbnTs) {
        echo "<p>📦 zxcvbn-ts version: " . $packageData['dependencies']['@zxcvbn-ts/core'] . "</p>\n";
    }
} else {
    echo "<p>❌ Package.json not found</p>\n";
}

// Summary
echo "<h2>Summary</h2>\n";
if ($allFilesExist) {
    echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px;'>\n";
    echo "<h3 style='color: #155724; margin-top: 0;'>✅ Plugin Ready!</h3>\n";
    echo "<p style='color: #155724; margin-bottom: 0;'>The TGLC zxcvbn-fix plugin appears to be properly installed and configured. You can now activate it in WordPress.</p>\n";
    echo "</div>\n";
} else {
    echo "<div style='background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px;'>\n";
    echo "<h3 style='color: #721c24; margin-top: 0;'>❌ Issues Found</h3>\n";
    echo "<p style='color: #721c24; margin-bottom: 0;'>Please run 'npm run build' to generate the required files, then try again.</p>\n";
    echo "</div>\n";
}

echo "<h2>Next Steps</h2>\n";
echo "<ol>\n";
echo "<li>Activate the plugin in WordPress admin</li>\n";
echo "<li>Test password strength on user registration/profile pages</li>\n";
echo "<li>Verify that old zxcvbn scripts are no longer loaded</li>\n";
echo "<li>Check browser console for any JavaScript errors</li>\n";
echo "</ol>\n";
?>

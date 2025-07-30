<?php
/**
 * Plugin Name: Secure Password Strength Meter
 * Description: Replaces old and vulnerable zxcvbn-async with zxcvbn-ts v3.0.4
 * Version: 1.0.0
 * Author: Michael Fritz / HENNE ORDNUNG GmbH www.henne-ordnung.de
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('TGLC_ZXCVBN_PLUGIN_URL', plugin_dir_url(__FILE__));
define('TGLC_ZXCVBN_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('TGLC_ZXCVBN_VERSION', '1.0.0');

class TGLC_ZxcvbnFix {

    public function __construct() {
        add_action('init', array($this, 'init'));
    }

    public function init() {
        // Dequeue the vulnerable zxcvbn scripts (always do this to prevent loading)
        add_action('wp_enqueue_scripts', array($this, 'dequeue_vulnerable_scripts'), 20);
        add_action('admin_enqueue_scripts', array($this, 'dequeue_vulnerable_scripts'), 20);
        add_action('login_enqueue_scripts', array($this, 'dequeue_vulnerable_scripts'), 20);

        // Enqueue our secure replacement only where needed
        add_action('admin_enqueue_scripts', array($this, 'enqueue_secure_scripts_admin'), 21);
        add_action('login_enqueue_scripts', array($this, 'enqueue_secure_scripts_login'), 21);
        // Note: No wp_enqueue_scripts hook - we don't want this on frontend
    }

    public function dequeue_vulnerable_scripts() {
        // Remove the old vulnerable zxcvbn scripts
        wp_dequeue_script('zxcvbn-async');
        wp_deregister_script('zxcvbn-async');

        // Also remove the password strength meter temporarily so we can re-register it
        wp_dequeue_script('password-strength-meter');
        wp_deregister_script('password-strength-meter');
    }

    public function enqueue_secure_scripts_admin() {
        // Only load on specific admin pages that need password strength meter
        global $pagenow;

        // Pages that use password strength meter
        $password_pages = array(
            'profile.php',      // User profile page
            'user-edit.php',    // Edit user page
            'user-new.php',     // Add new user page
        );

        if (!in_array($pagenow, $password_pages)) {
            return; // Don't load on other admin pages
        }

        $this->enqueue_secure_scripts();
    }

    public function enqueue_secure_scripts_login() {
        // Only load on login pages that need password strength meter
        $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : 'login';

        // Actions that use password strength meter
        $password_actions = array(
            'rp',           // Reset password
            'resetpass',    // Reset password (alternative)
            'register',     // User registration (if enabled)
        );

        if (!in_array($action, $password_actions)) {
            return; // Don't load on other login pages
        }

        $this->enqueue_secure_scripts();
    }

    private function enqueue_secure_scripts() {
        // Register our secure zxcvbn-ts replacement
        wp_register_script(
            'zxcvbn-ts-secure',
            TGLC_ZXCVBN_PLUGIN_URL . 'dist/zxcvbn-ts-bundle.min.js',
            array(),
            TGLC_ZXCVBN_VERSION,
            true
        );

        // Register WordPress compatibility layer (must load first)
        wp_register_script(
            'wp-password-strength-compat',
            TGLC_ZXCVBN_PLUGIN_URL . 'dist/wp-password-strength-compat.min.js',
            array('jquery'),
            TGLC_ZXCVBN_VERSION,
            true
        );

        // Register our async loader
        wp_register_script(
            'zxcvbn-async-secure',
            TGLC_ZXCVBN_PLUGIN_URL . 'dist/zxcvbn-async-secure.min.js',
            array('wp-password-strength-compat'),
            TGLC_ZXCVBN_VERSION,
            true
        );

        // Localize the async loader with our secure bundle URL
        wp_localize_script(
            'zxcvbn-async-secure',
            '_zxcvbnSettings',
            array(
                'src' => TGLC_ZXCVBN_PLUGIN_URL . 'dist/zxcvbn-ts-bundle.min.js'
            )
        );

        // Re-register password strength meter with our secure dependency
        wp_register_script(
            'password-strength-meter',
            admin_url('js/password-strength-meter' . (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min') . '.js'),
            array('jquery', 'zxcvbn-async-secure'),
            false,
            true
        );

        // Localize password strength meter
        wp_localize_script(
            'password-strength-meter',
            'pwsL10n',
            array(
                'unknown'  => _x('Password strength unknown', 'password strength'),
                'short'    => _x('Very weak', 'password strength'),
                'bad'      => _x('Weak', 'password strength'),
                'good'     => _x('Medium', 'password strength'),
                'strong'   => _x('Strong', 'password strength'),
                'mismatch' => _x('Mismatch', 'password mismatch'),
            )
        );

        // Enqueue in the correct order:
        // 1. WordPress compatibility layer (ensures wp.passwordStrength.meter exists)
        wp_enqueue_script('wp-password-strength-compat');

        // 2. Async loader (loads zxcvbn-ts bundle)
        wp_enqueue_script('zxcvbn-async-secure');

        // 3. Password strength meter (depends on wp.passwordStrength existing)
        wp_enqueue_script('password-strength-meter');
    }
}

// Initialize the plugin
new TGLC_ZxcvbnFix();
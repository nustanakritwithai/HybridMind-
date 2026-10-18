<?php
/**
 * Plugin Name: Hybrid Mind Affiliate Slots (Candidate)
 * Description: Manually ordered affiliate advertisement slots with optional owner-approved automatic placements. Disabled until private review and owner approval. No remote fetches or tracking.
 * Version: 0.3.0
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * Author: Hybrid Mind
 * License: GPL-2.0-or-later
 * Text Domain: hybridmind-affiliate-slots
 */

if (!defined('ABSPATH')) {
    exit;
}

final class HM_Affiliate_Slots {
    const VERSION = '0.3.0';
    const OPTION = 'hm_affiliate_slots_v1';
    const BACKUP_OPTION = 'hm_affiliate_slots_backup_v1';
    const AUTO_OPTION = 'hm_affiliate_auto_placements_v1';
    const AUTO_BACKUP_OPTION = 'hm_affiliate_auto_placements_backup_v1';
    const CAPABILITY = 'manage_options';
    const NONCE_ACTION = 'hm_affiliate_slots_admin';
    const MAX_UNITS = 2;
    const MAX_CARDS = 3;
    const HOSTS = array('shopee.co.th', 's.shopee.co.th', 'shope.ee');
    const SLOT_IDS = array('home_after_feature', 'home_in_feed', 'article_after_intro', 'article_near_end', 'sidebar_desktop');
    const AUTO_PLACEMENT_IDS = array('home_after_feature', 'article_after_intro', 'article_near_end');
    const REST_NAMESPACE = 'hybridmind-affiliate/v1';
    const IDEMPOTENCY_PREFIX = 'hm_affiliate_idem_';
    const IDEMPOTENCY_PENDING_SECONDS = 300;

    private static $rendered_slots = array();

    public static function boot() {
        add_action('admin_menu', array(__CLASS__, 'admin_menu'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'admin_assets'));
        add_action('wp_enqueue_scripts', array(__CLASS__, 'frontend_assets'));
        add_action('rest_api_init', array(__CLASS__, 'rest_routes'));
        add_shortcode('hm_affiliate_slot', array(__CLASS__, 'shortcode'));
        add_filter('the_content', array(__CLASS__, 'filter_auto_placements'), 8);
        register_activation_hook(__FILE__, array(__CLASS__, 'activate'));
    }

    public static function defaults() {
        $slots = array();
        foreach (self::SLOT_IDS as $id) {
            $slots[$id] = array('enabled' => false, 'item_ids' => array());
        }
        return array('schema_version' => 1, 'demo' => false, 'items' => array(), 'slots' => $slots, 'approval' => null, 'reviewed_digest' => null);
    }

    public static function activate() {
        // Installation must not place blocks, modify content/theme, or enable ads.
        // add_option does not overwrite any pre-existing configuration.
        add_option(self::OPTION, self::defaults(), '', false);
        add_option(self::AUTO_OPTION, self::auto_placement_defaults(), '', false);
    }

    public static function auto_placement_defaults() {
        $placements = array();
        foreach (self::AUTO_PLACEMENT_IDS as $id) {
            $placements[$id] = false;
        }
        return $placements;
    }

    /** Automatic placements are separate, opt-in settings and default off. */
    public static function auto_placements() {
        $defaults = self::auto_placement_defaults();
        $stored = get_option(self::AUTO_OPTION, $defaults);
        if (!is_array($stored) || array_diff(array_keys($stored), self::AUTO_PLACEMENT_IDS)) {
            return $defaults;
        }
        foreach (self::AUTO_PLACEMENT_IDS as $id) {
            if (isset($stored[$id]) && !is_bool($stored[$id])) {
                return $defaults;
            }
            $defaults[$id] = isset($stored[$id]) ? $stored[$id] : false;
        }
        return $defaults;
    }

    public static function placement_digest($placements = null) {
        if ($placements === null) {
            $placements = self::auto_placements();
        }
        return hash('sha256', wp_json_encode($placements, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    private static function has_automatic_placement($placements = null) {
        $placements = $placements === null ? self::auto_placements() : $placements;
        foreach (self::AUTO_PLACEMENT_IDS as $id) {
            if (!empty($placements[$id])) {
                return true;
            }
        }
        return false;
    }

    private static function error($message) {
        return new WP_Error('hm_affiliate_invalid', $message);
    }

    private static function exact_keys($value, $allowed, $required) {
        if (!is_array($value) || array_diff(array_keys($value), $allowed)) {
            return false;
        }
        return !array_diff($required, array_keys($value));
    }

    private static function is_list($value) {
        return is_array($value) && array_values($value) === $value;
    }

    private static function bounded_text($value, $limit, $multiline = false) {
        if (!is_string($value) || preg_match('/[<>\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            return false;
        }
        $clean = $multiline ? sanitize_textarea_field($value) : sanitize_text_field($value);
        $length = function_exists('mb_strlen') ? mb_strlen($clean, 'UTF-8') : strlen($clean);
        return $length <= $limit ? $clean : false;
    }

    /** Validate without normalizing the accepted URL or issuing any request. */
    public static function valid_affiliate_url($url) {
        if (!is_string($url) || strlen($url) > 4096 || $url === '') {
            return false;
        }
        if (preg_match('/[^\x21-\x7E]|[<>"\x27\\\\]/', $url) || preg_match('/%0[ad]|%(?![0-9a-f]{2})/i', $url)) {
            return false;
        }
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        $parts = wp_parse_url($url);
        if (!is_array($parts) || !isset($parts['scheme'], $parts['host']) || strtolower($parts['scheme']) !== 'https') {
            return false;
        }
        if (isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port'] !== 443)) {
            return false;
        }
        if (!in_array(strtolower($parts['host']), self::HOSTS, true)) {
            return false;
        }
        // Reject a URL WordPress would rewrite. Preserve accepted owner bytes.
        return esc_url_raw($url, array('https')) === $url
            && html_entity_decode(esc_url($url, array('https')), ENT_QUOTES | ENT_HTML5, 'UTF-8') === $url;
    }

    private static function valid_date($value) {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
            return false;
        }
        list($year, $month, $day) = array_map('intval', explode('-', $value));
        return checkdate($month, $day, $year);
    }

    /** Returns normalized draft config or WP_Error. Incoming approval is never trusted. */
    public static function validate_config($input) {
        $keys = array('schema_version', 'demo', 'items', 'slots', 'approval', 'reviewed_digest');
        if (!self::exact_keys($input, $keys, array('schema_version', 'demo', 'items', 'slots')) || $input['schema_version'] !== 1 || !is_bool($input['demo'])) {
            return self::error('Configuration requires schema_version 1, boolean demo, items and known slots only.');
        }
        if (!self::is_list($input['items']) || count($input['items']) > 50 || !self::exact_keys($input['slots'], self::SLOT_IDS, self::SLOT_IDS)) {
            return self::error('Items must be a list of at most 50 entries and all five known slots must be present.');
        }
        $config = self::defaults();
        $config['demo'] = $input['demo'];
        $seen = array();
        foreach ($input['items'] as $row) {
            $item_keys = array('id', 'title', 'url', 'description', 'image_id', 'rights_confirmed', 'price', 'price_updated_at', 'order', 'enabled');
            $required = array('id', 'title', 'url', 'description', 'image_id', 'rights_confirmed', 'order');
            if (!self::exact_keys($row, $item_keys, $required) || !is_string($row['id']) || !preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/D', $row['id']) || isset($seen[$row['id']])) {
                return self::error('Each item needs a unique lowercase id and known fields only.');
            }
            $title = self::bounded_text($row['title'], 180);
            $description = self::bounded_text($row['description'], 300, true);
            $price = self::bounded_text(isset($row['price']) ? $row['price'] : '', 40);
            $date = isset($row['price_updated_at']) ? $row['price_updated_at'] : '';
            if ($title === false || $title === '' || $description === false || $price === false || !is_string($row['url']) || ($row['url'] !== '' && !self::valid_affiliate_url($row['url']))) {
                return self::error('Item '.$row['id'].': title/description/price must be bounded plain text. URL may be empty in Draft; otherwise it must be an unchanged allowed HTTPS Shopee URL.');
            }
            if (!is_string($date) || ($price !== '' && !self::valid_date($date)) || ($price === '' && $date !== '' && !self::valid_date($date))) {
                return self::error('Item '.$row['id'].': price requires a valid YYYY-MM-DD owner update date.');
            }
            if (!is_int($row['image_id']) || $row['image_id'] < 0 || !is_bool($row['rights_confirmed']) || !is_int($row['order']) || $row['order'] < 0 || $row['order'] > 9999 || (isset($row['enabled']) && !is_bool($row['enabled']))) {
                return self::error('Item '.$row['id'].': image_id/order need bounded integers; rights_confirmed/enabled need booleans.');
            }
            if ($row['image_id'] > 0 && !self::allowed_attachment($row['image_id'])) {
                return self::error('Item '.$row['id'].': image_id must be a local Media Library JPEG, PNG, GIF or WebP image.');
            }
            $config['items'][] = array('id' => $row['id'], 'title' => $title, 'url' => $row['url'], 'description' => $description, 'image_id' => $row['image_id'], 'rights_confirmed' => $row['rights_confirmed'], 'price' => $price, 'price_updated_at' => $date, 'order' => $row['order'], 'enabled' => isset($row['enabled']) ? $row['enabled'] : true);
            $seen[$row['id']] = true;
        }
        foreach (self::SLOT_IDS as $id) {
            $slot = $input['slots'][$id];
            if (!self::exact_keys($slot, array('enabled', 'item_ids'), array('enabled', 'item_ids')) || !is_bool($slot['enabled']) || !self::is_list($slot['item_ids']) || count($slot['item_ids']) > 50) {
                return self::error('Slot '.$id.': enabled must be boolean and item_ids a bounded list.');
            }
            $slot_seen = array();
            foreach ($slot['item_ids'] as $item_id) {
                if (!is_string($item_id) || !isset($seen[$item_id]) || isset($slot_seen[$item_id])) {
                    return self::error('Slot '.$id.': item_ids must reference existing unique items.');
                }
                $slot_seen[$item_id] = true;
            }
            $config['slots'][$id] = array('enabled' => $slot['enabled'], 'item_ids' => $slot['item_ids']);
        }
        return $config;
    }

    private static function allowed_attachment($id) {
        return wp_attachment_is_image($id) && in_array(get_post_mime_type($id), array('image/jpeg', 'image/png', 'image/gif', 'image/webp'), true);
    }

    public static function digest($config) {
        $payload = $config;
        unset($payload['approval'], $payload['reviewed_digest']);
        return hash('sha256', wp_json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    public static function get_config() {
        $stored = get_option(self::OPTION, self::defaults());
        $checked = self::validate_config($stored);
        if (is_wp_error($checked)) {
            return self::defaults();
        }
        if (isset($stored['reviewed_digest']) && is_string($stored['reviewed_digest']) && preg_match('/^[a-f0-9]{64}$/D', $stored['reviewed_digest'])) {
            $checked['reviewed_digest'] = $stored['reviewed_digest'];
        }
        if (isset($stored['approval']) && is_array($stored['approval']) && self::exact_keys($stored['approval'], array('digest', 'user_id', 'approved_at', 'domains_confirmed', 'placement_digest'), array('digest', 'user_id', 'approved_at', 'domains_confirmed')) && is_string($stored['approval']['digest']) && preg_match('/^[a-f0-9]{64}$/D', $stored['approval']['digest']) && is_int($stored['approval']['user_id']) && $stored['approval']['user_id'] > 0 && is_string($stored['approval']['approved_at']) && $stored['approval']['domains_confirmed'] === true && (!array_key_exists('placement_digest', $stored['approval']) || (is_string($stored['approval']['placement_digest']) && preg_match('/^[a-f0-9]{64}$/D', $stored['approval']['placement_digest'])))) {
            $checked['approval'] = $stored['approval'];
        }
        return $checked;
    }

    private static function slot_items($config, $id, $live = false) {
        if (!isset($config['slots'][$id]) || !$config['slots'][$id]['enabled']) {
            return array();
        }
        $selected = array_flip($config['slots'][$id]['item_ids']);
        $items = array();
        foreach ($config['items'] as $sequence => $item) {
            if (!isset($selected[$item['id']]) || !$item['enabled'] || !self::valid_affiliate_url($item['url'])) {
                continue;
            }
            if ($live && (!$item['rights_confirmed'] || $item['image_id'] < 1 || !self::allowed_attachment($item['image_id']))) {
                continue;
            }
            $item['_sequence'] = $sequence;
            $items[] = $item;
        }
        usort($items, function ($a, $b) {
            return $a['order'] === $b['order'] ? $a['_sequence'] <=> $b['_sequence'] : $a['order'] <=> $b['order'];
        });
        return array_slice($items, 0, self::MAX_CARDS);
    }

    private static function approval_problem($config) {
        if ($config['demo']) {
            return 'Demo configuration cannot be enabled publicly.';
        }
        $active = false;
        foreach (self::SLOT_IDS as $id) {
            foreach (self::slot_items($config, $id) as $item) {
                $active = true;
                if (!$item['rights_confirmed'] || $item['image_id'] < 1 || !self::allowed_attachment($item['image_id'])) {
                    return 'Every displayed item needs a valid local image and owner-confirmed usage rights.';
                }
            }
        }
        return $active ? '' : 'At least one enabled slot needs an enabled item before approval.';
    }

    public static function live_ready($config) {
        if ($config['demo'] || !is_array($config['approval']) || !isset($config['approval']['digest'], $config['approval']['domains_confirmed']) || $config['approval']['domains_confirmed'] !== true || !hash_equals(self::digest($config), $config['approval']['digest'])) {
            return false;
        }
        $placements = self::auto_placements();
        if (isset($config['approval']['placement_digest'])) {
            if (!hash_equals(self::placement_digest($placements), $config['approval']['placement_digest'])) {
                return false;
            }
        } elseif (self::has_automatic_placement($placements)) {
            // Legacy approval metadata remains valid only while automatic placements stay off.
            return false;
        }
        return self::approval_problem($config) === '';
    }

    public static function context_allows_slot($id) {
        if (!in_array($id, self::SLOT_IDS, true) || is_feed() || is_preview()) {
            return false;
        }
        if (is_front_page()) {
            return in_array($id, array('home_after_feature', 'home_in_feed'), true);
        }
        if (!is_singular('post') || in_array((int) get_queried_object_id(), array(55, 57), true)) {
            return false;
        }
        $post = get_post(get_queried_object_id());
        $content = $post && isset($post->post_content) ? $post->post_content : '';
        // v0.1 fails closed for the entire post if interactive/protected markers occur.
        if (preg_match('/<\s*(?:iframe|pre|code)\b|<!--\s*wp:(?:core\/)?(?:code|preformatted|embed)\b|<!--\s*wp:(?:[a-z0-9_-]+\/)?[a-z0-9_-]*(?:quiz|game|video[-_]agent[-_]lab)[a-z0-9_-]*\b|\[[a-z0-9_-]*(?:quiz|game)[a-z0-9_-]*\b|\[hm_video_agent_lab\b|(?:class|id)\s*=\s*["\x27][^"\x27]*(?:quiz|game[-_]lab|hm[-_]game|hm[-_]video[-_]agent[-_]lab)/i', $content)) {
            return false;
        }
        return in_array($id, array('article_after_intro', 'article_near_end', 'sidebar_desktop'), true);
    }

    /** Only alter the main, published, public content query. */
    private static function automatic_content_context() {
        if (is_admin() || is_feed() || is_preview() || !in_the_loop() || !is_main_query() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return false;
        }
        if (function_exists('wp_is_json_request') && wp_is_json_request()) {
            return false;
        }
        global $post;
        if (!is_object($post) || !isset($post->ID, $post->post_status) || $post->post_status !== 'publish' || !empty($post->post_password) || post_password_required($post)) {
            return false;
        }
        if (is_front_page()) {
            return true;
        }
        return is_singular('post') && (int) $post->ID === (int) get_queried_object_id();
    }

    private static function has_explicit_affiliate_shortcode($content) {
        if (function_exists('has_shortcode') && has_shortcode($content, 'hm_affiliate_slot')) {
            return true;
        }
        return preg_match('/\[\s*hm_affiliate_slot\b/i', $content) === 1;
    }

    private static function shortcode_block($id) {
        $shortcode = '[hm_affiliate_slot id="'.$id.'"]';
        return array(
            'blockName' => 'core/shortcode',
            'attrs' => array(),
            'innerBlocks' => array(),
            'innerHTML' => $shortcode,
            'innerContent' => array($shortcode),
        );
    }

    /**
     * Inject only at proven block boundaries. Install/update never changes stored page content.
     * An existing explicit shortcode suppresses all automatic placements on that page.
     */
    public static function filter_auto_placements($content) {
        if (!is_string($content) || $content === '' || !self::automatic_content_context()) {
            return $content;
        }
        $placements = self::auto_placements();
        if (!self::has_automatic_placement($placements) || self::has_explicit_affiliate_shortcode($content)) {
            return $content;
        }
        $config = self::get_config();
        if (!self::live_ready($config) || !function_exists('parse_blocks') || !function_exists('serialize_blocks')) {
            return $content;
        }
        $blocks = parse_blocks($content);
        if (!is_array($blocks) || !$blocks) {
            return $content;
        }
        if (is_front_page()) {
            if (!$placements['home_after_feature'] || !self::context_allows_slot('home_after_feature') || !self::slot_items($config, 'home_after_feature', true)) {
                return $content;
            }
            $with_home_slot = self::insert_home_hero_slot($blocks);
            return $with_home_slot === null ? $content : serialize_blocks($with_home_slot);
        }
        if (!is_singular('post')) {
            return $content;
        }
        return self::insert_article_slots($blocks, $content, $placements, $config);
    }

    /**
     * Split exactly one single-string Custom HTML block at the saved homepage's hero boundary.
     * The Featured hero must be the only section before the exact #latest opening.
     */
    private static function insert_home_hero_slot($blocks) {
        $candidate = null;
        $candidate_index = null;
        foreach ($blocks as $index => $block) {
            if (!is_array($block) || !isset($block['blockName'], $block['innerHTML']) || $block['blockName'] !== 'core/html' || !is_string($block['innerHTML'])) {
                continue;
            }
            $html = $block['innerHTML'];
            if (strpos($html, '<section class="hero container"') === false) {
                continue;
            }
            if ($candidate !== null || !empty($block['innerBlocks']) || !isset($block['innerContent']) || $block['innerContent'] !== array($html)) {
                return null;
            }
            $hero = strpos($html, '<section class="hero container"');
            $close = strpos($html, '</section>', $hero);
            $after_close = $close === false ? false : $close + strlen('</section>');
            if ($close === false || substr_count($html, '<section class="hero container"') !== 1 || substr_count($html, '<section class="section container" id="latest"') !== 1 || preg_match('/\A\s*<section class="section container" id="latest"(?:\s|>)/', substr($html, $after_close)) !== 1) {
                return null;
            }
            $hero_markup = substr($html, $hero, $after_close - $hero);
            if (preg_match_all('/<section\b/i', $hero_markup) !== 1 || preg_match_all('/<\/section\b/i', $hero_markup) !== 1) {
                return null;
            }
            $candidate = array($block, $html, $after_close);
            $candidate_index = $index;
        }
        if ($candidate === null) {
            return null;
        }
        list($block, $html, $split_at) = $candidate;
        $before = substr($html, 0, $split_at);
        $after = substr($html, $split_at);
        if ($before === '' || $after === '') {
            return null;
        }
        $before_block = $block;
        $before_block['innerHTML'] = $before;
        $before_block['innerContent'] = array($before);
        $after_block = $block;
        $after_block['innerHTML'] = $after;
        $after_block['innerContent'] = array($after);
        array_splice($blocks, $candidate_index, 1, array($before_block, self::shortcode_block('home_after_feature'), $after_block));
        return $blocks;
    }

    private static function article_paragraph_text($block) {
        if (!is_array($block) || !isset($block['blockName'], $block['innerHTML']) || $block['blockName'] !== 'core/paragraph' || !empty($block['innerBlocks']) || !is_string($block['innerHTML'])) {
            return '';
        }
        $text = html_entity_decode(strip_tags($block['innerHTML']), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim(preg_replace('/\s+/u', ' ', $text));
    }

    private static function article_paragraph_word_count($block) {
        $text = self::article_paragraph_text($block);
        $count = preg_match_all('/[\p{L}\p{N}]+/u', $text, $matches);
        return $count === false ? 0 : $count;
    }

    private static function insert_article_slots($blocks, $original_content, $placements, $config) {
        // Keep existing protected-content exclusions and fail closed for blocks such as embeds, code and interactive experiences.
        if (!self::context_allows_slot('article_after_intro')) {
            return $original_content;
        }
        $paragraphs = array();
        $word_count = 0;
        foreach ($blocks as $index => $block) {
            $text = self::article_paragraph_text($block);
            if ($text === '') {
                continue;
            }
            $paragraphs[] = $index;
            $count = preg_match_all('/[\p{L}\p{N}]+/u', $text, $matches);
            if ($count !== false) {
                $word_count += $count;
            }
        }
        $insert_after = array();
        if ($placements['article_after_intro'] && count($paragraphs) >= 4 && self::slot_items($config, 'article_after_intro', true)) {
            $candidate = $paragraphs[2];
            if (self::article_paragraph_word_count($blocks[$candidate]) >= 20 && isset($blocks[$candidate + 1]) && self::article_paragraph_text($blocks[$candidate + 1]) !== '') {
                $insert_after[$candidate] = 'article_after_intro';
            }
        }
        if ($placements['article_near_end'] && count($paragraphs) >= 8 && $word_count >= 600 && self::slot_items($config, 'article_near_end', true)) {
            $candidate = $paragraphs[count($paragraphs) - 2];
            if (self::article_paragraph_word_count($blocks[$candidate]) >= 20 && isset($blocks[$candidate + 1]) && self::article_paragraph_text($blocks[$candidate + 1]) !== '') {
                $insert_after[$candidate] = 'article_near_end';
            }
        }
        if (!$insert_after) {
            return $original_content;
        }
        krsort($insert_after, SORT_NUMERIC);
        foreach ($insert_after as $index => $id) {
            array_splice($blocks, $index + 1, 0, array(self::shortcode_block($id)));
        }
        return serialize_blocks($blocks);
    }

    private static function has_context_slot() {
        foreach (self::SLOT_IDS as $id) {
            if (self::context_allows_slot($id)) {
                return true;
            }
        }
        return false;
    }

    public static function frontend_assets() {
        if (self::live_ready(self::get_config()) && self::has_context_slot()) {
            wp_enqueue_style('hm-affiliate-slots', plugins_url('assets/slots.css', __FILE__), array(), self::VERSION);
            wp_enqueue_script('hm-affiliate-slots', plugins_url('assets/slots.js', __FILE__), array(), self::VERSION, true);
        }
    }

    public static function admin_assets($hook) {
        if ($hook === 'settings_page_hm-affiliate-slots' && current_user_can(self::CAPABILITY)) {
            wp_enqueue_style('hm-affiliate-slots', plugins_url('assets/slots.css', __FILE__), array(), self::VERSION);
            wp_enqueue_script('hm-affiliate-slots', plugins_url('assets/slots.js', __FILE__), array(), self::VERSION, true);
        }
    }

    public static function shortcode($attributes) {
        $attributes = shortcode_atts(array('id' => ''), $attributes, 'hm_affiliate_slot');
        $id = is_string($attributes['id']) ? $attributes['id'] : '';
        $config = self::get_config();
        if (!self::context_allows_slot($id) || !self::live_ready($config) || isset(self::$rendered_slots[$id]) || count(self::$rendered_slots) >= self::MAX_UNITS) {
            return '';
        }
        $items = self::slot_items($config, $id, true);
        if (!$items) {
            return '';
        }
        $markup = self::render_markup($id, $items);
        if ($markup !== '') {
            self::$rendered_slots[$id] = true;
        }
        return $markup;
    }

    private static function render_markup($id, $items, $preview_label = '', $inert_demo = false) {
        if (!$items) {
            return '';
        }
        $html = '<aside class="hm-aff-unit hm-aff-slot-'.esc_attr($id).'" data-hm-aff-rendered-slot="'.esc_attr($id).'" aria-label="โฆษณา / Affiliate">';
        if ($preview_label !== '') {
            $html .= '<p class="hm-aff-preview-label">'.esc_html($preview_label).'</p>';
        }
        $html .= '<p class="hm-aff-label">โฆษณา / Affiliate</p><p class="hm-aff-disclosure">เว็บไซต์อาจได้รับค่าคอมมิชชันหากคุณซื้อสินค้าผ่านลิงก์ Affiliate นี้</p><div class="hm-aff-grid">';
        foreach ($items as $item) {
            $html .= '<article class="hm-aff-card" data-hm-aff-item="'.esc_attr($item['id']).'"><div class="hm-aff-media">';
            $image = $item['image_id'] > 0 ? wp_get_attachment_image_src($item['image_id'], 'medium') : false;
            if (is_array($image) && !empty($image[0])) {
                $html .= '<img class="hm-aff-image" data-hm-aff-image src="'.esc_url($image[0], array('https')).'" width="'.(int) $image[1].'" height="'.(int) $image[2].'" alt="'.esc_attr($item['title']).'" decoding="async"><span class="hm-aff-image-fallback" hidden>ยังไม่มีภาพสินค้า — รอตรวจสอบก่อนเผยแพร่</span>';
            } else {
                $html .= '<span class="hm-aff-image-fallback">ยังไม่มีภาพสินค้า — รอตรวจสอบก่อนเผยแพร่</span>';
            }
            $html .= '</div><div class="hm-aff-content"><h3 class="hm-aff-title">'.esc_html($item['title']).'</h3>';
            if ($item['description'] !== '') {
                $html .= '<p class="hm-aff-description">'.esc_html($item['description']).'</p>';
            }
            if ($inert_demo) {
                $html .= '<button class="hm-aff-cta" type="button" disabled>DEMO — ไม่มีลิงก์ออกไป</button><span class="hm-aff-preview-url">'.esc_html($item['url']).'</span>';
            } else {
                $html .= '<a class="hm-aff-cta" href="'.esc_url($item['url'], array('https')).'" target="_blank" rel="sponsored noopener">ดูสินค้าบน Shopee<span class="screen-reader-text"> (เปิดแท็บใหม่)</span></a>';
            }
            $html .= '</div></article>';
        }
        return $html.'</div></aside>';
    }
    public static function rest_routes() {
        $permission = array(__CLASS__, 'rest_permission');
        register_rest_route(self::REST_NAMESPACE, '/config', array('methods' => 'GET', 'callback' => array(__CLASS__, 'rest_config'), 'permission_callback' => $permission));
        register_rest_route(self::REST_NAMESPACE, '/products', array(
            array('methods' => 'GET', 'callback' => array(__CLASS__, 'rest_products_list'), 'permission_callback' => $permission),
            array('methods' => 'POST', 'callback' => array(__CLASS__, 'rest_products_create'), 'permission_callback' => $permission),
        ));
        register_rest_route(self::REST_NAMESPACE, '/products/(?P<id>[a-z0-9][a-z0-9_-]{0,63})', array(
            array('methods' => 'GET', 'callback' => array(__CLASS__, 'rest_products_get'), 'permission_callback' => $permission),
            array('methods' => 'PATCH', 'callback' => array(__CLASS__, 'rest_products_update'), 'permission_callback' => $permission),
        ));
    }

    public static function rest_permission($request = null) {
        if (!is_user_logged_in()) {
            return new WP_Error('hm_affiliate_unauthorized', 'Authentication is required.', array('status' => 401));
        }
        if (!current_user_can(self::CAPABILITY)) {
            return new WP_Error('hm_affiliate_forbidden', 'Administrator access is required.', array('status' => 403));
        }
        return true;
    }

    public static function rest_config() {
        $permission = self::rest_permission();
        if (is_wp_error($permission)) {
            return $permission;
        }
        $config = self::get_config();
        $response = new WP_REST_Response(array('config' => $config, 'digest' => self::digest($config), 'live_ready' => self::live_ready($config)), 200);
        $response->header('Cache-Control', 'private, no-store');
        $response->header('ETag', '"'.self::digest($config).'"');
        $response->header('X-HM-Affiliate-Revision', self::digest($config));
        return $response;
    }

    private static function rest_error($code, $message, $status) {
        return new WP_Error($code, $message, array('status' => $status));
    }

    private static function rest_response($data, $status, $revision) {
        $response = new WP_REST_Response($data, $status);
        $response->header('Cache-Control', 'private, no-store');
        $response->header('ETag', '"'.$revision.'"');
        $response->header('X-HM-Affiliate-Revision', $revision);
        return $response;
    }

    private static function request_json($request) {
        $body = $request->get_json_params();
        if (!is_array($body)) {
            return self::rest_error('hm_affiliate_invalid_json', 'Send a JSON object as the request body.', 400);
        }
        $encoded = wp_json_encode($body);
        if (!is_string($encoded) || strlen($encoded) > 8192) {
            return self::rest_error('hm_affiliate_payload_too_large', 'Product request must be at most 8 KB.', 413);
        }
        return $body;
    }

    private static function valid_product_id($id) {
        return is_string($id) && preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/D', $id) === 1;
    }

    private static function valid_https_image_url($url) {
        if (!is_string($url) || strlen($url) > 2048 || preg_match('/[^\x21-\x7E]|[<>"\x27\\\\]/', $url) || preg_match('/%0[ad]|%(?![0-9a-f]{2})/i', $url)) {
            return false;
        }
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        $parts = wp_parse_url($url);
        if (!is_array($parts) || !isset($parts['scheme'], $parts['host']) || strtolower($parts['scheme']) !== 'https') {
            return false;
        }
        if (isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port'] !== 443)) {
            return false;
        }
        return esc_url_raw($url, array('https')) === $url;
    }

    /** API image URLs must resolve to an existing local Media Library attachment. */
    private static function resolve_api_image($image) {
        if ($image === null) {
            return 0;
        }
        if (!is_array($image) || count($image) !== 1 || !self::exact_keys($image, array('attachment_id', 'url'), array_keys($image))) {
            return self::rest_error('hm_affiliate_invalid_image', 'Image must be null or contain exactly one attachment_id or local media URL.', 422);
        }
        if (array_key_exists('attachment_id', $image)) {
            $id = $image['attachment_id'];
            if (!is_int($id) || $id < 1 || !self::allowed_attachment($id)) {
                return self::rest_error('hm_affiliate_invalid_image', 'attachment_id must identify a local JPEG, PNG, GIF or WebP Media Library image.', 422);
            }
            return $id;
        }
        $url = $image['url'];
        if (!self::valid_https_image_url($url)) {
            return self::rest_error('hm_affiliate_invalid_image', 'Image URL must be an unchanged HTTPS URL for a local Media Library image.', 422);
        }
        $id = attachment_url_to_postid($url);
        if (!$id || !self::allowed_attachment((int) $id)) {
            return self::rest_error('hm_affiliate_invalid_image', 'Image URL must resolve to an existing local Media Library image.', 422);
        }
        $canonical = wp_get_attachment_url((int) $id);
        if (!self::valid_https_image_url($canonical) || $canonical !== $url) {
            return self::rest_error('hm_affiliate_invalid_image', 'Image URL must exactly match the HTTPS URL of its local attachment.', 422);
        }
        return (int) $id;
    }

    /** Converts strict API JSON to the existing schema without allowing activation fields. */
    private static function normalize_product_request($body, $creating) {
        $allowed = array('title', 'url', 'description', 'image', 'order');
        $required = $creating ? array('title', 'url', 'description') : array();
        if ($creating) {
            array_unshift($allowed, 'id');
            array_unshift($required, 'id');
        }
        if (!self::exact_keys($body, $allowed, $required) || (!$creating && !$body)) {
            return self::rest_error('hm_affiliate_invalid_product', 'Product JSON contains missing or unsupported fields.', 422);
        }
        if ($creating && !self::valid_product_id($body['id'])) {
            return self::rest_error('hm_affiliate_invalid_product_id', 'id must be a stable lowercase identifier of up to 64 characters.', 422);
        }
        $result = array();
        if ($creating) {
            $result['id'] = $body['id'];
        }
        foreach (array('title' => 180, 'description' => 300) as $field => $limit) {
            if (array_key_exists($field, $body)) {
                $value = self::bounded_text($body[$field], $limit, $field === 'description');
                if ($value === false || ($field === 'title' && $value === '')) {
                    return self::rest_error('hm_affiliate_invalid_product', $field.' must be bounded plain text.', 422);
                }
                $result[$field] = $value;
            }
        }
        if (array_key_exists('url', $body)) {
            if (!is_string($body['url']) || !self::valid_affiliate_url($body['url'])) {
                return self::rest_error('hm_affiliate_invalid_url', 'url must be an unchanged HTTPS Shopee link on a supported host.', 422);
            }
            $result['url'] = $body['url'];
        }
        if (array_key_exists('image', $body)) {
            $image_id = self::resolve_api_image($body['image']);
            if (is_wp_error($image_id)) {
                return $image_id;
            }
            $result['image_id'] = $image_id;
        }
        if (array_key_exists('order', $body)) {
            if (!is_int($body['order']) || $body['order'] < 0 || $body['order'] > 9999) {
                return self::rest_error('hm_affiliate_invalid_product', 'order must be an integer from 0 through 9999.', 422);
            }
            $result['order'] = $body['order'];
        } elseif ($creating) {
            $result['order'] = 0;
        }
        return $result;
    }

    private static function product_index($config, $id) {
        foreach ($config['items'] as $index => $item) {
            if ($item['id'] === $id) {
                return $index;
            }
        }
        return null;
    }

    private static function product_view($item, $config) {
        $image_url = null;
        if ($item['image_id'] > 0 && self::allowed_attachment($item['image_id'])) {
            $candidate = wp_get_attachment_url($item['image_id']);
            if (self::valid_https_image_url($candidate)) {
                $image_url = $candidate;
            }
        }
        $placements = array();
        foreach (self::SLOT_IDS as $slot_id) {
            if ($config['slots'][$slot_id]['enabled'] && in_array($item['id'], $config['slots'][$slot_id]['item_ids'], true)) {
                $placements[] = $slot_id;
            }
        }
        $public = $item['enabled'] && $placements && self::valid_affiliate_url($item['url']) && $item['rights_confirmed'] && $item['image_id'] > 0 && self::allowed_attachment($item['image_id']) && self::live_ready($config);
        return array(
            'id' => $item['id'],
            'title' => $item['title'],
            'description' => $item['description'],
            'url' => $item['url'],
            'image' => array('attachment_id' => $item['image_id'] > 0 ? $item['image_id'] : null, 'url' => $image_url),
            'order' => $item['order'],
            'enabled' => $item['enabled'],
            'rights_confirmed' => $item['rights_confirmed'],
            'placements' => $placements,
            'status' => $public ? 'approved' : 'draft',
        );
    }

    private static function api_product_payload_hash($product) {
        $canonical = array(
            'id' => $product['id'],
            'title' => $product['title'],
            'url' => $product['url'],
            'description' => $product['description'],
            'image_id' => isset($product['image_id']) ? $product['image_id'] : 0,
            'order' => isset($product['order']) ? $product['order'] : 0,
        );
        return hash('sha256', wp_json_encode($canonical, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    private static function expected_revision($request) {
        $header = $request->get_header('if-match');
        if (!is_string($header) || $header === '') {
            return self::rest_error('hm_affiliate_precondition_required', 'Send the latest revision in the If-Match header.', 428);
        }
        $revision = trim($header);
        if (strlen($revision) >= 2 && $revision[0] === '"' && substr($revision, -1) === '"') {
            $revision = substr($revision, 1, -1);
        }
        if (!preg_match('/^[a-f0-9]{64}$/D', $revision)) {
            return self::rest_error('hm_affiliate_invalid_precondition', 'If-Match must contain one SHA-256 revision from the latest readback.', 400);
        }
        return $revision;
    }

    private static function persist_draft_config($expected_stored, $before, $next) {
        $backup = $expected_stored === null ? $before : $expected_stored;
        update_option(self::BACKUP_OPTION, $backup, false);
        if (get_option(self::BACKUP_OPTION, null) !== $backup) {
            return self::rest_error('hm_affiliate_backup_failed', 'Previous configuration could not be backed up; the draft was not saved.', 500);
        }
        $write = self::write_config($expected_stored, $next);
        if (is_wp_error($write)) {
            return $write;
        }
        if (get_option(self::OPTION, null) !== $next) {
            return self::rest_error('hm_affiliate_readback_failed', 'Draft readback did not match the saved revision.', 500);
        }
        return true;
    }

    private static function rest_current_config() {
        $stored = get_option(self::OPTION, null);
        if ($stored === null) {
            return self::defaults();
        }
        $checked = self::validate_config($stored);
        if (is_wp_error($checked)) {
            return self::rest_error('hm_affiliate_stored_config_invalid', 'The stored configuration is invalid; no product write was attempted.', 409);
        }
        return self::get_config();
    }

    public static function rest_products_list($request) {
        $permission = self::rest_permission($request);
        if (is_wp_error($permission)) {
            return $permission;
        }
        $config = self::get_config();
        $items = array();
        foreach ($config['items'] as $item) {
            $items[] = self::product_view($item, $config);
        }
        $revision = self::digest($config);
        return self::rest_response(array('items' => $items, 'revision' => $revision, 'live_ready' => self::live_ready($config)), 200, $revision);
    }

    public static function rest_products_get($request) {
        $permission = self::rest_permission($request);
        if (is_wp_error($permission)) {
            return $permission;
        }
        $id = $request->get_param('id');
        if (!self::valid_product_id($id)) {
            return self::rest_error('hm_affiliate_invalid_product_id', 'id must be a stable lowercase identifier.', 400);
        }
        $config = self::get_config();
        $index = self::product_index($config, $id);
        if ($index === null) {
            return self::rest_error('hm_affiliate_product_not_found', 'Product was not found.', 404);
        }
        $revision = self::digest($config);
        return self::rest_response(array('product' => self::product_view($config['items'][$index], $config), 'revision' => $revision), 200, $revision);
    }

    private static function idempotency_option_name($key) {
        return self::IDEMPOTENCY_PREFIX.hash('sha256', $key);
    }

    private static function valid_idempotency_key($key) {
        return is_string($key) && strlen($key) >= 16 && strlen($key) <= 128 && preg_match('/^[A-Za-z0-9._:-]+$/D', $key) === 1;
    }

    private static function valid_idempotency_record($record) {
        if (!is_array($record) || !isset($record['state'], $record['payload_hash'], $record['product_id'], $record['created_at'])) {
            return false;
        }
        if (!is_string($record['payload_hash']) || !preg_match('/^[a-f0-9]{64}$/D', $record['payload_hash']) || !self::valid_product_id($record['product_id']) || !is_int($record['created_at'])) {
            return false;
        }
        if ($record['state'] === 'pending') {
            return isset($record['lock_token']) && is_string($record['lock_token']) && preg_match('/^[a-f0-9]{32}$/D', $record['lock_token']) && self::exact_keys($record, array('state', 'payload_hash', 'product_id', 'created_at', 'lock_token'), array('state', 'payload_hash', 'product_id', 'created_at', 'lock_token'));
        }
        return $record['state'] === 'complete' && self::exact_keys($record, array('state', 'payload_hash', 'product_id', 'created_at'), array('state', 'payload_hash', 'product_id', 'created_at'));
    }

    private static function new_idempotency_lock($payload_hash, $product_id) {
        return array(
            'state' => 'pending',
            'payload_hash' => $payload_hash,
            'product_id' => $product_id,
            'created_at' => time(),
            'lock_token' => bin2hex(random_bytes(16)),
        );
    }

    /** Compare-and-swap one plugin-owned option using exact serialized bytes. */
    private static function compare_and_swap_option($option_name, $expected, $next) {
        global $wpdb;
        $written = $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND BINARY option_value = %s",
            maybe_serialize($next),
            $option_name,
            maybe_serialize($expected)
        ));
        wp_cache_delete($option_name, 'options');
        wp_cache_delete('notoptions', 'options');
        return $written === 1 && get_option($option_name, null) === $next;
    }

    private static function release_idempotency_lock($option_name, $lock) {
        global $wpdb;
        $deleted = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name = %s AND BINARY option_value = %s",
            $option_name,
            maybe_serialize($lock)
        ));
        wp_cache_delete($option_name, 'options');
        wp_cache_delete('notoptions', 'options');
        return $deleted === 1 && get_option($option_name, null) === null;
    }

    private static function complete_idempotency($option_name, $lock) {
        $complete = array(
            'state' => 'complete',
            'payload_hash' => $lock['payload_hash'],
            'product_id' => $lock['product_id'],
            'created_at' => $lock['created_at'],
        );
        if (self::compare_and_swap_option($option_name, $lock, $complete)) {
            return true;
        }
        return get_option($option_name, null) === $complete;
    }

    private static function replay_create($record, $request_hash) {
        if (!self::valid_idempotency_record($record) || !hash_equals($record['payload_hash'], $request_hash)) {
            return self::rest_error('hm_affiliate_idempotency_conflict', 'Idempotency-Key was already used with a different product request.', 409);
        }
        if ($record['state'] !== 'complete') {
            return self::rest_error('hm_affiliate_create_in_progress', 'A matching create request is still in progress; retry with the same key after it completes.', 409);
        }
        $config = self::get_config();
        $index = self::product_index($config, $record['product_id']);
        if ($index === null) {
            return self::rest_error('hm_affiliate_idempotency_orphaned', 'The completed idempotency record has no matching product; inspect the latest configuration before retrying.', 409);
        }
        $revision = self::digest($config);
        $product = self::product_view($config['items'][$index], $config);
        $public_output = $product['status'] === 'approved';
        return self::rest_response(array(
            'product' => $product,
            'revision' => $revision,
            'replayed' => true,
            'draft' => !$public_output,
            'public_output' => $public_output,
        ), 200, $revision);
    }

    public static function rest_products_create($request) {
        $permission = self::rest_permission($request);
        if (is_wp_error($permission)) {
            return $permission;
        }
        $body = self::request_json($request);
        if (is_wp_error($body)) {
            return $body;
        }
        $product = self::normalize_product_request($body, true);
        if (is_wp_error($product)) {
            return $product;
        }
        $key = $request->get_header('idempotency-key');
        if (!self::valid_idempotency_key($key)) {
            return self::rest_error('hm_affiliate_idempotency_required', 'Send a unique Idempotency-Key with at least 16 safe ASCII characters.', 400);
        }
        $request_hash = self::api_product_payload_hash($product);
        $option_name = self::idempotency_option_name($key);
        $record = get_option($option_name, null);
        if ($record !== null) {
            if (!self::valid_idempotency_record($record) || !hash_equals($record['payload_hash'], $request_hash) || $record['product_id'] !== $product['id']) {
                return self::rest_error('hm_affiliate_idempotency_conflict', 'Idempotency-Key was already used with a different product request.', 409);
            }
            if ($record['state'] === 'complete') {
                return self::replay_create($record, $request_hash);
            }
            $current = self::get_config();
            $current_index = self::product_index($current, $product['id']);
            if ($current_index !== null) {
                if (self::api_product_payload_hash($current['items'][$current_index]) !== $request_hash) {
                    return self::rest_error('hm_affiliate_idempotency_conflict', 'A product with this ID no longer matches the pending create request.', 409);
                }
                if (!self::complete_idempotency($option_name, $record)) {
                    return self::rest_error('hm_affiliate_idempotency_readback_failed', 'The product exists, but its idempotency receipt could not be completed; retry the same key.', 500);
                }
                return self::replay_create(get_option($option_name, null), $request_hash);
            }
            if (time() - $record['created_at'] < self::IDEMPOTENCY_PENDING_SECONDS) {
                return self::rest_error('hm_affiliate_create_in_progress', 'A matching create request is still in progress; retry with the same key after it completes.', 409);
            }
            $lock = self::new_idempotency_lock($request_hash, $product['id']);
            if (!self::compare_and_swap_option($option_name, $record, $lock)) {
                return self::rest_error('hm_affiliate_create_in_progress', 'Another request is recovering this idempotency key; retry with the same key.', 409);
            }
        } else {
            $before = self::rest_current_config();
            if (is_wp_error($before)) {
                return $before;
            }
            if (self::product_index($before, $product['id']) !== null) {
                return self::rest_error('hm_affiliate_product_exists', 'A product with this stable ID already exists.', 409);
            }
            if (count($before['items']) >= 50) {
                return self::rest_error('hm_affiliate_product_limit', 'The existing configuration already contains the maximum of 50 products.', 409);
            }
            $lock = self::new_idempotency_lock($request_hash, $product['id']);
            if (!add_option($option_name, $lock, '', false)) {
                $existing = get_option($option_name, null);
                if ($existing !== null) {
                    return self::replay_create($existing, $request_hash);
                }
                return self::rest_error('hm_affiliate_idempotency_unavailable', 'The idempotency key could not be reserved; no product was saved.', 500);
            }
            if (get_option($option_name, null) !== $lock) {
                return self::rest_error('hm_affiliate_idempotency_readback_failed', 'The idempotency reservation could not be verified; no product was saved.', 500);
            }
        }

        $expected_stored = get_option(self::OPTION, null);
        $before = self::rest_current_config();
        if (is_wp_error($before)) {
            self::release_idempotency_lock($option_name, $lock);
            return $before;
        }
        if (self::product_index($before, $product['id']) !== null) {
            self::release_idempotency_lock($option_name, $lock);
            return self::rest_error('hm_affiliate_product_exists', 'A product with this stable ID already exists.', 409);
        }
        if (count($before['items']) >= 50) {
            self::release_idempotency_lock($option_name, $lock);
            return self::rest_error('hm_affiliate_product_limit', 'The existing configuration already contains the maximum of 50 products.', 409);
        }
        $item = array(
            'id' => $product['id'],
            'title' => $product['title'],
            'url' => $product['url'],
            'description' => $product['description'],
            'image_id' => isset($product['image_id']) ? $product['image_id'] : 0,
            'rights_confirmed' => false,
            'price' => '',
            'price_updated_at' => '',
            'order' => $product['order'],
            'enabled' => false,
        );
        $next = $before;
        $next['items'][] = $item;
        $next['approval'] = null;
        $next['reviewed_digest'] = null;
        $next = self::validate_config($next);
        if (is_wp_error($next)) {
            self::release_idempotency_lock($option_name, $lock);
            return self::rest_error('hm_affiliate_invalid_product', $next->get_error_message(), 422);
        }
        $saved = self::persist_draft_config($expected_stored, $before, $next);
        if (is_wp_error($saved)) {
            if ($saved->get_error_code() === 'hm_affiliate_write_conflict') {
                // The compare-and-swap may have committed before another writer
                // changed the option seen during readback. Keep the pending
                // receipt so a retry with this key can recover that product.
                return self::rest_error('hm_affiliate_write_conflict', 'Configuration changed during create. The draft may have committed; retry with the same idempotency key so the saved product can be recovered.', 409);
            }
            if ($saved->get_error_code() === 'hm_affiliate_backup_failed') {
                // Backup failure happens before write_config is called.
                self::release_idempotency_lock($option_name, $lock);
            }
            return $saved;
        }
        if (!self::complete_idempotency($option_name, $lock)) {
            return self::rest_error('hm_affiliate_idempotency_readback_failed', 'Draft was saved disabled, but its idempotency receipt needs recovery; retry the same key.', 500);
        }
        $readback = self::get_config();
        $index = self::product_index($readback, $product['id']);
        if ($index === null || self::api_product_payload_hash($readback['items'][$index]) !== $request_hash) {
            return self::rest_error('hm_affiliate_readback_failed', 'Saved product readback did not match the create request.', 500);
        }
        $revision = self::digest($readback);
        return self::rest_response(array(
            'product' => self::product_view($readback['items'][$index], $readback),
            'revision' => $revision,
            'replayed' => false,
            'draft' => true,
            'public_output' => false,
        ), 201, $revision);
    }

    public static function rest_products_update($request) {
        $permission = self::rest_permission($request);
        if (is_wp_error($permission)) {
            return $permission;
        }
        $id = $request->get_param('id');
        if (!self::valid_product_id($id)) {
            return self::rest_error('hm_affiliate_invalid_product_id', 'id must be a stable lowercase identifier.', 400);
        }
        $body = self::request_json($request);
        if (is_wp_error($body)) {
            return $body;
        }
        $patch = self::normalize_product_request($body, false);
        if (is_wp_error($patch)) {
            return $patch;
        }
        $expected_revision = self::expected_revision($request);
        if (is_wp_error($expected_revision)) {
            return $expected_revision;
        }
        $expected_stored = get_option(self::OPTION, null);
        $config = self::rest_current_config();
        if (is_wp_error($config)) {
            return $config;
        }
        $current_revision = self::digest($config);
        if (!hash_equals($current_revision, $expected_revision)) {
            return self::rest_error('hm_affiliate_revision_conflict', 'Configuration changed since the last read. Reload the product and review the current revision before retrying.', 409);
        }
        $index = self::product_index($config, $id);
        if ($index === null) {
            return self::rest_error('hm_affiliate_product_not_found', 'Product was not found.', 404);
        }
        $before = $config;
        $item = $config['items'][$index];
        foreach ($patch as $field => $value) {
            if ($field === 'image_id' && $value !== $item['image_id']) {
                // Image ownership is an owner attestation, never inferred from agent input.
                $item['rights_confirmed'] = false;
            }
            $item[$field] = $value;
        }
        // Agent product edits always return to Draft and never alter placements or approval.
        $item['enabled'] = false;
        $config['items'][$index] = $item;
        $config['approval'] = null;
        $config['reviewed_digest'] = null;
        $next = self::validate_config($config);
        if (is_wp_error($next)) {
            return self::rest_error('hm_affiliate_invalid_product', $next->get_error_message(), 422);
        }
        $saved = self::persist_draft_config($expected_stored, $before, $next);
        if (is_wp_error($saved)) {
            if ($saved->get_error_code() === 'hm_affiliate_write_conflict') {
                return self::rest_error('hm_affiliate_revision_conflict', 'Configuration changed during update; reload current products and retry with the latest revision.', 409);
            }
            return $saved;
        }
        $readback = self::get_config();
        $readback_index = self::product_index($readback, $id);
        if ($readback_index === null || $readback['items'][$readback_index] !== $next['items'][$index]) {
            return self::rest_error('hm_affiliate_readback_failed', 'Saved product readback did not match the requested draft update.', 500);
        }
        $revision = self::digest($readback);
        return self::rest_response(array(
            'product' => self::product_view($readback['items'][$readback_index], $readback),
            'revision' => $revision,
            'draft' => true,
            'public_output' => false,
            'live_ready' => self::live_ready($readback),
        ), 200, $revision);
    }

    public static function admin_menu() {
        add_options_page('Hybrid Mind Affiliate Slots', 'Affiliate Slots', self::CAPABILITY, 'hm-affiliate-slots', array(__CLASS__, 'admin_page'));
    }

    /** Read-only field-level diff; output values still need context escaping. */
    public static function config_diff($before, $after, $path = '') {
        if ($before === $after) {
            return array();
        }
        if (!is_array($before) || !is_array($after)) {
            return array(array('path' => $path === '' ? '/' : $path, 'before' => $before, 'after' => $after));
        }
        $changes = array();
        $keys = array_unique(array_merge(array_keys($before), array_keys($after)));
        foreach ($keys as $key) {
            $child_path = $path.'/'.str_replace(array('~', '/'), array('~0', '~1'), (string) $key);
            if (!array_key_exists($key, $before)) {
                $changes[] = array('path' => $child_path, 'before' => null, 'after' => $after[$key]);
            } elseif (!array_key_exists($key, $after)) {
                $changes[] = array('path' => $child_path, 'before' => $before[$key], 'after' => null);
            } else {
                $changes = array_merge($changes, self::config_diff($before[$key], $after[$key], $child_path));
            }
        }
        return $changes;
    }

    /** Atomic, byte-exact compare-and-swap for this plugin's own option only. */
    private static function write_config($expected, $next) {
        global $wpdb;
        if ($expected === null) {
            $written = add_option(self::OPTION, $next, '', false);
        } else {
            // Table name is the trusted WP table property; every value is prepared.
            // BINARY prevents case-insensitive DB collation from accepting stale bytes.
            $written = $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND BINARY option_value = %s",
                maybe_serialize($next), self::OPTION, maybe_serialize($expected)
            ));
        }
        // Scoped option cache invalidation only; no page/CDN/global cache flush.
        wp_cache_delete(self::OPTION, 'options');
        wp_cache_delete('notoptions', 'options');
        if ($written === false || get_option(self::OPTION, null) !== $next) {
            return new WP_Error('hm_affiliate_write_conflict', 'Configuration changed concurrently or could not be persisted. No success is claimed; reload and verify the current revision before retrying.');
        }
        return true;
    }

    /** Admin POST actions only; no live-write REST route exists. */
    public static function process_admin_action($post) {
        if (!current_user_can(self::CAPABILITY)) {
            return new WP_Error('hm_affiliate_forbidden', 'Administrator access is required.');
        }
        if (!isset($post['_wpnonce']) || !is_string($post['_wpnonce']) || !wp_verify_nonce($post['_wpnonce'], self::NONCE_ACTION)) {
            return new WP_Error('hm_affiliate_nonce', 'Invalid or expired request token. No configuration was changed.');
        }
        $action = isset($post['hm_aff_action']) && is_string($post['hm_aff_action']) ? $post['hm_aff_action'] : '';
        $expected = get_option(self::OPTION, null);
        $config = self::get_config();
        if ($action === 'save_placements') {
            if (!isset($post['expected_placement_digest']) || !is_string($post['expected_placement_digest']) || !hash_equals(self::placement_digest(), $post['expected_placement_digest'])) {
                return self::error('Automatic placement choices changed since this form was opened. Reload and review the current choices before saving.');
            }
            $selected = isset($post['auto_placements']) ? $post['auto_placements'] : array();
            if (!is_array($selected) || !self::is_list($selected) || count($selected) > count(self::AUTO_PLACEMENT_IDS)) {
                return self::error('Automatic placement choices must be a list of known positions. No settings were changed.');
            }
            $next_placements = self::auto_placement_defaults();
            foreach ($selected as $id) {
                if (!is_string($id) || !in_array($id, self::AUTO_PLACEMENT_IDS, true) || $next_placements[$id]) {
                    return self::error('Unknown or duplicate automatic placement. No settings were changed.');
                }
                $next_placements[$id] = true;
            }
            $current_placements = self::auto_placements();
            if ($current_placements === $next_placements) {
                return array('message' => 'Automatic placement settings are unchanged.');
            }
            update_option(self::AUTO_BACKUP_OPTION, $current_placements, false);
            if (get_option(self::AUTO_BACKUP_OPTION, null) !== $current_placements) {
                return self::error('Automatic placement backup could not be verified. No settings were changed.');
            }
            if ($config['approval'] !== null || $config['reviewed_digest'] !== null) {
                $config['approval'] = null;
                $config['reviewed_digest'] = null;
                $write = self::write_config($expected, $config);
                if (is_wp_error($write)) {
                    return $write;
                }
            } elseif (get_option(self::OPTION, null) !== $expected) {
                return self::error('The product configuration changed while placement settings were being saved. Reload and retry.');
            }
            update_option(self::AUTO_OPTION, $next_placements, false);
            if (get_option(self::AUTO_OPTION, null) !== $next_placements) {
                return self::error('Prior approval was safely cleared, but the new placement settings could not be verified. Public output remains paused.');
            }
            return array('message' => 'Automatic placements saved. Prior approval and review were cleared; preview and owner approval are required before public output resumes.');
        }
        if ($action === 'save') {
            if (!isset($post['expected_digest']) || !is_string($post['expected_digest']) || !hash_equals(self::digest($config), $post['expected_digest'])) {
                return self::error('The editor revision is stale. Reload, inspect the diff, and save against the current digest.');
            }
            if (!isset($post['config_json']) || !is_string($post['config_json']) || strlen($post['config_json']) > 250000) {
                return self::error('Provide JSON configuration smaller than 250 KB.');
            }
            $input = json_decode($post['config_json'], true, 32);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return self::error('Malformed JSON. Existing configuration has been preserved.');
            }
            $draft = self::validate_config($input);
            if (is_wp_error($draft)) {
                return $draft;
            }
            update_option(self::BACKUP_OPTION, $config, false);
            if (get_option(self::BACKUP_OPTION, null) !== $config) {
                return self::error('Previous configuration could not be backed up. Draft was not saved.');
            }
            $write = self::write_config($expected, $draft);
            if (is_wp_error($write)) { return $write; }
            return array('message' => 'Draft saved. Previous approval is invalidated; public output is paused on the next render. Previously cached pages may require an approved cache purge and recheck.', 'preview' => false);
        }
        if ($action === 'preview') {
            $config['reviewed_digest'] = self::digest($config);
            $write = self::write_config($expected, $config);
            if (is_wp_error($write)) { return $write; }
            return array('message' => 'Private preview of the saved draft. No page, template or public ad was changed.', 'preview' => true);
        }
        if ($action === 'disable') {
            $config['approval'] = null;
            $config['reviewed_digest'] = null;
            $write = self::write_config($expected, $config);
            if (is_wp_error($write)) { return $write; }
            return array('message' => 'Public output paused on the next render. Previously cached pages may retain older HTML until an approved cache purge and recheck. Configuration and placements were preserved.', 'preview' => false);
        }
        if ($action === 'approve') {
            $digest = self::digest($config);
            if (!isset($post['reviewed_digest'], $post['owner_approval'], $post['domains_confirmed']) || !is_string($post['reviewed_digest']) || !is_string($config['reviewed_digest']) || !hash_equals($digest, $post['reviewed_digest']) || !hash_equals($digest, $config['reviewed_digest']) || $post['owner_approval'] !== 'yes' || $post['domains_confirmed'] !== 'yes') {
                return self::error('Preview the current saved revision, then explicitly confirm owner approval and supported owner-provided Shopee link domains.');
            }
            $problem = self::approval_problem($config);
            if ($problem !== '') {
                return self::error($problem);
            }
            if (!isset($post['placement_digest']) || !is_string($post['placement_digest']) || !hash_equals(self::placement_digest(), $post['placement_digest'])) {
                return self::error('Automatic placements changed after this approval form was opened. Reload, review the current positions, and approve again.');
            }
            $config['approval'] = array('digest' => $digest, 'user_id' => (int) get_current_user_id(), 'approved_at' => gmdate('c'), 'domains_confirmed' => true, 'placement_digest' => self::placement_digest());
            $write = self::write_config($expected, $config);
            if (is_wp_error($write)) { return $write; }
            return array('message' => 'Reviewed configuration and current placement choices approved. Public output still requires each slot and item to be enabled.', 'preview' => false);
        }
        return self::error('Unknown administrative action.');
    }

    private static function input_form($action, $button, $extra = '') {
        echo '<form method="post">';
        wp_nonce_field(self::NONCE_ACTION);
        echo '<input type="hidden" name="hm_aff_action" value="'.esc_attr($action).'">'.$extra;
        submit_button($button, 'secondary');
        echo '</form>';
    }

    public static function admin_page() {
        if (!current_user_can(self::CAPABILITY)) {
            wp_die('Administrator access is required.');
        }
        nocache_headers();
        $show_preview = false;
        $result = null;
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $result = self::process_admin_action(wp_unslash($_POST));
            $show_preview = !is_wp_error($result) && !empty($result['preview']);
        }
        $config = self::get_config();
        $digest = self::digest($config);
        $placements = self::auto_placements();
        $placement_digest = self::placement_digest($placements);
        $json = wp_json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        echo '<div class="wrap"><h1>Hybrid Mind Affiliate Slots — Candidate 0.3.0</h1><p>Private configuration and review. Existing homepage/article reservation stubs are untouched. No scraping, remote metadata fetching, scripts or click tracking.</p>';
        if ($result !== null) {
            $message = is_wp_error($result) ? $result->get_error_message() : $result['message'];
            echo '<div class="notice '.(is_wp_error($result) ? 'notice-error' : 'notice-success').'"><p>'.esc_html($message).'</p></div>';
        }
        echo '<p><strong>Status:</strong> '.esc_html(self::live_ready($config) ? 'Approved for the placement choices shown below' : 'DRAFT / PUBLIC OUTPUT DISABLED').'<br><strong>Revision SHA256:</strong> <code>'.esc_html($digest).'</code><br><strong>Placement SHA256:</strong> <code>'.esc_html($placement_digest).'</code></p>';
        echo '<section class="hm-aff-admin-placements"><h2>Automatic placements (opt-in)</h2><p>Check only the positions you want. Saving a change clears the previous review and approval. Then review the saved configuration and approve it again. A placement is still empty unless its slot and product are enabled and the current reviewed configuration passes the live gate.</p><form method="post">';
        wp_nonce_field(self::NONCE_ACTION);
        echo '<input type="hidden" name="hm_aff_action" value="save_placements"><input type="hidden" name="expected_placement_digest" value="'.esc_attr($placement_digest).'"><fieldset><legend>Public positions</legend>';
        echo '<label><input type="checkbox" name="auto_placements[]" value="home_after_feature"'.checked($placements['home_after_feature'], true, false).'> Homepage, after the Featured hero and before the #latest section (only when the exact saved Gutenberg HTML boundary is found)</label><br>';
        echo '<label><input type="checkbox" name="auto_placements[]" value="article_after_intro"'.checked($placements['article_after_intro'], true, false).'> Published articles, after the third top-level paragraph when a safe paragraph boundary exists</label><br>';
        echo '<label><input type="checkbox" name="auto_placements[]" value="article_near_end"'.checked($placements['article_near_end'], true, false).'> Long published articles, after the penultimate top-level paragraph (at least 8 paragraphs and 600 words)</label>';
        echo '</fieldset><p>If the homepage block changes and the exact boundary cannot be verified, no automatic card is inserted. The fallback is a manually placed Gutenberg Shortcode block immediately after the Featured section and before #latest, after checking that exact boundary in the page editor. Existing explicit shortcodes suppress automatic placement on that page to prevent duplicates.</p>';
        submit_button('Save automatic placement choices', 'secondary');
        echo '</form></section>';
        echo '<p>Owner manages real Affiliate URLs, bounded plain text, local Media Library images, rights_confirmed and order. Slot flags and item_ids determine selection. Cards do not display prices; legacy price fields remain stored for compatibility. Products sort by order and original items-list sequence; maximum 3 per unit and 2 units per page. sidebar_desktop remains unplaced until the theme owner approves integration. All saves invalidate approval.</p>';
        echo '<details><summary>Field guide (no real links are supplied by this candidate)</summary><ul><li><code>id</code>: unique lowercase item name, for example <code>owner-item-1</code>.</li><li><code>title</code>: product name, up to 180 characters; <code>description</code>: plain text up to 300 characters. The configuration holds at most 50 items.</li><li><code>url</code>: paste the exact raw owner Affiliate URL with ordinary <code>&amp;</code> separators, never HTML entity text such as <code>&amp;amp;</code>. Empty URL is allowed while preparing a draft and that item is skipped in every preview/render. The validator rejects unsafe nonempty URLs, rewrites and unsupported domains.</li><li><code>image_id</code>: integer ID of the owner-uploaded Media Library image. <code>rights_confirmed</code>: boolean <code>true</code> only after confirming permission. Image ID 0 is draft-only.</li><li><code>order</code>: integer 0–9999, lower appears first; <code>enabled</code>: boolean per item.</li><li>Price fields in legacy configuration are retained for compatibility but are not displayed on cards; the Product API does not accept price fields.</li><li>Each slot has <code>enabled</code> (boolean) and <code>item_ids</code> (an array of existing item IDs). Use <code>demo: true</code> for test data; it can never be enabled publicly.</li></ul></details>';
        echo '<form method="post">';
        wp_nonce_field(self::NONCE_ACTION);
        echo '<input type="hidden" name="hm_aff_action" value="save"><input type="hidden" name="expected_digest" value="'.esc_attr($digest).'"><label for="hm-aff-config"><strong>Draft / JSON import</strong></label><textarea id="hm-aff-config" name="config_json" rows="24" style="display:block;width:100%;max-width:1100px;font-family:monospace">'.esc_textarea($json).'</textarea>';
        submit_button('Save as disabled draft');
        echo '</form>';
        self::input_form('preview', 'Review saved draft privately');
        if ($show_preview) {
            echo '<section class="hm-aff-admin-preview"><h2>Private preview — '.esc_html($config['demo'] ? 'DEMO' : 'DRAFT').'</h2><p>This isolated preview shows enabled units separately. Public rendering still requires approval, context checks, an owner-approved placement choice and the shared 2-unit cap.</p>';
            $shown = 0;
            foreach (self::SLOT_IDS as $id) {
                $items = self::slot_items($config, $id);
                if ($items) {
                    echo '<h3>'.esc_html($id).'</h3>'.self::render_markup($id, $items, $config['demo'] ? 'DEMO — PRIVATE PREVIEW' : 'DRAFT — PRIVATE PREVIEW', $config['demo']);
                    $shown++;
                }
            }
            if (!$shown) {
                echo '<p>No enabled slot has a valid enabled item. Empty public slots output no wrapper or gap.</p>';
            }
            echo '</section>';
        }
        if (is_string($config['reviewed_digest']) && hash_equals($digest, $config['reviewed_digest'])) {
            $extra = '<input type="hidden" name="reviewed_digest" value="'.esc_attr($digest).'"><input type="hidden" name="placement_digest" value="'.esc_attr($placement_digest).'"><p><label><input type="checkbox" name="owner_approval" value="yes" required> I have reviewed this exact revision and the placement choices shown above, and explicitly approve public use including disclosure, images and image usage rights.</label></p><p><label><input type="checkbox" name="domains_confirmed" value="yes" required> These are owner-provided real links; their exact domains are verified against my current Shopee Affiliate account / official link format. Programme eligibility and commission are not guaranteed by this plugin.</label></p>';
            self::input_form('approve', 'Approve reviewed revision and placement choices', $extra);
        }
        self::input_form('disable', 'Pause public output on next render');
        $previous = get_option(self::BACKUP_OPTION, null);
        echo '<details><summary>Read-only export / previous revision diff</summary><p>Copy the JSON below for a private backup. Importing it always returns to Draft; server approval metadata cannot be imported.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'.esc_html($json).'</pre>';
        if (is_array($previous)) {
            $changes = self::config_diff($previous, $config);
            echo '<h2>Field-level diff from previous saved revision</h2><table class="widefat"><thead><tr><th>Path</th><th>Before</th><th>After</th></tr></thead><tbody>';
            foreach ($changes as $change) {
                echo '<tr><td><code>'.esc_html($change['path']).'</code></td><td><code>'.esc_html(wp_json_encode($change['before'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)).'</code></td><td><code>'.esc_html(wp_json_encode($change['after'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)).'</code></td></tr>';
            }
            if (!$changes) {
                echo '<tr><td colspan="3">No differences.</td></tr>';
            }
            echo '</tbody></table>';
            echo '<h2>Previous configuration snapshot</h2><p>Compare the complete saved revision below with the current export. The existing previous snapshot is retained on the next save as a one-step recovery aid.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'.esc_html(wp_json_encode($previous, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)).'</pre><p>Previous digest: <code>'.esc_html(self::digest($previous)).'</code> · current digest: <code>'.esc_html($digest).'</code></p>';
        } else {
            echo '<p>No prior saved revision snapshot exists.</p>';
        }
        echo '</details></div>';
    }
}

HM_Affiliate_Slots::boot();

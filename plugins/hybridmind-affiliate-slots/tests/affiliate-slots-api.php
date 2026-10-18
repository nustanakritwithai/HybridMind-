<?php
define('ABSPATH', __DIR__);

$hm_options = array();
$hm_routes = array();
$hm_filters = array();
$hm_logged_in = true;
$hm_manage_options = true;
$hm_front_page = true;
$hm_singular = false;
$hm_is_admin = false;
$hm_in_loop = true;
$hm_main_query = true;
$hm_password_required = false;
$hm_current_post = (object) array('ID' => 16, 'post_status' => 'publish', 'post_content' => '', 'post_password' => '');
$hm_attachments = array(
    7 => array('mime' => 'image/png', 'url' => 'https://media.hybridmind.online/uploads/product.png'),
);
$hm_wp_block_parser_path = getenv('HM_WP_BLOCK_PARSER_PATH');
if (is_string($hm_wp_block_parser_path) && $hm_wp_block_parser_path !== '' && is_file($hm_wp_block_parser_path)) {
    require_once $hm_wp_block_parser_path;
}

function add_action() {}
function add_filter($tag, $callback, $priority = 10, $accepted_args = 1) { $GLOBALS['hm_filters'][$tag][$priority] = $callback; }
function add_shortcode() {}
function register_activation_hook() {}
function shortcode_atts($pairs, $atts, $shortcode = '') {
    $result = $pairs;
    foreach ($pairs as $name => $default) {
        if (array_key_exists($name, $atts)) {
            $result[$name] = $atts[$name];
        }
    }
    return $result;
}
function register_rest_route($namespace, $route, $args) {
    $GLOBALS['hm_routes'][$namespace.$route] = $args;
}
function is_user_logged_in() { return $GLOBALS['hm_logged_in']; }
function current_user_can($capability) { return $capability === 'manage_options' && $GLOBALS['hm_manage_options']; }
function get_option($name, $default = false) {
    return array_key_exists($name, $GLOBALS['hm_options']) ? $GLOBALS['hm_options'][$name] : $default;
}
function add_option($name, $value, $deprecated = '', $autoload = 'yes') {
    if (array_key_exists($name, $GLOBALS['hm_options'])) {
        return false;
    }
    $GLOBALS['hm_options'][$name] = $value;
    return true;
}
function update_option($name, $value, $autoload = null) {
    $GLOBALS['hm_options'][$name] = $value;
    return true;
}
function delete_option($name) {
    unset($GLOBALS['hm_options'][$name]);
    return true;
}
function maybe_serialize($value) {
    return is_array($value) || is_object($value) ? serialize($value) : $value;
}
function wp_cache_delete() { return true; }
function wp_json_encode($value, $flags = 0) { return json_encode($value, $flags); }
function wp_parse_url($url) { return parse_url($url); }
function esc_url_raw($url, $protocols = null) {
    if (!is_string($url)) {
        return '';
    }
    $parts = parse_url($url);
    if (!$parts || !isset($parts['scheme'])) {
        return '';
    }
    if (is_array($protocols) && !in_array(strtolower($parts['scheme']), $protocols, true)) {
        return '';
    }
    return $url;
}
function esc_url($url, $protocols = null) { return esc_url_raw($url, $protocols); }
function esc_attr($value) { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function esc_html($value) { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function sanitize_text_field($value) { return trim(strip_tags($value)); }
function sanitize_textarea_field($value) { return trim(strip_tags($value)); }
function wp_attachment_is_image($id) { return isset($GLOBALS['hm_attachments'][$id]); }
function get_post_mime_type($id) {
    return isset($GLOBALS['hm_attachments'][$id]) ? $GLOBALS['hm_attachments'][$id]['mime'] : false;
}
function wp_get_attachment_url($id) {
    return isset($GLOBALS['hm_attachments'][$id]) ? $GLOBALS['hm_attachments'][$id]['url'] : false;
}
function wp_get_attachment_image_src($id, $size) {
    if (!isset($GLOBALS['hm_attachments'][$id])) {
        return false;
    }
    return array($GLOBALS['hm_attachments'][$id]['url'], 640, 480, true);
}
function attachment_url_to_postid($url) {
    foreach ($GLOBALS['hm_attachments'] as $id => $attachment) {
        if ($attachment['url'] === $url) {
            return $id;
        }
    }
    return 0;
}
function is_feed() { return !empty($GLOBALS['hm_is_feed']); }
function is_preview() { return !empty($GLOBALS['hm_is_preview']); }
function is_admin() { return $GLOBALS['hm_is_admin']; }
function in_the_loop() { return $GLOBALS['hm_in_loop']; }
function is_main_query() { return $GLOBALS['hm_main_query']; }
function post_password_required($post = null) { return $GLOBALS['hm_password_required']; }
function is_front_page() { return $GLOBALS['hm_front_page']; }
function is_singular($post_type = 'post') { return $post_type === 'post' && $GLOBALS['hm_singular']; }
function get_queried_object_id() { return $GLOBALS['hm_current_post']->ID; }
function get_post($id) { return $GLOBALS['hm_current_post']; }
function has_shortcode($content, $tag) { return preg_match('/\[\s*'.preg_quote($tag, '/').'\b/i', $content) === 1; }
function parse_blocks($content) {
    if (class_exists('WP_Block_Parser')) {
        $parser = new WP_Block_Parser();
        return $parser->parse($content);
    }
    $blocks = array();
    $offset = 0;
    if (preg_match_all('~<!-- wp:([a-z0-9/_-]+)(?:\s+({.*?}))? -->(.*?)<!-- /wp:\1 -->~s', $content, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
        foreach ($matches as $match) {
            $full = $match[0][0];
            $start = $match[0][1];
            if ($start > $offset) {
                $freeform = substr($content, $offset, $start - $offset);
                $blocks[] = array('blockName' => null, 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => $freeform, 'innerContent' => array($freeform));
            }
            $name = $match[1][0];
            $attrs = isset($match[2]) && $match[2][0] !== '' ? json_decode($match[2][0], true) : array();
            $html = $match[3][0];
            $blocks[] = array('blockName' => $name, 'attrs' => is_array($attrs) ? $attrs : array(), 'innerBlocks' => array(), 'innerHTML' => $html, 'innerContent' => array($html));
            $offset = $start + strlen($full);
        }
    }
    if ($offset < strlen($content)) {
        $freeform = substr($content, $offset);
        $blocks[] = array('blockName' => null, 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => $freeform, 'innerContent' => array($freeform));
    }
    return $blocks;
}
function serialize_blocks($blocks) {
    $content = '';
    foreach ($blocks as $block) {
        if (!isset($block['innerHTML']) || !is_string($block['innerHTML'])) {
            return '';
        }
        if (!isset($block['blockName']) || $block['blockName'] === null) {
            $content .= $block['innerHTML'];
            continue;
        }
        if (!is_string($block['blockName'])) {
            return '';
        }
        $name = $block['blockName'];
        $attrs = !empty($block['attrs']) ? ' '.json_encode($block['attrs'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : '';
        $inner_content = isset($block['innerContent']) && is_array($block['innerContent']) ? $block['innerContent'] : array($block['innerHTML']);
        $inner_blocks = isset($block['innerBlocks']) && is_array($block['innerBlocks']) ? $block['innerBlocks'] : array();
        $inner = '';
        $child_index = 0;
        foreach ($inner_content as $chunk) {
            if ($chunk === null) {
                if (!isset($inner_blocks[$child_index])) {
                    return '';
                }
                $inner .= serialize_blocks(array($inner_blocks[$child_index]));
                $child_index++;
            } elseif (is_string($chunk)) {
                $inner .= $chunk;
            } else {
                return '';
            }
        }
        if ($child_index !== count($inner_blocks)) {
            return '';
        }
        $content .= '<!-- wp:'.$name.$attrs.' -->'.$inner.'<!-- /wp:'.$name.' -->';
    }
    return $content;
}
function is_wp_error($value) { return $value instanceof WP_Error; }
function wp_verify_nonce($nonce, $action) { return $nonce === 'test-nonce'; }
function get_current_user_id() { return 1; }

class WP_Error {
    private $code;
    private $message;
    private $data;
    public function __construct($code = '', $message = '', $data = null) {
        $this->code = $code;
        $this->message = $message;
        $this->data = $data;
    }
    public function get_error_code() { return $this->code; }
    public function get_error_message() { return $this->message; }
    public function get_error_data() { return $this->data; }
}

class WP_REST_Response {
    private $data;
    private $status;
    private $headers = array();
    public function __construct($data = null, $status = 200) {
        $this->data = $data;
        $this->status = $status;
    }
    public function header($name, $value) { $this->headers[$name] = $value; }
    public function get_data() { return $this->data; }
    public function get_status() { return $this->status; }
    public function get_headers() { return $this->headers; }
}

class WP_REST_Request {
    private $body;
    private $headers;
    private $params;
    public function __construct($body = array(), $headers = array(), $params = array()) {
        $this->body = $body;
        $this->headers = array_change_key_case($headers, CASE_LOWER);
        $this->params = $params;
    }
    public function get_json_params() { return $this->body; }
    public function get_header($name) {
        $name = strtolower($name);
        return isset($this->headers[$name]) ? $this->headers[$name] : '';
    }
    public function get_param($name) {
        return isset($this->params[$name]) ? $this->params[$name] : null;
    }
}

class HM_Test_WPDB {
    public $options = 'wp_options';
    public function prepare($sql) {
        $args = func_get_args();
        array_shift($args);
        return array('sql' => $sql, 'args' => $args);
    }
    public function query($prepared) {
        $args = $prepared['args'];
        if (strpos($prepared['sql'], 'UPDATE') === 0) {
            list($serialized_next, $name, $serialized_expected) = $args;
            if (!array_key_exists($name, $GLOBALS['hm_options']) || maybe_serialize($GLOBALS['hm_options'][$name]) !== $serialized_expected) {
                return 0;
            }
            $GLOBALS['hm_options'][$name] = unserialize($serialized_next);
            if ($name === 'hm_affiliate_slots_v1' && !empty($GLOBALS['hm_after_next_config_cas'])) {
                unset($GLOBALS['hm_after_next_config_cas']);
                foreach ($GLOBALS['hm_options'][$name]['items'] as &$item) {
                    if ($item['id'] === 'legacy-product') {
                        // Simulate another writer landing after our CAS but
                        // before write_config() performs its readback.
                        $item['order'] = 1;
                        break;
                    }
                }
                unset($item);
            }
            return 1;
        }
        if (strpos($prepared['sql'], 'DELETE') === 0) {
            list($name, $serialized_expected) = $args;
            if (!array_key_exists($name, $GLOBALS['hm_options']) || maybe_serialize($GLOBALS['hm_options'][$name]) !== $serialized_expected) {
                return 0;
            }
            unset($GLOBALS['hm_options'][$name]);
            return 1;
        }
        return false;
    }
}

class HM_Test_Assertions {
    public static $count = 0;
    public static function check($condition, $label) {
        self::$count++;
        if (!$condition) {
            throw new RuntimeException('FAIL: '.$label);
        }
    }
    public static function status($result) {
        return $result instanceof WP_REST_Response ? $result->get_status() : (is_wp_error($result) && isset($result->get_error_data()['status']) ? $result->get_error_data()['status'] : 0);
    }
}

$GLOBALS['wpdb'] = new HM_Test_WPDB();
require dirname(__DIR__).'/hybridmind-affiliate-slots.php';

function hm_request($body = array(), $headers = array(), $params = array()) {
    return new WP_REST_Request($body, $headers, $params);
}
function hm_create_body($id, $title, $url, $image = null, $order = 10) {
    return array('id' => $id, 'title' => $title, 'description' => 'ตรวจสอบรายละเอียดกับผู้ขายก่อนเลือกซื้อ', 'url' => $url, 'image' => $image, 'order' => $order);
}
function hm_find_item($config, $id) {
    foreach ($config['items'] as $item) {
        if ($item['id'] === $id) {
            return $item;
        }
    }
    return null;
}
function hm_error_status($result) {
    return HM_Test_Assertions::status($result);
}
function hm_block($name, $html) {
    return array('blockName' => $name, 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => $html, 'innerContent' => array($html));
}
function hm_group_block($blocks, $attrs = array()) {
    $inner_content = array("\n");
    for ($i = 0, $count = count($blocks); $i < $count; $i++) {
        $inner_content[] = null;
        if ($i < $count - 1) {
            $inner_content[] = "\n";
        }
    }
    $inner_content[] = "\n";
    return array('blockName' => 'core/group', 'attrs' => $attrs, 'innerBlocks' => $blocks, 'innerHTML' => str_repeat("\n", count($blocks) + 1), 'innerContent' => $inner_content);
}
function hm_flatten_block_names($blocks) {
    $names = array();
    foreach ($blocks as $block) {
        $names[] = isset($block['blockName']) && is_string($block['blockName']) ? $block['blockName'] : null;
        if (isset($block['blockName']) && $block['blockName'] === 'core/group' && isset($block['innerBlocks']) && is_array($block['innerBlocks'])) {
            $names = array_merge($names, hm_flatten_block_names($block['innerBlocks']));
        }
    }
    return $names;
}
function hm_blocks_content($blocks) { return serialize_blocks($blocks); }
function hm_set_content_context($content, $front_page = false) {
    global $post;
    $GLOBALS['hm_front_page'] = $front_page;
    $GLOBALS['hm_singular'] = !$front_page;
    $id = $front_page ? 16 : 101;
    $GLOBALS['hm_current_post'] = (object) array('ID' => $id, 'post_status' => 'publish', 'post_content' => $content, 'post_password' => '');
    $post = $GLOBALS['hm_current_post'];
}
function hm_paragraph_blocks($count, $words_each = 12) {
    $blocks = array();
    for ($i = 1; $i <= $count; $i++) {
        $words = array();
        for ($j = 0; $j < $words_each; $j++) {
            $words[] = 'article'.$i.'word'.$j;
        }
        $blocks[] = hm_block('core/paragraph', '<p>'.implode(' ', $words).'.</p>');
    }
    return $blocks;
}
function hm_conventional_blocks_content($blocks) {
    $serialized = array();
    foreach ($blocks as $block) {
        $serialized[] = serialize_blocks(array($block));
    }
    return implode("\n\n", $serialized)."\n\n";
}
function hm_test_thai_graphemes($text) {
    $compact = preg_replace('/\s+/u', '', $text);
    $count = preg_match_all('/\X/u', $compact, $matches);
    return $count === false ? 0 : $count;
}
function hm_thai_paragraph_blocks($count, $minimum_graphemes) {
    $sentence = 'เนื้อหาภาษาไทยนี้อธิบายข้อมูลอย่างระมัดระวัง โดยไม่ยืนยันคุณสมบัติที่ยังไม่ได้ตรวจสอบ และชวนให้ผู้อ่านพิจารณารายละเอียดจากแหล่งข้อมูล';
    $blocks = array();
    for ($i = 0; $i < $count; $i++) {
        $text = '';
        while (hm_test_thai_graphemes($text) < $minimum_graphemes) {
            $text .= $sentence;
        }
        $blocks[] = hm_block('core/paragraph', '<p>'.$text.' Thai paragraph '.($i + 1).'</p>');
    }
    return $blocks;
}

HM_Affiliate_Slots::activate();
HM_Test_Assertions::check(getenv('HM_WP_BLOCK_PARSER_PATH') === false || class_exists('WP_Block_Parser'), 'CI loads the pinned real WordPress block parser when configured');
$legacy_placement_flags = array('home_after_feature' => false, 'article_after_intro' => false, 'article_near_end' => false);
HM_Test_Assertions::check(HM_Affiliate_Slots::placement_digest($legacy_placement_flags) === HM_Affiliate_Slots::placement_digest(HM_Affiliate_Slots::auto_placement_defaults()), 'new disabled middle placement preserves legacy placement approval digest');
$legacy = HM_Affiliate_Slots::defaults();
$legacy['items'][] = array(
    'id' => 'legacy-product',
    'title' => 'Legacy product',
    'url' => 'https://s.shopee.co.th/legacy',
    'description' => 'Existing approved legacy item.',
    'image_id' => 7,
    'rights_confirmed' => true,
    'price' => '฿999',
    'price_updated_at' => '2026-10-18',
    'order' => 0,
    'enabled' => true,
);
$legacy['slots']['home_after_feature'] = array('enabled' => true, 'item_ids' => array('legacy-product'));
$legacy['reviewed_digest'] = HM_Affiliate_Slots::digest($legacy);
$legacy['approval'] = array(
    'digest' => HM_Affiliate_Slots::digest($legacy),
    'user_id' => 1,
    'approved_at' => '2026-10-18T10:00:00+00:00',
    'domains_confirmed' => true,
);
$GLOBALS['hm_options'][HM_Affiliate_Slots::OPTION] = $legacy;
$legacy_item_before = HM_Affiliate_Slots::get_config()['items'][0];
$legacy_slots_before = HM_Affiliate_Slots::get_config()['slots'];

HM_Test_Assertions::check(HM_Affiliate_Slots::live_ready(HM_Affiliate_Slots::get_config()), 'legacy approved configuration starts live-ready');
HM_Test_Assertions::check(count(HM_Affiliate_Slots::get_config()['slots']) === 5 && !array_key_exists('article_middle', HM_Affiliate_Slots::get_config()['slots']), 'middle placement preserves the five-slot schema-1 product configuration');
HM_Test_Assertions::check(HM_Affiliate_Slots::digest($legacy) === HM_Affiliate_Slots::digest(HM_Affiliate_Slots::get_config()), 'legacy product approval digest remains unchanged');
$legacy_html = HM_Affiliate_Slots::shortcode(array('id' => 'home_after_feature'));
HM_Test_Assertions::check(strpos($legacy_html, 'ดูสินค้าบน Shopee') !== false, 'CTA uses the requested Shopee label');
HM_Test_Assertions::check(strpos($legacy_html, 'rel="sponsored noopener"') !== false, 'outbound link has sponsored and noopener rel values');
HM_Test_Assertions::check(strpos($legacy_html, 'เว็บไซต์อาจได้รับค่าคอมมิชชัน') !== false, 'card discloses potential commission');
HM_Test_Assertions::check(strpos($legacy_html, 'hm-aff-price') === false && strpos($legacy_html, '฿999') === false, 'rendered cards never show legacy prices');

HM_Affiliate_Slots::rest_routes();
$collection = $GLOBALS['hm_routes'][HM_Affiliate_Slots::REST_NAMESPACE.'/products'];
HM_Test_Assertions::check(count($collection) === 2 && $collection[0]['methods'] === 'GET' && $collection[1]['methods'] === 'POST', 'collection registers list and create routes');
$resource = $GLOBALS['hm_routes'][HM_Affiliate_Slots::REST_NAMESPACE.'/products/(?P<id>[a-z0-9][a-z0-9_-]{0,63})'];
HM_Test_Assertions::check(count($resource) === 2 && $resource[0]['methods'] === 'GET' && $resource[1]['methods'] === 'PATCH', 'resource registers get and update routes');
HM_Test_Assertions::check(isset($GLOBALS['hm_routes'][HM_Affiliate_Slots::REST_NAMESPACE.'/config']), 'legacy config route remains registered');

$GLOBALS['hm_logged_in'] = false;
$unauthorized_before = HM_Affiliate_Slots::get_config();
$unauthorized = HM_Affiliate_Slots::rest_products_list(hm_request());
HM_Test_Assertions::check(is_wp_error($unauthorized) && hm_error_status($unauthorized) === 401, 'unauthenticated list is rejected');
$unauthorized_create = HM_Affiliate_Slots::rest_products_create(hm_request(hm_create_body('unauthorized-create', 'Unauthorized', 'https://s.shopee.co.th/unauthorized'), array('Idempotency-Key' => 'agent-run-unauthorized')));
HM_Test_Assertions::check(is_wp_error($unauthorized_create) && hm_error_status($unauthorized_create) === 401, 'unauthenticated create is rejected');
$unauthorized_update = HM_Affiliate_Slots::rest_products_update(hm_request(array('title' => 'Unauthorized edit'), array('If-Match' => HM_Affiliate_Slots::digest($unauthorized_before)), array('id' => 'legacy-product')));
HM_Test_Assertions::check(is_wp_error($unauthorized_update) && hm_error_status($unauthorized_update) === 401, 'unauthenticated update is rejected');
$GLOBALS['hm_logged_in'] = true;
$GLOBALS['hm_manage_options'] = false;
$insufficient = HM_Affiliate_Slots::rest_products_list(hm_request());
HM_Test_Assertions::check(is_wp_error($insufficient) && hm_error_status($insufficient) === 403, 'authenticated insufficient capability is rejected');
$insufficient_create = HM_Affiliate_Slots::rest_products_create(hm_request(hm_create_body('forbidden-create', 'Forbidden', 'https://s.shopee.co.th/forbidden'), array('Idempotency-Key' => 'agent-run-forbidden')));
HM_Test_Assertions::check(is_wp_error($insufficient_create) && hm_error_status($insufficient_create) === 403, 'insufficient capability cannot create products');
$insufficient_update = HM_Affiliate_Slots::rest_products_update(hm_request(array('title' => 'Forbidden edit'), array('If-Match' => HM_Affiliate_Slots::digest($unauthorized_before)), array('id' => 'legacy-product')));
HM_Test_Assertions::check(is_wp_error($insufficient_update) && hm_error_status($insufficient_update) === 403, 'insufficient capability cannot update products');
$GLOBALS['hm_manage_options'] = true;
HM_Test_Assertions::check(HM_Affiliate_Slots::get_config() === $unauthorized_before, 'unauthorized calls do not mutate config');

$missing_key = HM_Affiliate_Slots::rest_products_create(hm_request(hm_create_body('missing-key-product', 'Missing key', 'https://s.shopee.co.th/missing-key')));
HM_Test_Assertions::check(is_wp_error($missing_key) && hm_error_status($missing_key) === 400, 'create requires an idempotency key');
HM_Test_Assertions::check(HM_Affiliate_Slots::get_config() === $unauthorized_before, 'rejected requests do not mutate the saved configuration');

$travel_body = hm_create_body('travel-smart-glasses', 'แว่นตาอัจฉริยะสำหรับเดินทาง', 'https://s.shopee.co.th/1LgdBc2Osl', null, 100);
$key = 'agent-run-2026-10-18-01';
$created = HM_Affiliate_Slots::rest_products_create(hm_request($travel_body, array('Idempotency-Key' => $key)));
HM_Test_Assertions::check(HM_Test_Assertions::status($created) === 201, 'valid create returns HTTP 201');
$created_data = $created->get_data();
HM_Test_Assertions::check($created_data['draft'] === true && $created_data['public_output'] === false && $created_data['replayed'] === false, 'create response clearly says Draft and no public output');
$config_after_create = HM_Affiliate_Slots::get_config();
$travel = hm_find_item($config_after_create, 'travel-smart-glasses');
HM_Test_Assertions::check($travel['enabled'] === false && $travel['rights_confirmed'] === false && $travel['image_id'] === 0, 'create forces disabled product, unconfirmed image rights, and empty image');
HM_Test_Assertions::check($config_after_create['approval'] === null && $config_after_create['reviewed_digest'] === null && !HM_Affiliate_Slots::live_ready($config_after_create), 'draft create invalidates approval and closes the live gate');
HM_Test_Assertions::check($config_after_create['slots'] === $legacy_slots_before, 'create preserves legacy slot configuration and does not assign a placement');
HM_Test_Assertions::check($config_after_create['items'][0] === $legacy_item_before, 'create preserves the prior legacy product');
HM_Test_Assertions::check(get_option(HM_Affiliate_Slots::BACKUP_OPTION, null) === $legacy, 'create backs up the exact prior configuration');
HM_Test_Assertions::check(HM_Affiliate_Slots::shortcode(array('id' => 'home_after_feature')) === '', 'draft create cannot make public output appear');

$replay = HM_Affiliate_Slots::rest_products_create(hm_request($travel_body, array('Idempotency-Key' => $key)));
HM_Test_Assertions::check(HM_Test_Assertions::status($replay) === 200 && $replay->get_data()['replayed'] === true, 'same idempotency key and payload replays the same product');
HM_Test_Assertions::check(count(HM_Affiliate_Slots::get_config()['items']) === 2, 'replay does not create a duplicate record');
$conflicting_body = $travel_body;
$conflicting_body['title'] = 'Different title';
$reused_key = HM_Affiliate_Slots::rest_products_create(hm_request($conflicting_body, array('Idempotency-Key' => $key)));
HM_Test_Assertions::check(is_wp_error($reused_key) && hm_error_status($reused_key) === 409, 'same idempotency key with changed payload conflicts');
$duplicate_id = HM_Affiliate_Slots::rest_products_create(hm_request($travel_body, array('Idempotency-Key' => 'agent-run-2026-10-18-02')));
HM_Test_Assertions::check(is_wp_error($duplicate_id) && hm_error_status($duplicate_id) === 409, 'duplicate stable product ID with another key conflicts');

foreach (array(
    'http://s.shopee.co.th/product',
    'javascript:alert(1)',
    'https://evil.example/product',
    'https://user@s.shopee.co.th/product',
    'https://s.shopee.co.th:444/product',
    "https://s.shopee.co.th/product%0d%0a",
    'https://s.shopee.co.th/bad%url',
) as $bad_url) {
    HM_Test_Assertions::check(!HM_Affiliate_Slots::valid_affiliate_url($bad_url), 'reject unsafe affiliate URL '.$bad_url);
}
HM_Test_Assertions::check(HM_Affiliate_Slots::valid_affiliate_url('https://s.shopee.co.th/9pfBJUyV6m'), 'accept supported HTTPS Shopee URL');

$bad_image_body = hm_create_body('external-image-test', 'Image test', 'https://s.shopee.co.th/image-test', array('url' => 'https://images.example.test/photo.png'));
$bad_image = HM_Affiliate_Slots::rest_products_create(hm_request($bad_image_body, array('Idempotency-Key' => 'agent-run-2026-10-18-03')));
HM_Test_Assertions::check(is_wp_error($bad_image) && hm_error_status($bad_image) === 422, 'external image URL is rejected');
$bad_https_image_body = hm_create_body('bad-image-url-test', 'Bad image URL', 'https://s.shopee.co.th/image-test', array('url' => 'http://media.hybridmind.online/uploads/product.png'));
$bad_https_image = HM_Affiliate_Slots::rest_products_create(hm_request($bad_https_image_body, array('Idempotency-Key' => 'agent-run-2026-10-18-07')));
HM_Test_Assertions::check(is_wp_error($bad_https_image) && hm_error_status($bad_https_image) === 422, 'non-HTTPS image URL is rejected');
$bad_attachment_body = hm_create_body('bad-attachment-test', 'Bad attachment', 'https://s.shopee.co.th/image-test', array('attachment_id' => 999));
$bad_attachment = HM_Affiliate_Slots::rest_products_create(hm_request($bad_attachment_body, array('Idempotency-Key' => 'agent-run-2026-10-18-08')));
HM_Test_Assertions::check(is_wp_error($bad_attachment) && hm_error_status($bad_attachment) === 422, 'nonexistent attachment ID is rejected');
$bad_html_body = hm_create_body('html-test', '<script>alert(1)</script>', 'https://s.shopee.co.th/html-test');
$bad_html = HM_Affiliate_Slots::rest_products_create(hm_request($bad_html_body, array('Idempotency-Key' => 'agent-run-2026-10-18-04')));
HM_Test_Assertions::check(is_wp_error($bad_html) && hm_error_status($bad_html) === 422, 'HTML in product text is rejected');
$activation_body = $travel_body;
$activation_body['enabled'] = true;
$activation_body['id'] = 'activation-attempt';
$activation = HM_Affiliate_Slots::rest_products_create(hm_request($activation_body, array('Idempotency-Key' => 'agent-run-2026-10-18-05')));
HM_Test_Assertions::check(is_wp_error($activation) && hm_error_status($activation) === 422, 'create rejects activation fields');

$local_image_body = hm_create_body('local-image-test', 'Local image test', 'https://s.shopee.co.th/local-image', array('url' => 'https://media.hybridmind.online/uploads/product.png'), 300);
$local_image_created = HM_Affiliate_Slots::rest_products_create(hm_request($local_image_body, array('Idempotency-Key' => 'agent-run-2026-10-18-06')));
HM_Test_Assertions::check(HM_Test_Assertions::status($local_image_created) === 201, 'canonical HTTPS URL for local attachment is accepted');
$local_image_item = hm_find_item(HM_Affiliate_Slots::get_config(), 'local-image-test');
HM_Test_Assertions::check($local_image_item['image_id'] === 7 && !$local_image_item['rights_confirmed'], 'local image URL is stored as an unconfirmed attachment ID');

$list = HM_Affiliate_Slots::rest_products_list(hm_request());
HM_Test_Assertions::check(HM_Test_Assertions::status($list) === 200, 'authenticated list returns HTTP 200');
$list_data = $list->get_data();
HM_Test_Assertions::check(!array_key_exists('price', $list_data['items'][0]), 'product API projection contains no price field');
HM_Test_Assertions::check($list->get_headers()['Cache-Control'] === 'private, no-store', 'product API is not cached publicly');
$read_one = HM_Affiliate_Slots::rest_products_get(hm_request(array(), array(), array('id' => 'travel-smart-glasses')));
HM_Test_Assertions::check(HM_Test_Assertions::status($read_one) === 200, 'single product readback succeeds');
$not_found = HM_Affiliate_Slots::rest_products_get(hm_request(array(), array(), array('id' => 'missing-product')));
HM_Test_Assertions::check(is_wp_error($not_found) && hm_error_status($not_found) === 404, 'missing product returns HTTP 404');

$old_revision = $list_data['revision'];
$stale = HM_Affiliate_Slots::rest_products_update(hm_request(array('title' => 'Stale change'), array('If-Match' => str_repeat('0', 64)), array('id' => 'travel-smart-glasses')));
$stale_status = hm_error_status($stale);
HM_Test_Assertions::check(is_wp_error($stale) && $stale_status === 409, 'stale If-Match returns HTTP 409 (got '.$stale_status.', '.(is_wp_error($stale) ? $stale->get_error_code() : get_class($stale)).')');
$missing_precondition = HM_Affiliate_Slots::rest_products_update(hm_request(array('title' => 'No precondition'), array(), array('id' => 'travel-smart-glasses')));
HM_Test_Assertions::check(is_wp_error($missing_precondition) && hm_error_status($missing_precondition) === 428, 'missing update precondition returns HTTP 428');
$updated = HM_Affiliate_Slots::rest_products_update(hm_request(array('title' => 'แว่นตาสำหรับเดินทาง'), array('If-Match' => '"'.$old_revision.'"'), array('id' => 'travel-smart-glasses')));
HM_Test_Assertions::check(HM_Test_Assertions::status($updated) === 200, 'update with current If-Match succeeds');
$updated_data = $updated->get_data();
HM_Test_Assertions::check($updated_data['draft'] === true && $updated_data['public_output'] === false && $updated_data['product']['enabled'] === false, 'update remains disabled Draft');
HM_Test_Assertions::check($updated_data['revision'] !== $old_revision, 'update returns a new revision');
$stale_again = HM_Affiliate_Slots::rest_products_update(hm_request(array('title' => 'Concurrent overwrite'), array('If-Match' => '"'.$old_revision.'"'), array('id' => 'travel-smart-glasses')));
HM_Test_Assertions::check(is_wp_error($stale_again) && hm_error_status($stale_again) === 409, 'a second update cannot overwrite the newer revision');
$updated_config = HM_Affiliate_Slots::get_config();
HM_Test_Assertions::check($updated_config['approval'] === null && $updated_config['reviewed_digest'] === null && !HM_Affiliate_Slots::live_ready($updated_config), 'update keeps the public approval gate closed');

$changed_image_revision = $updated_data['revision'];
$image_update = HM_Affiliate_Slots::rest_products_update(hm_request(array('image' => array('attachment_id' => 7)), array('If-Match' => '"'.$changed_image_revision.'"'), array('id' => 'travel-smart-glasses')));
HM_Test_Assertions::check(HM_Test_Assertions::status($image_update) === 200, 'local attachment ID update succeeds');
HM_Test_Assertions::check($image_update->get_data()['product']['rights_confirmed'] === false, 'changing image never asserts owner rights');
$empty_api_price = strpos(json_encode($image_update->get_data()), 'price') === false;
HM_Test_Assertions::check($empty_api_price, 'product API responses never expose price fields');

// Simulate the owner approving the reviewed current revision after creation.
$owner_approved = HM_Affiliate_Slots::get_config();
foreach ($owner_approved['items'] as &$item) {
    if ($item['id'] === 'travel-smart-glasses') {
        $item['image_id'] = 7;
        $item['rights_confirmed'] = true;
        $item['enabled'] = true;
    }
}
unset($item);
$owner_approved['slots']['home_after_feature'] = array('enabled' => true, 'item_ids' => array('legacy-product', 'travel-smart-glasses'));
$owner_approved['approval'] = null;
$owner_approved['reviewed_digest'] = null;
$owner_approved = HM_Affiliate_Slots::validate_config($owner_approved);
$owner_approved['reviewed_digest'] = HM_Affiliate_Slots::digest($owner_approved);
$owner_approved['approval'] = array(
    'digest' => HM_Affiliate_Slots::digest($owner_approved),
    'user_id' => 1,
    'approved_at' => '2026-10-18T11:00:00+00:00',
    'domains_confirmed' => true,
);
HM_Test_Assertions::check(HM_Affiliate_Slots::live_ready($owner_approved), 'owner approval opens the live gate for the reviewed revision');
update_option(HM_Affiliate_Slots::OPTION, $owner_approved);
$approved_snapshot = get_option(HM_Affiliate_Slots::OPTION);
$approved_replay = HM_Affiliate_Slots::rest_products_create(hm_request($travel_body, array('Idempotency-Key' => $key)));
$approved_replay_data = $approved_replay->get_data();
HM_Test_Assertions::check(HM_Test_Assertions::status($approved_replay) === 200 && $approved_replay_data['replayed'] === true, 'same create key replays after owner approval');
HM_Test_Assertions::check($approved_replay_data['product']['status'] === 'approved' && $approved_replay_data['draft'] === false && $approved_replay_data['public_output'] === true, 'approved replay flags match the current product state');
HM_Test_Assertions::check(get_option(HM_Affiliate_Slots::OPTION) === $approved_snapshot, 'approved replay does not mutate product, slots or approval');

// A CAS can commit our draft, then a concurrent writer can change another field
// before readback. The pending receipt must recover on retry with the same key.
$race_body = hm_create_body('cas-race-product', 'CAS race recovery', 'https://s.shopee.co.th/cas-race', null, 900);
$race_key = 'agent-run-2026-10-18-cas-race';
$GLOBALS['hm_after_next_config_cas'] = true;
$race_first = HM_Affiliate_Slots::rest_products_create(hm_request($race_body, array('Idempotency-Key' => $race_key)));
HM_Test_Assertions::check(is_wp_error($race_first) && hm_error_status($race_first) === 409, 'concurrent post-CAS config change returns a create conflict');
$race_receipt_name = 'hm_affiliate_idem_'.hash('sha256', $race_key);
$pending_receipt = get_option($race_receipt_name, null);
HM_Test_Assertions::check(is_array($pending_receipt) && $pending_receipt['state'] === 'pending', 'possibly committed create keeps its pending idempotency receipt');
$items_after_race = HM_Affiliate_Slots::get_config()['items'];
HM_Test_Assertions::check(count(array_filter($items_after_race, function ($row) { return $row['id'] === 'cas-race-product'; })) === 1, 'first CAS attempt persisted one matching product');
$race_retry = HM_Affiliate_Slots::rest_products_create(hm_request($race_body, array('Idempotency-Key' => $race_key)));
HM_Test_Assertions::check(HM_Test_Assertions::status($race_retry) === 200 && $race_retry->get_data()['replayed'] === true, 'same-key retry recovers the possibly committed create');
$items_after_retry = HM_Affiliate_Slots::get_config()['items'];
HM_Test_Assertions::check(count($items_after_retry) === count($items_after_race) && count(array_filter($items_after_retry, function ($row) { return $row['id'] === 'cas-race-product'; })) === 1, 'recovered retry does not create a duplicate');
HM_Test_Assertions::check(get_option($race_receipt_name)['state'] === 'complete', 'recovery completes the idempotency receipt');

// Automatic placements are opt-in, do not alter stored content, and are bound to owner approval.
HM_Test_Assertions::check(HM_Affiliate_Slots::auto_placements() === HM_Affiliate_Slots::auto_placement_defaults(), 'automatic placement defaults are all disabled');
$homepage_html = '<div class="hm-v3"><div class="hm-v3-main"><section class="hero container"><p>Featured</p></section>' . "\n" . '<section class="section container" id="latest"><p>Latest</p></section></div></div>';
$homepage_content = hm_blocks_content(array(hm_block('core/html', $homepage_html)));
hm_set_content_context($homepage_content, true);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($homepage_content) === $homepage_content, 'automatic placement remains inactive by default');

$placement_save = HM_Affiliate_Slots::process_admin_action(array(
    '_wpnonce' => 'test-nonce',
    'hm_aff_action' => 'save_placements',
    'expected_placement_digest' => HM_Affiliate_Slots::placement_digest(),
    'auto_placements' => array('home_after_feature', 'article_after_intro', 'article_near_end'),
));
HM_Test_Assertions::check(!is_wp_error($placement_save) && HM_Affiliate_Slots::auto_placements()['home_after_feature'] === true, 'administrator can explicitly opt in to selected automatic positions');
$stale_placement_save = HM_Affiliate_Slots::process_admin_action(array('_wpnonce' => 'test-nonce', 'hm_aff_action' => 'save_placements', 'expected_placement_digest' => HM_Affiliate_Slots::placement_digest(HM_Affiliate_Slots::auto_placement_defaults()), 'auto_placements' => array()));
HM_Test_Assertions::check(is_wp_error($stale_placement_save) && HM_Affiliate_Slots::auto_placements()['home_after_feature'] === true, 'stale settings form cannot overwrite a newer placement selection');
$three_article_positions = HM_Affiliate_Slots::process_admin_action(array('_wpnonce' => 'test-nonce', 'hm_aff_action' => 'save_placements', 'expected_placement_digest' => HM_Affiliate_Slots::placement_digest(), 'auto_placements' => array('article_after_intro', 'article_middle', 'article_near_end')));
HM_Test_Assertions::check(is_wp_error($three_article_positions) && count(array_filter(HM_Affiliate_Slots::auto_placements(), function ($enabled, $id) { return in_array($id, HM_Affiliate_Slots::ARTICLE_PLACEMENT_IDS, true) && $enabled; }, ARRAY_FILTER_USE_BOTH)) === 2, 'admin settings reject three article positions instead of silently showing three');
HM_Test_Assertions::check(HM_Affiliate_Slots::get_config()['approval'] === null && HM_Affiliate_Slots::get_config()['reviewed_digest'] === null && !HM_Affiliate_Slots::live_ready(HM_Affiliate_Slots::get_config()), 'changing placements clears review and approval without enabling output');
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($homepage_content) === $homepage_content, 'automatic settings alone cannot activate public output');

$auto_approved = HM_Affiliate_Slots::get_config();
$auto_approved['slots']['home_after_feature'] = array('enabled' => true, 'item_ids' => array('legacy-product'));
$auto_approved['slots']['article_after_intro'] = array('enabled' => true, 'item_ids' => array('legacy-product'));
$auto_approved['slots']['article_near_end'] = array('enabled' => true, 'item_ids' => array('legacy-product'));
$auto_approved['approval'] = null;
$auto_approved['reviewed_digest'] = null;
$auto_approved = HM_Affiliate_Slots::validate_config($auto_approved);
$auto_approved['reviewed_digest'] = HM_Affiliate_Slots::digest($auto_approved);
$auto_approved['approval'] = array(
    'digest' => HM_Affiliate_Slots::digest($auto_approved),
    'user_id' => 1,
    'approved_at' => '2026-10-18T12:00:00+00:00',
    'domains_confirmed' => true,
    'placement_digest' => HM_Affiliate_Slots::placement_digest(),
);
update_option(HM_Affiliate_Slots::OPTION, $auto_approved);
HM_Test_Assertions::check(HM_Affiliate_Slots::live_ready(HM_Affiliate_Slots::get_config()), 'owner approval binds the exact automatic placement selection');

hm_set_content_context($homepage_content, true);
$homepage_inserted = HM_Affiliate_Slots::filter_auto_placements($homepage_content);
$hero_close = strpos($homepage_inserted, '</section>');
$home_shortcode = strpos($homepage_inserted, '[hm_affiliate_slot id="home_after_feature"]');
$latest_section = strpos($homepage_inserted, '<section class="section container" id="latest"');
HM_Test_Assertions::check($home_shortcode !== false && $hero_close < $home_shortcode && $home_shortcode < $latest_section, 'homepage shortcode is inserted after Featured and before #latest at the exact safe boundary');
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($homepage_inserted) === $homepage_inserted, 'existing shortcode prevents duplicate homepage insertion');
$unsafe_home_html = '<div><section class="hero container"><p>Featured</p></section><div id="latest">Changed boundary</div></div>';
$unsafe_home = hm_blocks_content(array(hm_block('core/html', $unsafe_home_html)));
hm_set_content_context($unsafe_home, true);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($unsafe_home) === $unsafe_home, 'homepage markup without the exact verified boundary is left untouched');

$short_article = hm_blocks_content(hm_paragraph_blocks(5, 25));
hm_set_content_context($short_article, false);
$short_article_output = HM_Affiliate_Slots::filter_auto_placements($short_article);
HM_Test_Assertions::check(substr_count($short_article_output, '[hm_affiliate_slot id="article_after_intro"]') === 1 && strpos($short_article_output, '[hm_affiliate_slot id="article_near_end"]') === false, 'short article receives only the safe after-intro placement');
$spaced_article = hm_conventional_blocks_content(hm_paragraph_blocks(5, 25));
$spaced_parsed_blocks = parse_blocks($spaced_article);
$blank_freeform_count = count(array_filter($spaced_parsed_blocks, function ($block) { return is_array($block) && array_key_exists('blockName', $block) && $block['blockName'] === null && isset($block['innerHTML']) && is_string($block['innerHTML']) && trim($block['innerHTML']) === ''; }));
HM_Test_Assertions::check($blank_freeform_count >= 4, 'WordPress block parser preserves conventional blank lines as freeform blocks');
hm_set_content_context($spaced_article, false);
$spaced_article_output = HM_Affiliate_Slots::filter_auto_placements($spaced_article);
HM_Test_Assertions::check(substr_count($spaced_article_output, '[hm_affiliate_slot id="article_after_intro"]') === 1, 'intro insertion crosses only blank freeform blocks between paragraphs');
$thin_article = hm_blocks_content(hm_paragraph_blocks(5, 12));
hm_set_content_context($thin_article, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($thin_article) === $thin_article, 'intro placement skips a short or insubstantial target paragraph');

$long_article = hm_blocks_content(hm_paragraph_blocks(8, 80));
hm_set_content_context($long_article, false);
$long_article_output = HM_Affiliate_Slots::filter_auto_placements($long_article);
HM_Test_Assertions::check(substr_count($long_article_output, '[hm_affiliate_slot id="article_after_intro"]') === 1 && substr_count($long_article_output, '[hm_affiliate_slot id="article_near_end"]') === 1, 'long article receives at most one intro and one near-end unit');
$spaced_long_article = hm_conventional_blocks_content(hm_paragraph_blocks(8, 80));
hm_set_content_context($spaced_long_article, false);
$spaced_long_output = HM_Affiliate_Slots::filter_auto_placements($spaced_long_article);
HM_Test_Assertions::check(substr_count($spaced_long_output, '[hm_affiliate_slot id="article_after_intro"]') === 1 && substr_count($spaced_long_output, '[hm_affiliate_slot id="article_near_end"]') === 1, 'near-end insertion crosses only blank freeform blocks in conventional long Gutenberg content');

$thai_short_article = hm_conventional_blocks_content(hm_thai_paragraph_blocks(8, 160));
hm_set_content_context($thai_short_article, false);
$thai_short_output = HM_Affiliate_Slots::filter_auto_placements($thai_short_article);
HM_Test_Assertions::check(substr_count($thai_short_output, '[hm_affiliate_slot id="article_after_intro"]') === 1 && strpos($thai_short_output, '[hm_affiliate_slot id="article_near_end"]') === false, 'Thai text uses grapheme length for paragraph suitability and stays below the long-article threshold');
$thai_long_article = hm_conventional_blocks_content(hm_thai_paragraph_blocks(8, 320));
hm_set_content_context($thai_long_article, false);
$thai_long_output = HM_Affiliate_Slots::filter_auto_placements($thai_long_article);
HM_Test_Assertions::check(substr_count($thai_long_output, '[hm_affiliate_slot id="article_after_intro"]') === 1 && substr_count($thai_long_output, '[hm_affiliate_slot id="article_near_end"]') === 1, 'Thai long-article threshold uses grapheme clusters rather than whitespace word counts');

$explicit_article = hm_blocks_content(array_merge(hm_paragraph_blocks(8, 80), array(hm_block('core/shortcode', '[hm_affiliate_slot id="article_after_intro"]'))));
hm_set_content_context($explicit_article, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($explicit_article) === $explicit_article, 'existing explicit shortcode prevents all automatic article duplicates');

$unsupported_article = hm_blocks_content(array_merge(hm_paragraph_blocks(8, 80), array(hm_block('core/embed', '<figure>embed</figure>'))));
hm_set_content_context($unsupported_article, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($unsupported_article) === $unsupported_article, 'unsupported embed content is left untouched');

$heading_article = hm_blocks_content(array_merge(array_slice(hm_paragraph_blocks(5), 0, 3), array(hm_block('core/heading', '<h2>Section</h2>')), array_slice(hm_paragraph_blocks(5), 3)));
hm_set_content_context($heading_article, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($heading_article) === $heading_article, 'article insertion skips a heading boundary');
$table_article = hm_blocks_content(array_merge(array_slice(hm_paragraph_blocks(5), 0, 3), array(hm_block('core/table', '<figure class="wp-block-table"><table><tbody><tr><td>Data</td></tr></tbody></table></figure>')), array_slice(hm_paragraph_blocks(5), 3)));
hm_set_content_context($table_article, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($table_article) === $table_article, 'article insertion skips a table boundary');

$middle_placements = array('home_after_feature' => false, 'article_after_intro' => false, 'article_middle' => true, 'article_near_end' => true);
update_option(HM_Affiliate_Slots::AUTO_OPTION, $middle_placements);
$middle_approved = $auto_approved;
$middle_approved['approval'] = null;
$middle_approved['reviewed_digest'] = null;
$middle_approved['reviewed_digest'] = HM_Affiliate_Slots::digest($middle_approved);
$middle_approved['approval'] = array('digest' => HM_Affiliate_Slots::digest($middle_approved), 'user_id' => 1, 'approved_at' => '2026-10-18T12:02:00+00:00', 'domains_confirmed' => true, 'placement_digest' => HM_Affiliate_Slots::placement_digest());
update_option(HM_Affiliate_Slots::OPTION, $middle_approved);
HM_Test_Assertions::check(HM_Affiliate_Slots::live_ready(HM_Affiliate_Slots::get_config()) && HM_Affiliate_Slots::auto_placements()['article_middle'] && HM_Affiliate_Slots::auto_placements()['article_near_end'], 'owner-approved midpoint plus near-end is an explicit two-position configuration');

$site_paragraphs = hm_thai_paragraph_blocks(12, 320);
$site_group_children = array(hm_block('core/html', '<style>#hm-scenegraph-article{line-height:1.85}</style>'));
foreach ($site_paragraphs as $index => $paragraph) {
    $site_group_children[] = $paragraph;
    if ($index === 1) {
        $site_group_children[] = hm_block('core/heading', '<h2>Topic section</h2>');
    }
    if ($index === 3) {
        $site_group_children[] = hm_block('core/image', '<figure class="wp-block-image"><img src="https://media.hybridmind.online/uploads/article.png" alt=""></figure>');
    }
    if ($index === 7) {
        $site_group_children[] = hm_block('core/table', '<figure class="wp-block-table"><table><tbody><tr><td>Data</td></tr></tbody></table></figure>');
    }
}
$site_group_content = hm_blocks_content(array(hm_group_block($site_group_children, array('anchor' => 'hm-scenegraph-article', 'layout' => array('type' => 'constrained')))));
$site_group_parsed = parse_blocks($site_group_content);
HM_Test_Assertions::check(isset($site_group_parsed[0]['blockName']) && $site_group_parsed[0]['blockName'] === 'core/group' && count($site_group_parsed[0]['innerBlocks']) >= 15, 'WordPress parser fixture matches the site article Group wrapper with nested blocks');
hm_set_content_context($site_group_content, false);
$middle_card = HM_Affiliate_Slots::shortcode(array('id' => 'article_middle'));
HM_Test_Assertions::check(strpos($middle_card, 'hm-aff-slot-article_middle') !== false && strpos($middle_card, 'Legacy product') !== false, 'midpoint presentation reuses the existing article-after-intro product bank');
$site_group_output = HM_Affiliate_Slots::filter_auto_placements($site_group_content);
$middle_marker = strpos($site_group_output, '[hm_affiliate_slot id="article_middle"]');
$near_marker = strpos($site_group_output, '[hm_affiliate_slot id="article_near_end"]');
$p6_marker = strpos($site_group_output, 'Thai paragraph 6');
$p7_marker = strpos($site_group_output, 'Thai paragraph 7');
$p11_marker = strpos($site_group_output, 'Thai paragraph 11');
$p12_marker = strpos($site_group_output, 'Thai paragraph 12');
$parsed_site_output = parse_blocks($site_group_output);
$site_output_names = hm_flatten_block_names($parsed_site_output);
HM_Test_Assertions::check(substr_count($site_group_output, '[hm_affiliate_slot id="article_middle"]') === 1 && substr_count($site_group_output, '[hm_affiliate_slot id="article_near_end"]') === 1 && substr_count($site_group_output, '[hm_affiliate_slot id="article_after_intro"]') === 0, 'wrapped Thai article gets exactly the selected midpoint and near-end units');
HM_Test_Assertions::check($p6_marker < $middle_marker && $middle_marker < $p7_marker && $p11_marker < $near_marker && $near_marker < $p12_marker, 'midpoint uses the measured text center and near-end remains after the penultimate paragraph');
HM_Test_Assertions::check(count(array_filter($site_output_names, function ($name) { return $name === 'core/shortcode'; })) === 2 && strpos($site_group_output, 'anchor') !== false && substr_count($site_group_output, 'Thai paragraph 1</p>') === 1 && substr_count($site_group_output, '<table>') === 1 && substr_count($site_group_output, '<img ') === 1, 'nested insertion stays in separate Shortcode blocks and preserves the Group, image, table, and paragraph markup');

$custom_html_wrapper = hm_blocks_content(array(hm_block('core/html', '<div class="wp-block-group" id="hm-scenegraph-article">'.implode('', array_map(function ($paragraph) { return $paragraph['innerHTML']; }, $site_paragraphs)).'</div>')));
hm_set_content_context($custom_html_wrapper, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($custom_html_wrapper) === $custom_html_wrapper, 'arbitrary Custom HTML article wrappers remain opaque and fail closed');

$GLOBALS['hm_is_admin'] = true;
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($short_article) === $short_article, 'automatic placement is excluded from admin content');
$GLOBALS['hm_is_admin'] = false;
$GLOBALS['hm_password_required'] = true;
HM_Test_Assertions::check(HM_Affiliate_Slots::filter_auto_placements($short_article) === $short_article, 'password-protected article content is left untouched');
$GLOBALS['hm_password_required'] = false;

$disabled_auto_slot = HM_Affiliate_Slots::get_config();
$disabled_auto_slot['slots']['article_after_intro'] = array('enabled' => false, 'item_ids' => array());
$disabled_auto_slot['approval'] = null;
$disabled_auto_slot = HM_Affiliate_Slots::validate_config($disabled_auto_slot);
$disabled_auto_slot['reviewed_digest'] = HM_Affiliate_Slots::digest($disabled_auto_slot);
$disabled_auto_slot['approval'] = array('digest' => HM_Affiliate_Slots::digest($disabled_auto_slot), 'user_id' => 1, 'approved_at' => '2026-10-18T12:01:00+00:00', 'domains_confirmed' => true, 'placement_digest' => HM_Affiliate_Slots::placement_digest());
update_option(HM_Affiliate_Slots::OPTION, $disabled_auto_slot);
hm_set_content_context($short_article, false);
HM_Test_Assertions::check(HM_Affiliate_Slots::live_ready(HM_Affiliate_Slots::get_config()) && HM_Affiliate_Slots::filter_auto_placements($short_article) === $short_article, 'disabled slot stays empty even when another approved slot keeps the gate live');

update_option(HM_Affiliate_Slots::OPTION, $auto_approved);
$legacy_shortcode_approval = $auto_approved;
unset($legacy_shortcode_approval['approval']['placement_digest']);
update_option(HM_Affiliate_Slots::OPTION, $legacy_shortcode_approval);
update_option(HM_Affiliate_Slots::AUTO_OPTION, HM_Affiliate_Slots::auto_placement_defaults());
$legacy_after_upgrade = HM_Affiliate_Slots::get_config();
HM_Test_Assertions::check(HM_Affiliate_Slots::live_ready($legacy_after_upgrade), 'legacy explicit-shortcode approval remains valid when automatic placements default off');
update_option(HM_Affiliate_Slots::AUTO_OPTION, array('home_after_feature' => true, 'article_after_intro' => false, 'article_near_end' => false));
HM_Test_Assertions::check(!HM_Affiliate_Slots::live_ready(HM_Affiliate_Slots::get_config()), 'changing placement flags without matching approval closes the live gate');
$preserved_config_before_activation = get_option(HM_Affiliate_Slots::OPTION);
$preserved_placements_before_activation = get_option(HM_Affiliate_Slots::AUTO_OPTION);
HM_Affiliate_Slots::activate();
HM_Test_Assertions::check(get_option(HM_Affiliate_Slots::OPTION) === $preserved_config_before_activation && get_option(HM_Affiliate_Slots::AUTO_OPTION) === $preserved_placements_before_activation, 'activation does not overwrite existing product or placement configuration');

echo 'PASS '.HM_Test_Assertions::$count." assertions\n";

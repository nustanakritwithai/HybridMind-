<?php
define('ABSPATH', __DIR__);

$hm_options = array();
$hm_routes = array();
$hm_logged_in = true;
$hm_manage_options = true;
$hm_front_page = true;
$hm_attachments = array(
    7 => array('mime' => 'image/png', 'url' => 'https://media.hybridmind.online/uploads/product.png'),
);

function add_action() {}
function add_shortcode() {}
function register_activation_hook() {}
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
function is_feed() { return false; }
function is_preview() { return false; }
function is_front_page() { return $GLOBALS['hm_front_page']; }
function is_singular($post_type = 'post') { return false; }
function get_queried_object_id() { return 16; }
function get_post($id) { return (object) array('post_content' => ''); }
function is_wp_error($value) { return $value instanceof WP_Error; }

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

HM_Affiliate_Slots::activate();
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
HM_Test_Assertions::check(is_wp_error($stale) && hm_error_status($stale) === 409, 'stale If-Match returns HTTP 409');
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

echo 'PASS '.HM_Test_Assertions::$count." assertions\n";

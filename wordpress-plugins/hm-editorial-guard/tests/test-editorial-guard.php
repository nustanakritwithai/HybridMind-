<?php
// Standalone PHP test doubles; no WordPress installation is required.
const ABSPATH = '/fake-wordpress/';
class WP_Error {
    public $code;
    public $message;
    public $data;
    public function __construct( $code, $message, $data = array() ) { $this->code = $code; $this->message = $message; $this->data = $data; }
}
class WP_REST_Request {
    private $params;
    public function __construct( $params ) { $this->params = $params; }
    public function get_param( $key ) { return array_key_exists( $key, $this->params ) ? $this->params[$key] : null; }
}
function absint( $x ) { return abs( (int) $x ); }
function is_wp_error( $x ) { return $x instanceof WP_Error; }
function add_filter() {}
function add_action() {}
function get_post( $id ) { return $GLOBALS['posts'][$id] ?? null; }
function wp_get_post_categories( $id ) { return $GLOBALS['categories'][$id] ?? array(); }
function wp_get_post_tags( $id, $args = array() ) { return $GLOBALS['tags'][$id] ?? array(); }
function get_term( $id, $taxonomy ) { return isset($GLOBALS['category_terms'][$id]) ? (object) array('slug'=>$GLOBALS['category_terms'][$id]) : null; }
function term_exists( $id, $taxonomy ) { return in_array( (int) $id, $GLOBALS['allowed_tags'], true ) ? array( 'term_id' => $id ) : null; }
require dirname( __DIR__ ) . '/hm-editorial-guard.php';

$GLOBALS['posts'] = array( 10 => (object) array( 'post_status' => 'publish' ), 11 => (object) array( 'post_status' => 'draft' ), 12 => (object) array( 'post_status' => 'future' ) );
$GLOBALS['categories'] = array( 10 => array( 42 ), 11 => array( 42 ), 12 => array( 42 ) );
$GLOBALS['tags'] = array( 10 => array(), 11 => array( 55 ), 12 => array() );
$GLOBALS['category_terms'] = array( 42 => 'ai-news', 43 => 'explained', 1 => 'uncategorized' );
$GLOBALS['allowed_tags'] = array( 55, 56 );

$tests = array(
  'draft with two categories allowed' => array( array( 'status' => 'draft', 'categories' => array( 42, 43 ) ), null ),
  'new public missing category blocked' => array( array( 'status' => 'publish' ), 'hmeg_one_category_required' ),
  'new public two categories blocked' => array( array( 'status' => 'publish', 'categories' => array( 42, 43 ) ), 'hmeg_one_category_required' ),
  'new public one category allowed' => array( array( 'status' => 'publish', 'categories' => array( 42 ), 'tags' => array( 55 ) ), null ),
  'scheduled public one category allowed' => array( array( 'status' => 'future', 'categories' => array( 43 ) ), null ),
  'new private two categories blocked' => array( array( 'status' => 'private', 'categories' => array( 42, 43 ) ), 'hmeg_one_category_required' ),
  'uncategorized blocked' => array( array( 'status' => 'publish', 'categories' => array( 1 ) ), 'hmeg_invalid_category' ),
  'bad category blocked' => array( array( 'status' => 'publish', 'categories' => array( 999 ) ), 'hmeg_invalid_category' ),
  'existing published unrelated update allowed' => array( array( 'id' => 10, 'title' => 'Improve an article' ), null ),
  'existing published new duplicate categories blocked' => array( array( 'id' => 10, 'categories' => array( 42, 43 ) ), 'hmeg_one_category_required' ),
  'existing published category replacement allowed' => array( array( 'id' => 10, 'categories' => array( 43 ) ), null ),
  'draft to published inherits category' => array( array( 'id' => 11, 'status' => 'publish', 'tags' => array( 55 ) ), null ),
  'invalid tag blocked' => array( array( 'status' => 'publish', 'categories' => array( 42 ), 'tags' => array( 999 ) ), 'hmeg_unknown_tag' ),
  'too many tags blocked' => array( array( 'status' => 'publish', 'categories' => array( 42 ), 'tags' => array( 55,56,57,58,59 ) ), 'hmeg_tag_count' ),
  'tagless new post allowed in transition mode' => array( array( 'status' => 'publish', 'categories' => array( 42 ) ), null ),
  'existing scheduled edit allowed' => array( array( 'id' => 12, 'title' => 'Fix typo' ), null ),
  'existing published clearing category blocked' => array( array( 'id' => 10, 'categories' => array() ), 'hmeg_one_category_required' ),
);
$ok = 0;
foreach ($tests as $name => $row) {
    $result = hmeg_validate_rest_post( (object) array( 'post_status' => $row[0]['status'] ?? 'draft' ), new WP_REST_Request( $row[0] ) );
    $got = $result instanceof WP_Error ? $result->code : null;
    if ( $got !== $row[1] ) { fwrite(STDERR, "FAIL $name: expected " . var_export($row[1], true) . " got " . var_export($got, true) . "\n" ); exit(1); }
    $ok++;
}
echo "PASS $ok/$ok standalone tests\n";

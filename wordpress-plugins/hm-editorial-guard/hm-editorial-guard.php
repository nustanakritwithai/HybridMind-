<?php
/**
 * Plugin Name: Hybrid Mind Editorial Guard
 * Description: Validate the primary category of posts before WordPress REST API publishing.
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: Hybrid Mind
 * License: GPL-2.0-or-later
 * Text Domain: hybrid-mind-editorial-guard
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Guard only wp/v2 POST records, not pages, comments, wp-admin changes or plugin-specific APIs.
 * The hook is triggered before the WordPress REST controller writes the record.
 *
 * @param stdClass|WP_Error $prepared_post Prepared post.
 * @param WP_REST_Request   $request       Incoming REST request.
 * @return stdClass|WP_Error
 */
function hmeg_validate_rest_post( $prepared_post, $request ) {
    if ( is_wp_error( $prepared_post ) ) {
        return $prepared_post;
    }

    if ( ! $request instanceof WP_REST_Request ) {
        return $prepared_post;
    }

    $post_id  = absint( $request->get_param( 'id' ) );
    $existing = $post_id ? get_post( $post_id ) : null;
    $old_status = $existing ? $existing->post_status : 'draft';
    $status_arg = $request->get_param( 'status' );
    $new_status = null !== $status_arg
        ? (string) $status_arg
        : ( $existing ? $existing->post_status : ( isset( $prepared_post->post_status ) ? $prepared_post->post_status : 'draft' ) );

    // Saving or changing a draft remains unrestricted. The editorial team can prepare it safely.
    if ( ! in_array( $new_status, array( 'publish', 'future', 'private' ), true ) ) {
        return $prepared_post;
    }

    // An update to an already published article must remain possible when no taxonomy changes.
    // Validate a new/scheduled publication or any explicit category change to a live post.
    $publishing_now = ! $existing || ! in_array( $old_status, array( 'publish', 'future', 'private' ), true );
    $categories_arg = $request->get_param( 'categories' );
    $tags_arg       = $request->get_param( 'tags' );

    if ( $publishing_now || null !== $categories_arg ) {
        if ( null !== $categories_arg ) {
            if ( ! is_array( $categories_arg ) ) {
                return new WP_Error( 'hmeg_invalid_categories', 'Categories must be an array containing exactly one category ID.', array( 'status' => 400 ) );
            }
            $categories = $categories_arg;
        } else {
            $categories = $existing ? wp_get_post_categories( $post_id ) : array();
        }

        $categories = array_values( array_unique( array_map( 'absint', $categories ) ) );
        if ( 1 !== count( $categories ) || $categories[0] <= 0 ) {
            return new WP_Error( 'hmeg_one_category_required', 'Select exactly one primary category before publishing this article.', array( 'status' => 400 ) );
        }

        $term = get_term( $categories[0], 'category' );
        if ( ! $term || is_wp_error( $term ) || 'uncategorized' === $term->slug ) {
            return new WP_Error( 'hmeg_invalid_category', 'The primary category must exist and cannot be Uncategorized.', array( 'status' => 400 ) );
        }
    }

    // Curated tags are checked when supplied; this does not block old tagless articles.
    if ( null !== $tags_arg ) {
        if ( ! is_array( $tags_arg ) ) {
            return new WP_Error( 'hmeg_invalid_tags', 'Tags must be an array of existing tag IDs.', array( 'status' => 400 ) );
        }
        $tag_ids = array_values( array_unique( array_map( 'absint', $tags_arg ) ) );
        if ( count( $tag_ids ) > 4 || in_array( 0, $tag_ids, true ) ) {
            return new WP_Error( 'hmeg_tag_count', 'Select at most four existing topic tags.', array( 'status' => 400 ) );
        }
        foreach ( $tag_ids as $tag_id ) {
            if ( ! term_exists( $tag_id, 'post_tag' ) ) {
                return new WP_Error( 'hmeg_unknown_tag', 'Use an existing, approved topic tag ID.', array( 'status' => 400 ) );
            }
        }
    }

    // Strict minimum is opt-in. Leave it false while the existing newsroom migrates.
    if ( $publishing_now && defined( 'HMEG_REQUIRE_TAGS' ) && HMEG_REQUIRE_TAGS ) {
        $effective_tags = null !== $tags_arg ? $tags_arg : ( $existing ? wp_get_post_tags( $post_id, array( 'fields' => 'ids' ) ) : array() );
        if ( ! is_array( $effective_tags ) || count( array_unique( array_map( 'absint', $effective_tags ) ) ) < 1 ) {
            return new WP_Error( 'hmeg_tags_required', 'Add one to four curated topic tags before publishing.', array( 'status' => 400 ) );
        }
    }

    return $prepared_post;
}
add_filter( 'rest_pre_insert_post', 'hmeg_validate_rest_post', 10, 2 );

// Private readback endpoint for rollout verification. Does not alter posts or user permissions.
add_action( 'rest_api_init', function () {
    register_rest_route( 'hm-editorial-guard/v1', '/status', array(
        'methods'             => 'GET',
        'permission_callback' => function () { return current_user_can( 'manage_options' ); },
        'callback'            => function () {
            return array(
                'version'           => '0.1.0',
                'scope'             => 'REST posts only',
                'one_category_gate' => true,
                'require_tags'      => defined( 'HMEG_REQUIRE_TAGS' ) && HMEG_REQUIRE_TAGS,
            );
        },
    ) );
} );

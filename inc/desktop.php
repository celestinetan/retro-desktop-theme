<?php
/**
 * Builds the desktop icons from WordPress content.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Prints one icon. A link when it has an address, a button otherwise.
 *
 * @param array $item label, icon, url, thumb, attrs.
 */
function platinum_the_icon( $item ) {
	$label = isset( $item['label'] ) ? $item['label'] : '';
	$class = 'icon' . ( empty( $item['class'] ) ? '' : ' ' . $item['class'] );
	$art   = empty( $item['thumb'] )
		? platinum_icon( isset( $item['icon'] ) ? $item['icon'] : 'doc' )
		: '<span class="ico ico-thumb">' . $item['thumb'] . '</span>';

	$attrs = '';
	if ( ! empty( $item['attrs'] ) ) {
		foreach ( $item['attrs'] as $key => $value ) {
			$attrs .= ' ' . esc_attr( $key ) . '="' . esc_attr( $value ) . '"';
		}
	}

	$inner = $art . '<span class="icon-label">' . esc_html( $label ) . '</span>';

	if ( ! empty( $item['url'] ) ) {
		echo '<a class="' . esc_attr( $class ) . '" href="' . esc_url( $item['url'] ) . '"' . $attrs . '>' . $inner . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
	} else {
		echo '<button type="button" class="' . esc_attr( $class ) . '"' . $attrs . '>' . $inner . '</button>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}

/**
 * The folders: one per project type, in the order they were created.
 *
 * @return array
 */
function platinum_folder_items() {
	$items = array();
	$terms = get_terms(
		array(
			'taxonomy'   => PLATINUM_TAX,
			'hide_empty' => false,
			'parent'     => 0,
			'orderby'    => 'term_id',
			'order'      => 'ASC',
		)
	);
	if ( is_wp_error( $terms ) ) {
		return $items;
	}
	foreach ( $terms as $term ) {
		$link = get_term_link( $term );
		if ( is_wp_error( $link ) ) {
			continue;
		}
		$items[] = array(
			'label' => $term->name,
			'icon'  => 'folder',
			'url'   => $link,
			'attrs' => array( 'data-term' => (string) $term->term_id ),
		);
	}
	return $items;
}

/**
 * Every folder, each followed by the folders inside it, with its path
 * ("Creative › Zines") and its parent. Used by the owner's tools.
 *
 * @return array List of id, name, path, parent.
 */
function platinum_folder_tree() {
	$terms = get_terms(
		array(
			'taxonomy'   => PLATINUM_TAX,
			'hide_empty' => false,
			'orderby'    => 'name',
			'order'      => 'ASC',
		)
	);
	if ( is_wp_error( $terms ) ) {
		return array();
	}
	$by_parent = array();
	foreach ( $terms as $term ) {
		$by_parent[ (int) $term->parent ][] = $term;
	}
	if ( isset( $by_parent[0] ) ) {
		usort(
			$by_parent[0],
			function ( $a, $b ) {
				return $a->term_id - $b->term_id; // Top level in the desktop's order.
			}
		);
	}
	$out  = array();
	$walk = function ( $parent, $path ) use ( &$walk, &$out, $by_parent ) {
		if ( empty( $by_parent[ $parent ] ) ) {
			return;
		}
		foreach ( $by_parent[ $parent ] as $term ) {
			$name  = $path ? $path . ' › ' . $term->name : $term->name;
			$out[] = array(
				'id'     => (int) $term->term_id,
				'name'   => $name,
				'parent' => (int) $term->parent,
			);
			if ( count( $out ) < 500 ) {
				$walk( (int) $term->term_id, $name );
			}
		}
	};
	$walk( 0, '' );
	return $out;
}

/**
 * Picks an icon for a page from its address.
 *
 * @param string $slug Page slug.
 * @return string
 */
function platinum_page_icon( $slug ) {
	if ( false !== strpos( $slug, 'contact' ) ) {
		return 'mail';
	}
	if ( 0 === strpos( $slug, 'links' ) ) {
		return 'globe';
	}
	if ( 'cv' === $slug || false !== strpos( $slug, 'resume' ) || false !== strpos( $slug, 'curriculum' ) ) {
		return 'cv';
	}
	return 'doc';
}

/**
 * Every published top-level page becomes a document on the desktop.
 * The pages that feed the Trash and the Music player are left out.
 *
 * @return array
 */
function platinum_page_items() {
	$items = array();
	$pages = get_pages(
		array(
			'parent'      => 0,
			'sort_column' => 'menu_order,post_title',
			'post_status' => 'publish',
		)
	);
	if ( ! $pages ) {
		return $items;
	}
	$front = (int) get_option( 'page_on_front' );
	$blog  = (int) get_option( 'page_for_posts' );
	foreach ( $pages as $page ) {
		if ( 0 === strpos( $page->post_name, 'trash' ) || 0 === strpos( $page->post_name, 'playlist' ) || $page->ID === $front || $page->ID === $blog ) {
			continue;
		}
		$item = array(
			'label' => get_the_title( $page ),
			'icon'  => platinum_page_icon( $page->post_name ),
			'url'   => get_permalink( $page ),
		);
		// For the owner, so a desktop document can be edited or dragged to the Trash.
		if ( platinum_can_write() ) {
			$item['attrs'] = array(
				'data-id'   => (string) $page->ID,
				'data-rest' => platinum_rest_base( 'page' ),
			);
		}
		$items[] = $item;
	}
	return $items;
}

/**
 * Prints the whole desktop icon list.
 */
function platinum_the_desktop_icons() {
	// The order a visitor reads them in: what to read first (Read Me, CV),
	// the folders, Notes and Music, and the way to write to you last.
	$documents = array();
	$contact   = array();
	foreach ( platinum_page_items() as $page_item ) {
		if ( 'mail' === $page_item['icon'] ) {
			$contact[] = $page_item;
		} else {
			$documents[] = $page_item;
		}
	}
	$items   = array_merge( $documents, platinum_folder_items() );
	$items[] = array(
		'label' => __( 'Notes', 'platinum' ),
		'icon'  => 'notes',
		'url'   => home_url( '/notes/' ),
	);
	if ( platinum_playlist() ) {
		$items[] = array(
			'label' => __( 'My Music', 'platinum' ),
			'icon'  => 'music',
			'url'   => home_url( '/music/' ),
		);
	}
	$items = array_merge( $items, $contact );

	foreach ( $items as $item ) {
		platinum_the_icon( $item );
	}

	platinum_the_icon(
		array(
			'label' => __( 'Trash', 'platinum' ),
			'icon'  => 'trash',
			'url'   => home_url( '/trash/' ),
			'class' => 'icon--trash',
		)
	);
}

/**
 * The joke files in the Trash.
 *
 * Taken from a page whose address is "trash-files" (or starts with "trash"):
 * every list item written as "file name: message" becomes a file.
 * Without such a page, three defaults are shown.
 *
 * @return array of [ name, message ]
 */
function platinum_trash_files() {
	$files = array();
	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => array( 'publish', 'private' ),
			'posts_per_page' => 20,
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	foreach ( $pages as $page ) {
		if ( 0 !== strpos( $page->post_name, 'trash' ) ) {
			continue;
		}
		if ( preg_match_all( '#<li[^>]*>(.*?)</li>#is', $page->post_content, $found ) ) {
			foreach ( $found[1] as $line ) {
				$line  = trim( wp_strip_all_tags( $line ) );
				$parts = explode( ':', $line, 2 );
				if ( '' === $parts[0] ) {
					continue;
				}
				$files[] = array(
					trim( $parts[0] ),
					isset( $parts[1] ) && '' !== trim( $parts[1] ) ? trim( $parts[1] ) : __( 'This file cannot be opened.', 'platinum' ),
				);
			}
		}
		break;
	}

	if ( $files ) {
		return $files;
	}

	return array(
		array( 'passwords.txt', __( 'Nice try. This one stays closed.', 'platinum' ) ),
		array( 'five-year-plan-v9-final.doc', __( 'This plan was replaced by a better one. Then another.', 'platinum' ) ),
		array( 'unsent-ideas.txt', __( 'Still thinking about these. Ask me in person.', 'platinum' ) ),
	);
}

/**
 * The playlists for the Music player.
 *
 * Taken from a page whose address starts with "playlist": every YouTube
 * link on it (a playlist or a single video) is one entry. An embed's caption
 * is used as its name; without one it is called "Playlist 1", "Playlist 2"…
 * With no such page, or no YouTube links on it, the player is not offered.
 *
 * @return array of [ title, embed address, YouTube address ]
 */
function platinum_playlist() {
	static $lists = null;
	if ( null !== $lists ) {
		return $lists;
	}
	$lists = array();
	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => array( 'publish', 'private' ),
			'posts_per_page' => 50,
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	foreach ( $pages as $page ) {
		if ( 0 !== strpos( $page->post_name, 'playlist' ) ) {
			continue;
		}
		$content = $page->post_content;
		$found   = array();
		$seen    = array();

		// Embed blocks first, so their captions can be used as names.
		if ( preg_match_all( '#<figure[^>]*wp-block-embed[^>]*>(.*?)</figure>#is', $content, $blocks ) ) {
			foreach ( $blocks[1] as $block ) {
				$name = '';
				if ( preg_match( '#<figcaption[^>]*>(.*?)</figcaption>#is', $block, $caption ) ) {
					$name = trim( wp_strip_all_tags( $caption[1] ) );
				}
				$found[] = array( $name, preg_replace( '#<[^>]+>#', ' ', preg_replace( '#<figcaption.*?</figcaption>#is', ' ', $block ) ) );
			}
			$content = preg_replace( '#<figure[^>]*wp-block-embed[^>]*>.*?</figure>#is', ' ', $content );
		}
		// Then any YouTube address written anywhere else on the page.
		$found[] = array( '', wp_strip_all_tags( str_replace( array( '"', "'", '<', '>' ), ' ', $content ) ) );

		foreach ( $found as $piece ) {
			if ( ! preg_match_all( '#https?://(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)/[^\s]+#i', $piece[1], $urls ) ) {
				continue;
			}
			foreach ( $urls[0] as $url ) {
				$url   = html_entity_decode( $url );
				$embed = '';
				if ( preg_match( '#[?&]list=([A-Za-z0-9_-]+)#', $url, $m ) ) {
					$embed = 'https://www.youtube-nocookie.com/embed/videoseries?list=' . $m[1];
					$watch = 'https://www.youtube.com/playlist?list=' . $m[1];
				} elseif ( preg_match( '#(?:[?&]v=|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{6,})#', $url, $m ) ) {
					$embed = 'https://www.youtube-nocookie.com/embed/' . $m[1];
					$watch = 'https://www.youtube.com/watch?v=' . $m[1];
				}
				if ( '' === $embed || isset( $seen[ $embed ] ) ) {
					continue;
				}
				$seen[ $embed ] = true;
				$number  = count( $lists ) + 1;
				/* translators: %d: playlist number. */
				$lists[] = array( '' !== $piece[0] ? $piece[0] : sprintf( __( 'Song %d', 'platinum' ), $number ), $embed, $watch );
			}
		}
		break;
	}
	return $lists;
}

/**
 * A project that holds nothing but one outside link is a shortcut:
 * its file opens that site instead of a document.
 *
 * @param WP_Post|int|null $post Project.
 * @return string The address, or '' when the project is an ordinary document.
 */
function platinum_shortcut( $post = null ) {
	$post = get_post( $post );
	if ( ! $post || PLATINUM_PT !== $post->post_type ) {
		return '';
	}
	$content = $post->post_content;
	if ( ! preg_match_all( '#https?://[^\s"\'<>]+#i', $content, $found ) ) {
		return '';
	}
	$home  = wp_parse_url( home_url(), PHP_URL_HOST );
	$links = array();
	foreach ( $found[0] as $url ) {
		$url  = untrailingslashit( html_entity_decode( $url ) );
		$host = wp_parse_url( $url, PHP_URL_HOST );
		if ( $host && $host !== $home ) {
			$links[ $url ] = true;
		}
	}
	if ( 1 !== count( $links ) ) {
		return '';
	}
	// Anything more than one short line of text makes it a real document.
	$text = trim( wp_strip_all_tags( preg_replace( '#https?://[^\s"\'<>]+#i', '', $content ) ) );
	if ( strlen( $text ) > 160 || preg_match( '#<(img|figure|iframe|video|audio)#i', $content ) ) {
		return '';
	}
	return trailingslashit( key( $links ) );
}

/**
 * Picks the icon for a shortcut from the site it leads to.
 *
 * @param string $url Address.
 * @return string
 */
function platinum_shortcut_icon( $url ) {
	$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
	$host = preg_replace( '#^www\.#', '', $host );
	if ( in_array( $host, array( 'github.com', 'gitlab.com', 'codepen.io' ), true ) ) {
		return 'code';
	}
	// Old software that plays in the browser, from the Internet Archive.
	if ( 'archive.org' === $host && 0 === strpos( (string) wp_parse_url( $url, PHP_URL_PATH ), '/details/' ) ) {
		return 'game';
	}
	return 'link';
}

/**
 * The page that holds the music links, whatever its state, so the desktop
 * can save to it. 0 when there is none yet.
 *
 * @return int
 */
function platinum_playlist_page_id() {
	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => array( 'publish', 'private', 'draft' ),
			'posts_per_page' => 50,
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	foreach ( $pages as $page ) {
		$slug = $page->post_name ? $page->post_name : sanitize_title( $page->post_title );
		if ( 0 === strpos( $slug, 'playlist' ) ) {
			return (int) $page->ID;
		}
	}
	return 0;
}


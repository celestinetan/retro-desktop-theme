<?php
/**
 * Platinum theme set-up.
 *
 * Content lives in WordPress:
 *   Portfolio > Project Types  = folders on the desktop
 *   Portfolio > Projects       = files inside a folder
 *   Pages                      = documents on the desktop
 *   Posts                      = notes in the Notes window
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PLATINUM_VERSION', '1.1.0' );

// The name of the system, shown on the start-up screen and in the About window.
define( 'PLATINUM_OS', 'RetroOS' );
define( 'PLATINUM_PT', 'jetpack-portfolio' );
define( 'PLATINUM_TAX', 'jetpack-portfolio-type' );

require get_template_directory() . '/inc/icons.php';
require get_template_directory() . '/inc/desktop.php';
require get_template_directory() . '/inc/mail.php';
require get_template_directory() . '/inc/window.php';

add_action(
	'after_setup_theme',
	function () {
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'jetpack-portfolio' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'editor-styles' );
		add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
		add_editor_style( 'assets/css/editor.css' );
		add_image_size( 'platinum-icon', 96, 96, true );
	}
);

/**
 * Portfolio projects and project types.
 *
 * WordPress.com provides these itself when Portfolio is switched on
 * (Settings > Writing). If it is off, the theme registers the same names
 * so nothing disappears and the content stays compatible.
 */
add_action(
	'init',
	function () {
		if ( ! taxonomy_exists( PLATINUM_TAX ) ) {
			register_taxonomy(
				PLATINUM_TAX,
				PLATINUM_PT,
				array(
					'hierarchical'      => true,
					'labels'            => array(
						'name'          => __( 'Project Types', 'platinum' ),
						'singular_name' => __( 'Project Type', 'platinum' ),
						'add_new_item'  => __( 'Add New Project Type', 'platinum' ),
						'menu_name'     => __( 'Project Types', 'platinum' ),
					),
					'public'            => true,
					'show_in_rest'      => true,
					'show_admin_column' => true,
					'rewrite'           => array( 'slug' => 'project-type' ),
				)
			);
		}

		if ( ! post_type_exists( PLATINUM_PT ) ) {
			register_post_type(
				PLATINUM_PT,
				array(
					'labels'        => array(
						'name'          => __( 'Projects', 'platinum' ),
						'singular_name' => __( 'Project', 'platinum' ),
						'menu_name'     => __( 'Portfolio', 'platinum' ),
						'all_items'     => __( 'All Projects', 'platinum' ),
						'add_new'       => __( 'Add New', 'platinum' ),
						'add_new_item'  => __( 'Add New Project', 'platinum' ),
						'edit_item'     => __( 'Edit Project', 'platinum' ),
					),
					'public'        => true,
					'has_archive'   => true,
					'show_in_rest'  => true,
					'menu_position' => 20,
					'menu_icon'     => 'dashicons-portfolio',
					'supports'      => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'page-attributes' ),
					'taxonomies'    => array( PLATINUM_TAX ),
					'rewrite'       => array(
						'slug'       => 'portfolio',
						'with_front' => false,
					),
				)
			);
		}

		register_taxonomy_for_object_type( PLATINUM_TAX, PLATINUM_PT );

		// Addresses for the two built-in windows.
		add_rewrite_rule( '^notes/?$', 'index.php?platinum=notes', 'top' );
		add_rewrite_rule( '^trash/?$', 'index.php?platinum=trash', 'top' );
		add_rewrite_rule( '^music/?$', 'index.php?platinum=music', 'top' );

	},
	20
);

/**
 * Makes sure the site knows the addresses this theme relies on
 * (/notes/, /trash/, /music/, /portfolio/). Runs after everything has registered,
 * and repairs the list by itself if anything ever drops them.
 */
add_action(
	'init',
	function () {
		if ( ! get_option( 'permalink_structure' ) ) {
			return;
		}
		$rules = get_option( 'rewrite_rules' );
		if ( ! is_array( $rules ) || ! isset( $rules['^notes/?$'], $rules['^trash/?$'], $rules['^music/?$'], $rules['portfolio/?$'] ) ) {
			flush_rewrite_rules( false );
		}
	},
	999
);

add_filter(
	'query_vars',
	function ( $vars ) {
		$vars[] = 'platinum';
		return $vars;
	}
);

/**
 * Folders show every project; Notes shows the latest thirty posts.
 */
/*
 * A folder lists only what is directly inside it; its subfolders show as folders.
 */
add_action(
	'parse_tax_query',
	function ( $query ) {
		if ( is_admin() || ! $query->is_main_query() || empty( $query->tax_query->queries ) ) {
			return;
		}
		foreach ( $query->tax_query->queries as $key => $clause ) {
			if ( is_array( $clause ) && isset( $clause['taxonomy'] ) && PLATINUM_TAX === $clause['taxonomy'] ) {
				$query->tax_query->queries[ $key ]['include_children'] = false;
			}
		}
	}
);

add_action(
	'pre_get_posts',
	function ( $query ) {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}
		if ( $query->is_tax( PLATINUM_TAX ) || $query->is_post_type_archive( PLATINUM_PT ) ) {
			$query->set( 'posts_per_page', -1 );
			$query->set(
				'orderby',
				array(
					'menu_order' => 'ASC',
					'date'       => 'DESC',
				)
			);
		} elseif ( $query->is_home() || $query->is_archive() || $query->is_search() ) {
			$query->set( 'posts_per_page', 30 );
		}
	}
);

add_action(
	'wp_enqueue_scripts',
	function () {
		$dir = get_template_directory();
		$uri = get_template_directory_uri();

		foreach ( array( 'platinum', 'mobile' ) as $sheet ) {
			wp_enqueue_style(
				'platinum-' . $sheet,
				$uri . '/assets/css/' . $sheet . '.css',
				array(),
				(string) filemtime( $dir . '/assets/css/' . $sheet . '.css' )
			);
		}

		// The menu and title font: ChicagoFLF by Robin Casady, public domain.
		wp_add_inline_style(
			'platinum-platinum',
			'@font-face{font-family:"ChicagoFLF";src:url("' . esc_url( $uri . '/assets/fonts/ChicagoFLF.ttf' ) . '") format("truetype");font-weight:400 700;font-style:normal;font-display:swap;}'
		);

		// Each extra is its own file. Remove a name from this list to switch it off.
		$scripts = array( 'desktop', 'sound', 'pdfview', 'startup', 'wallpaper', 'terminal', 'puzzle', 'paint', 'mines', 'solitaire', 'player' );

		// The word processor is loaded only for someone who is logged in and allowed to write.
		if ( platinum_can_write() ) {
			$scripts[] = 'write';
			$scripts[] = 'folders';
		}
		foreach ( $scripts as $script ) {
			$file = $dir . '/assets/js/' . $script . '.js';
			if ( ! file_exists( $file ) ) {
				continue;
			}
			wp_enqueue_script(
				'platinum-' . $script,
				$uri . '/assets/js/' . $script . '.js',
				'desktop' === $script ? array() : array( 'platinum-desktop' ),
				(string) filemtime( $file ),
				array(
					'in_footer' => true,
					'strategy'  => 'defer',
				)
			);
		}

		$data = array(
			'home'  => home_url( '/' ),
			'title' => wp_get_document_title(),
			'site'  => get_bloginfo( 'name' ),
		);

		// What the word processor needs to save to this site. Printed for the writer only;
		// WordPress still checks their permission on every save.
		if ( platinum_can_write() ) {
			$folders = platinum_folder_tree();
			$data['rest']     = esc_url_raw( rest_url( 'wp/v2/' ) );
			$data['nonce']    = wp_create_nonce( 'wp_rest' );
			$data['admin']    = esc_url_raw( admin_url() );
			$data['folders']  = $folders;
			$data['projects'] = platinum_rest_base( PLATINUM_PT );
			$data['folderKey'] = platinum_tax_rest_base();
			$data['canPages'] = current_user_can( 'edit_pages' );
			$data['playlist'] = platinum_playlist_page_id();
			$data['canFolders'] = current_user_can( 'manage_categories' );
			$data['canPublish'] = current_user_can( 'publish_posts' );
		}

		wp_add_inline_script(
			'platinum-desktop',
			'window.PLATINUM = ' . wp_json_encode( $data ) . ';',
			'before'
		);
	}
);

/**
 * Runs before the page paints: marks that scripts work, restores the chosen
 * desktop pattern and decides whether to show the start-up screen.
 */
add_action(
	'wp_head',
	function () {
		?>
<script>
(function (d) {
	var r = d.documentElement;
	r.className = r.className.replace('no-js', 'js');
	try {
		var w = localStorage.getItem('platinum-wallpaper');
		if (w) { r.setAttribute('data-wallpaper', w); }
		if (!localStorage.getItem('platinum-booted') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
			r.classList.add('is-booting');
		}
	} catch (e) {}
})(document);
</script>
		<?php
	},
	1
);

/**
 * Which window, if any, the current address should show.
 *
 * @return string desktop|folder|portfolio|project|page|notes|music|trash|missing
 */
function platinum_kind() {
	$special = get_query_var( 'platinum' );
	if ( 'trash' === $special ) {
		return 'trash';
	}
	if ( 'notes' === $special ) {
		return 'notes';
	}
	if ( 'music' === $special ) {
		return 'music';
	}
	if ( is_404() ) {
		return 'missing';
	}
	if ( is_front_page() ) {
		return 'desktop';
	}
	if ( is_tax( PLATINUM_TAX ) ) {
		return 'folder';
	}
	if ( is_post_type_archive( PLATINUM_PT ) ) {
		return 'portfolio';
	}
	if ( is_singular( PLATINUM_PT ) ) {
		return 'project';
	}
	if ( is_page() || is_attachment() ) {
		return 'page';
	}
	return 'notes';
}

add_filter(
	'document_title_parts',
	function ( $parts ) {
		$special = get_query_var( 'platinum' );
		if ( 'notes' === $special ) {
			$parts['title'] = __( 'Notes', 'platinum' );
			$parts['site']  = get_bloginfo( 'name' );
			unset( $parts['tagline'] );
		} elseif ( 'music' === $special ) {
			$parts['title'] = __( 'My Music', 'platinum' );
			$parts['site']  = get_bloginfo( 'name' );
			unset( $parts['tagline'] );
		} elseif ( 'trash' === $special ) {
			$parts['title'] = __( 'Trash', 'platinum' );
			$parts['site']  = get_bloginfo( 'name' );
			unset( $parts['tagline'] );
		}
		return $parts;
	}
);

/**
 * Whether the person looking at the site may write to it from the desktop.
 *
 * @return bool
 */
function platinum_can_write() {
	return is_user_logged_in() && current_user_can( 'edit_posts' );
}

/**
 * The name WordPress uses for a kind of content when saving it (posts, pages, projects).
 *
 * @param string $type Post type.
 * @return string
 */
function platinum_rest_base( $type ) {
	$object = get_post_type_object( $type );
	if ( $object && ! empty( $object->rest_base ) ) {
		return $object->rest_base;
	}
	if ( 'post' === $type ) {
		return 'posts';
	}
	if ( 'page' === $type ) {
		return 'pages';
	}
	return $type;
}

/**
 * The name WordPress uses for the folder (project type) field when saving a project.
 *
 * @return string
 */
function platinum_tax_rest_base() {
	$object = get_taxonomy( PLATINUM_TAX );
	return ( $object && ! empty( $object->rest_base ) ) ? $object->rest_base : PLATINUM_TAX;
}

/**
 * Notes, pages and projects show only what was written:
 * no share buttons, Like button or "Related" list added underneath.
 */
add_filter( 'sharing_show', '__return_false', 99 );
add_filter( 'wpl_is_likes_visible', '__return_false', 99 );
add_filter( 'jetpack_relatedposts_filter_enabled_for_request', '__return_false', 99 );

function platinum_plain_content() {
	remove_filter( 'the_content', 'sharing_display', 19 );
	remove_filter( 'the_excerpt', 'sharing_display', 19 );
	if ( class_exists( 'Jetpack_Likes' ) ) {
		remove_filter( 'the_content', array( Jetpack_Likes::init(), 'post_likes' ), 30 );
	}
	if ( class_exists( 'Jetpack_RelatedPosts' ) ) {
		$related = Jetpack_RelatedPosts::init();
		remove_filter( 'the_content', array( $related, 'filter_add_target_to_dom' ), 40 );
	}
}
add_action( 'wp', 'platinum_plain_content', 99 );

/**
 * The site's icon (browser tab, bookmarks, phone home screen, link previews)
 * is the theme's own mark, unless a Site Icon has been chosen in WordPress.
 */
function platinum_site_icon_url( $url, $size ) {
	if ( get_option( 'site_icon' ) ) {
		return $url;
	}
	$size = (int) $size;
	$file = $size <= 32 ? 'icon-32.png' : ( $size <= 180 ? 'icon-180.png' : ( $size <= 192 ? 'icon-192.png' : 'icon-512.png' ) );
	return get_template_directory_uri() . '/assets/img/' . $file . '?v=' . PLATINUM_VERSION;
}
add_filter( 'get_site_icon_url', 'platinum_site_icon_url', 10, 2 );

function platinum_site_icon_head() {
	if ( get_option( 'site_icon' ) ) {
		return;
	}
	echo '<link rel="icon" type="image/svg+xml" href="' . esc_url( get_template_directory_uri() . '/assets/img/icon.svg?v=' . PLATINUM_VERSION ) . '">' . "\n";
}
add_action( 'wp_head', 'platinum_site_icon_head', 100 );


/**
 * What search engines and link previews say about the home page: the opening
 * of the Read Me page, so it is written in one place.
 */
function platinum_home_description() {
	$page = get_page_by_path( 'read-me' );
	$text = $page && 'publish' === $page->post_status ? wp_strip_all_tags( strip_shortcodes( $page->post_content ) ) : get_bloginfo( 'description' );
	$text = trim( preg_replace( '/\s+/', ' ', (string) $text ) );
	return $text ? wp_html_excerpt( $text, 155, '…' ) : '';
}

function platinum_home_head() {
	if ( ! is_front_page() ) {
		return;
	}
	$text = platinum_home_description();
	if ( $text ) {
		echo '<meta name="description" content="' . esc_attr( $text ) . '">' . "\n";
	}
	echo '<link rel="canonical" href="' . esc_url( home_url( '/' ) ) . '">' . "\n";
}
add_action( 'wp_head', 'platinum_home_head', 5 );

function platinum_open_graph( $tags ) {
	if ( is_front_page() ) {
		$text = platinum_home_description();
		if ( $text ) {
			$tags['og:description'] = $text;
		}
	}
	if ( isset( $tags['og:image'] ) && is_string( $tags['og:image'] ) && false !== strpos( $tags['og:image'], '/assets/img/share.png' ) ) {
		$tags['og:image:width']  = 1200;
		$tags['og:image:height'] = 630;
		$tags['og:image:alt']    = get_bloginfo( 'name' );
		$tags['twitter:card']    = 'summary_large_image';
	}
	return $tags;
}
add_filter( 'jetpack_open_graph_tags', 'platinum_open_graph', 20 );


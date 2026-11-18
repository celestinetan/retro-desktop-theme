<?php
/**
 * Renders the window that belongs to the current address.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Opens a window frame.
 *
 * @param string $kind  folder|doc|notes|alert|app.
 * @param string $title Window title.
 * @param array  $args  url, info (already escaped HTML), main, app, post (id and save name), term (folder id).
 */
function platinum_window_open( $kind, $title, $args = array() ) {
	$url  = isset( $args['url'] ) ? $args['url'] : '';
	$main = ! empty( $args['main'] );
	$app  = isset( $args['app'] ) ? $args['app'] : '';
	?>
	<section class="window window--<?php echo esc_attr( $kind ); ?><?php echo $main ? ' is-active' : ''; ?>"
		data-kind="<?php echo esc_attr( $kind ); ?>"
		<?php echo $url ? 'data-url="' . esc_url( $url ) . '"' : ''; ?>
		<?php echo $app ? 'data-app="' . esc_attr( $app ) . '"' : ''; ?>
		<?php echo ! empty( $args['post'] ) ? 'data-id="' . (int) $args['post'][0] . '" data-rest="' . esc_attr( $args['post'][1] ) . '"' : ''; ?>
		<?php echo ! empty( $args['term'] ) ? 'data-term="' . (int) $args['term'] . '"' : ''; ?>
		<?php echo $main ? 'data-main' : ''; ?>
		aria-label="<?php echo esc_attr( $title ); ?>" tabindex="-1">
		<header class="titlebar">
			<a class="box box-close" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'Close window', 'platinum' ); ?>"></a>
			<span class="stripes" aria-hidden="true"></span>
			<h1 class="title"><?php echo esc_html( $title ); ?></h1>
			<span class="stripes" aria-hidden="true"></span>
			<button type="button" class="box box-zoom" aria-label="<?php esc_attr_e( 'Zoom window', 'platinum' ); ?>"></button>
			<button type="button" class="box box-shade" aria-label="<?php esc_attr_e( 'Collapse window', 'platinum' ); ?>"></button>
		</header>
		<?php if ( ! empty( $args['info'] ) ) : ?>
			<div class="infobar"><?php echo $args['info']; // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		<?php endif; ?>
		<div class="window-body">
	<?php
}

/**
 * Closes a window frame.
 */
function platinum_window_close() {
	?>
		</div>
		<span class="grow" aria-hidden="true"></span>
	</section>
	<?php
}

/**
 * "3 items" style count.
 *
 * @param int $count Number of items.
 * @return string
 */
function platinum_count_label( $count ) {
	/* translators: %s: number of items. */
	return esc_html( sprintf( _n( '%s item', '%s items', $count, 'platinum' ), number_format_i18n( $count ) ) );
}

/**
 * Current address, for the window to remember.
 *
 * @return string
 */
function platinum_current_url() {
	global $wp;
	return home_url( user_trailingslashit( $wp->request ) );
}

/**
 * Prints the window for the current address. Prints nothing on the desktop.
 */
function platinum_the_window() {
	switch ( platinum_kind() ) {
		case 'folder':
			platinum_folder_window();
			break;
		case 'portfolio':
			platinum_portfolio_window();
			break;
		case 'project':
		case 'page':
			platinum_document_window();
			break;
		case 'notes':
			platinum_notes_window();
			break;
		case 'music':
			platinum_music_window();
			break;
		case 'trash':
			platinum_trash_window();
			break;
		case 'missing':
			platinum_missing_window();
			break;
	}
}

/**
 * A folder: every project of one project type.
 */
function platinum_folder_window() {
	global $wp_query;
	$term = get_queried_object();

	platinum_window_open(
		'folder',
		$term->name,
		array(
			'url'  => get_term_link( $term ),
			'info' => platinum_count_label( (int) $wp_query->found_posts ),
			'main' => true,
			'term' => (int) $term->term_id,
		)
	);

	if ( have_posts() ) {
		echo '<div class="files">';
		while ( have_posts() ) {
			the_post();
			$shortcut = platinum_shortcut();
			$attrs    = array(
				'data-id'   => (string) get_the_ID(),
				'data-rest' => platinum_rest_base( get_post_type() ),
			);
			if ( $shortcut ) {
				$attrs['data-ext'] = '1';
				$attrs['target']   = '_blank';
				$attrs['rel']      = 'noopener';
			}
			platinum_the_icon(
				array(
					'label' => get_the_title(),
					'icon'  => $shortcut ? platinum_shortcut_icon( $shortcut ) : ( preg_match( '#href="[^"]+\.pdf"#i', get_the_content() ) ? 'pdf' : 'doc' ),
					'thumb' => has_post_thumbnail() ? get_the_post_thumbnail( null, 'platinum-icon', array( 'alt' => '' ) ) : '',
					'url'   => $shortcut ? $shortcut : get_permalink(),
					'attrs' => $attrs,
				)
			);
		}
		echo '</div>';
	} else {
		echo '<p class="empty">' . esc_html__( 'Nothing here yet.', 'platinum' ) . '</p>';
	}

	platinum_window_close();
}

/**
 * The portfolio as a whole: the folders again, inside a window.
 */
function platinum_portfolio_window() {
	$folders = platinum_folder_items();

	platinum_window_open(
		'folder',
		__( 'Portfolio', 'platinum' ),
		array(
			'url'  => get_post_type_archive_link( PLATINUM_PT ),
			'info' => platinum_count_label( count( $folders ) ),
			'main' => true,
		)
	);

	if ( $folders ) {
		echo '<div class="files">';
		foreach ( $folders as $folder ) {
			platinum_the_icon( $folder );
		}
		echo '</div>';
	} else {
		echo '<p class="empty">' . esc_html__( 'Nothing here yet.', 'platinum' ) . '</p>';
	}

	platinum_window_close();
}

/**
 * A project or a page, shown as a document.
 */
function platinum_document_window() {
	if ( ! have_posts() ) {
		platinum_missing_window();
		return;
	}
	the_post();

	$is_mail = 'page' === get_post_type() && false !== strpos( get_post_field( 'post_name' ), 'contact' );
	$is_web  = 'page' === get_post_type() && 0 === strpos( get_post_field( 'post_name' ), 'links' );
	// A page or project that holds a PDF opens as a document viewer showing the PDF itself.
	$pdf = '';
	if ( ! $is_mail && ! $is_web && preg_match( '#href="([^"]+\.pdf)"#i', get_the_content(), $platinum_found ) ) {
		$pdf = $platinum_found[1];
	}
	$info    = '';
	if ( PLATINUM_PT === get_post_type() ) {
		$terms = get_the_terms( get_the_ID(), PLATINUM_TAX );
		if ( $terms && ! is_wp_error( $terms ) ) {
			$term = reset( $terms );
			$link = get_term_link( $term );
			if ( ! is_wp_error( $link ) ) {
				/* translators: %s: folder name. */
				$info = sprintf( esc_html__( 'In %s', 'platinum' ), '<a href="' . esc_url( $link ) . '">' . esc_html( $term->name ) . '</a>' );
			}
		}
	}

	platinum_window_open(
		$is_mail ? 'mail' : ( $is_web ? 'browser' : ( $pdf ? 'pdf' : 'doc' ) ),
		$is_mail ? __( 'New Message', 'platinum' ) : get_the_title(),
		array(
			'url'  => get_permalink(),
			'info' => $info,
			'main' => true,
			'post' => array( get_the_ID(), platinum_rest_base( get_post_type() ) ),
		)
	);

	// Shown only to the owner when logged in: change this document, or take it off the site.
	if ( platinum_can_write() && ! $is_mail ) {
		echo '<div class="notes-bar owner-bar">';
		echo '<button type="button" class="button" data-cmd="edit-doc">' . esc_html__( 'Edit', 'platinum' ) . '</button>';
		echo '<button type="button" class="button" data-cmd="trash-doc">' . esc_html__( 'Move to Trash', 'platinum' ) . '</button>';
		echo '</div>';
	}

	if ( $pdf ) {
		$name = wp_basename( wp_parse_url( $pdf, PHP_URL_PATH ) );
		echo '<div class="pdf">';
		echo '<div class="pdf-bar">';
		echo '<span class="pdf-name">' . platinum_icon( 'cv' ) . esc_html( $name ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<a class="button" href="' . esc_url( $pdf ) . '" target="_blank" rel="noopener">' . esc_html__( 'Full screen', 'platinum' ) . '</a>';
		echo '<a class="button button--default" href="' . esc_url( $pdf ) . '" download="' . esc_attr( $name ) . '">' . esc_html__( 'Download', 'platinum' ) . '</a>';
		echo '</div>';
		echo '<div class="pdf-body" data-pdf="' . esc_url( $pdf ) . '">';
		echo '<object class="pdf-view" data="' . esc_url( $pdf ) . '#toolbar=0&amp;navpanes=0&amp;view=FitH" type="application/pdf" aria-label="' . esc_attr( get_the_title() ) . '">';
		echo '<p class="pdf-none">' . esc_html__( 'This browser cannot show the document inside the window. Use Full screen or Download above.', 'platinum' ) . '</p>';
		echo '</object>';
		echo '<p class="pdf-phone">' . esc_html__( 'Opening the document…', 'platinum' ) . '</p>';
		echo '</div>';
		echo '</div>';
	} elseif ( $is_web ) {
		// The Links page, drawn as a web browser. Its links open the real sites in a new tab.
		$content = apply_filters( 'the_content', get_the_content() ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals
		$content = links_add_target( $content, '_blank' );
		$content = str_replace( 'target="_blank"', 'target="_blank" rel="noopener"', $content );
		echo '<div class="browser">';
		echo '<div class="browser-tools" aria-hidden="true">';
		foreach ( array( __( 'Back', 'platinum' ), __( 'Forward', 'platinum' ), __( 'Reload', 'platinum' ), __( 'Home', 'platinum' ), __( 'Search', 'platinum' ) ) as $tool ) {
			echo '<span class="browser-tool"><i></i>' . esc_html( $tool ) . '</span>';
		}
		echo '</div>';
		echo '<div class="browser-address"><span>' . esc_html__( 'Address:', 'platinum' ) . '</span><span class="browser-url" data-home="' . esc_url( get_permalink() ) . '">' . esc_html( get_permalink() ) . '</span></div>';
		echo '<div class="browser-body"><article class="doc doc--web">';
		echo '<h2 class="doc-title">' . esc_html( get_the_title() ) . '</h2>';
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '</article></div>';
		echo '<div class="browser-status" role="status"></div>';
		echo '</div>';
	} elseif ( $is_mail ) {
		// The contact page, drawn as a new message being written: toolbar, To and Subject, then the form.
		// "Send" in the toolbar sends the form; the other tools are decoration.
		$tools = array(
			'clip'   => __( 'Attach', 'platinum' ),
			'drafts' => __( 'Save as Draft', 'platinum' ),
			'book'   => __( 'Contacts', 'platinum' ),
		);
		echo '<div class="mail mail--compose">';
		echo '<div class="mail-tools">';
		echo '<button type="button" class="mail-tool" data-mail="send">' . platinum_mail_glyph( 'forward' ) . '<span>' . esc_html__( 'Send', 'platinum' ) . '</span></button>'; // phpcs:ignore WordPress.Security.EscapeOutput
		foreach ( $tools as $glyph => $tool ) {
			echo '<span class="mail-tool" aria-hidden="true">' . platinum_mail_glyph( $glyph ) . '<span>' . esc_html( $tool ) . '</span></span>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '<span class="mail-badge" aria-hidden="true">' . platinum_icon( 'cel' ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '</div>';
		echo '<dl class="mail-head">';
		echo '<div><dt>' . esc_html__( 'To:', 'platinum' ) . '</dt><dd>' . esc_html( get_bloginfo( 'name' ) ) . '</dd></div>';
		echo '<div><dt>' . esc_html__( 'Subject:', 'platinum' ) . '</dt><dd>' . esc_html__( 'Hello', 'platinum' ) . '</dd></div>';
		echo '</dl>';
		echo '<div class="mail-body"><article class="doc doc--mail">';
		$message = str_replace( ']]>', ']]&gt;', apply_filters( 'the_content', get_the_content() ) ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals
		echo $message; // phpcs:ignore WordPress.Security.EscapeOutput
		// The note about how details are used only makes sense when there is a form to fill in.
		if ( false !== stripos( $message, '<form' ) ) {
			echo '<p class="mail-privacy">' . esc_html__( 'Your name, email address and message are sent to me and kept on this site so that I can reply. They are checked for spam on the way. Nothing else is collected.', 'platinum' ) . '</p>';
		}
		echo '</article></div>';
		echo '</div>';
	} else {
		// A page or project, drawn as a word-processor document. Menu, toolbar and ruler are decoration only.
		echo '<div class="wp">';
		echo '<div class="wp-menu" aria-hidden="true">';
		foreach ( array( __( 'File', 'platinum' ), __( 'Edit', 'platinum' ), __( 'View', 'platinum' ), __( 'Insert', 'platinum' ), __( 'Format', 'platinum' ), __( 'Tools', 'platinum' ), __( 'Table', 'platinum' ), __( 'Help', 'platinum' ) ) as $menu ) {
			echo '<span>' . esc_html( $menu ) . '</span>';
		}
		echo '</div>';
		echo '<div class="wp-tools" aria-hidden="true">';
		echo '<span class="wp-select wp-style">' . esc_html__( 'Normal', 'platinum' ) . '</span>';
		echo '<span class="wp-select wp-font">Times New Roman</span>';
		echo '<span class="wp-select wp-size">12</span>';
		echo '<span class="wp-btn wp-b">B</span><span class="wp-btn wp-i">I</span><span class="wp-btn wp-u">U</span>';
		echo '<span class="wp-sep"></span>';
		echo '<span class="wp-btn wp-align wp-left is-on"></span><span class="wp-btn wp-align wp-centre"></span><span class="wp-btn wp-align wp-right"></span>';
		echo '</div>';
		echo '<div class="wp-ruler" aria-hidden="true"></div>';
		echo '<div class="wp-desk"><article class="doc doc--page">';
		if ( PLATINUM_PT === get_post_type() && has_post_thumbnail() ) {
			echo '<figure class="doc-cover">';
			the_post_thumbnail( 'large' );
			echo '</figure>';
		}
		echo '<h2 class="doc-title">' . esc_html( get_the_title() ) . '</h2>';
		the_content();
		echo '</article></div>';
		echo '</div>';
	}

	platinum_window_close();
}

/**
 * Notes: the list of posts on the left, one post on the right.
 */
function platinum_notes_window() {
	$single  = is_singular();
	$current = $single ? get_queried_object_id() : 0;

	if ( $single ) {
		$list = get_posts(
			array(
				'post_type'      => 'post',
				'posts_per_page' => 30,
			)
		);
	} else {
		global $wp_query;
		$list = $wp_query->posts;
	}

	platinum_window_open(
		'notes',
		__( 'Notes', 'platinum' ),
		array(
			'url'  => $single ? get_permalink( $current ) : platinum_current_url(),
			'main' => true,
			'post' => $single ? array( $current, platinum_rest_base( get_post_type( $current ) ) ) : array(),
		)
	);

	// Shown only to the owner when logged in: write a new note, or change the one that is open.
	if ( platinum_can_write() ) {
		echo '<div class="notes-bar">';
		echo '<button type="button" class="button" data-cmd="new-note">' . esc_html__( 'New Note', 'platinum' ) . '</button>';
		if ( $single ) {
			echo '<button type="button" class="button" data-cmd="edit-doc">' . esc_html__( 'Edit This Note', 'platinum' ) . '</button>';
			echo '<button type="button" class="button" data-cmd="trash-doc">' . esc_html__( 'Move to Trash', 'platinum' ) . '</button>';
		}
		echo '</div>';
	}

	echo '<div class="notes' . ( $single ? ' has-note' : '' ) . '">';

	echo '<nav class="notes-list" aria-label="' . esc_attr__( 'All notes', 'platinum' ) . '">';
	if ( $list ) {
		echo '<ul>';
		foreach ( $list as $note ) {
			printf(
				'<li><a href="%1$s"%2$s><span class="note-title">%3$s</span><time datetime="%4$s">%5$s</time></a></li>',
				esc_url( get_permalink( $note ) ),
				$note->ID === $current ? ' aria-current="page"' : '',
				esc_html( get_the_title( $note ) ),
				esc_attr( get_the_date( 'c', $note ) ),
				esc_html( get_the_date( '', $note ) )
			);
		}
		echo '</ul>';
	}
	echo '</nav>';

	echo '<div class="notes-pane">';
	if ( $single && have_posts() ) {
		the_post();
		echo '<a class="notes-back" href="' . esc_url( home_url( '/notes/' ) ) . '">' . esc_html__( 'All notes', 'platinum' ) . '</a>';
		echo '<article class="doc">';
		echo '<h2 class="doc-title">' . esc_html( get_the_title() ) . '</h2>';
		echo '<p class="doc-meta"><time datetime="' . esc_attr( get_the_date( 'c' ) ) . '">' . esc_html( get_the_date() ) . '</time></p>';
		the_content();
		echo '</article>';
	} elseif ( $list ) {
		echo '<p class="empty notes-hint">' . esc_html__( 'Choose a note from the list.', 'platinum' ) . '</p>';
	} else {
		echo '<p class="empty">' . esc_html__( 'No notes yet.', 'platinum' ) . '</p>';
	}
	echo '</div>';

	echo '</div>';

	platinum_window_close();
}

/**
 * The "Other Places" pane at the left of folder windows.
 */
function platinum_places() {
	echo '<aside class="places"><div class="places-box"><h2>' . esc_html__( 'Other Places', 'platinum' ) . '</h2><ul>';
	echo '<li><a href="' . esc_url( get_post_type_archive_link( PLATINUM_PT ) ) . '">' . platinum_icon( 'folder' ) . esc_html__( 'Portfolio', 'platinum' ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '<li><a href="' . esc_url( home_url( '/notes/' ) ) . '">' . platinum_icon( 'notes' ) . esc_html__( 'Notes', 'platinum' ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	if ( platinum_playlist() ) {
		echo '<li><a href="' . esc_url( home_url( '/music/' ) ) . '">' . platinum_icon( 'music' ) . esc_html__( 'My Music', 'platinum' ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '<li><a href="' . esc_url( home_url( '/trash/' ) ) . '">' . platinum_icon( 'trash' ) . esc_html__( 'Recycle Bin', 'platinum' ) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</ul></div></aside>';
}

/**
 * My Music: one file per YouTube playlist. Opening one starts the player.
 */
function platinum_music_window() {
	$lists = platinum_playlist();

	platinum_window_open(
		'folder',
		__( 'My Music', 'platinum' ),
		array(
			'url'  => home_url( '/music/' ),
			'info' => platinum_count_label( count( $lists ) ),
			'main' => true,
		)
	);

	if ( $lists ) {
		echo '<div class="files">';
		foreach ( $lists as $index => $list ) {
			platinum_the_icon(
				array(
					'label' => $list[0],
					'icon'  => 'song',
					'url'   => $list[2],
					'attrs' => array(
						'data-app' => 'player',
						'data-arg' => (string) $index,
					),
				)
			);
		}
		echo '</div>';
	} else {
		echo '<p class="empty">' . esc_html__( 'Nothing here yet.', 'platinum' ) . '</p>';
	}

	platinum_window_close();
}

/**
 * The Trash and its joke files.
 */
function platinum_trash_window() {
	$files = platinum_trash_files();

	platinum_window_open(
		'folder',
		__( 'Trash', 'platinum' ),
		array(
			'url'  => home_url( '/trash/' ),
			'info' => platinum_count_label( count( $files ) ),
			'main' => true,
		)
	);

	echo '<div class="files">';
	foreach ( $files as $file ) {
		platinum_the_icon(
			array(
				'label' => $file[0],
				'icon'  => 'file',
				'attrs' => array(
					'data-alert'       => $file[1],
					'data-alert-title' => $file[0],
				),
			)
		);
	}
	echo '</div>';
	echo '<noscript><ul class="trash-plain">';
	foreach ( $files as $file ) {
		echo '<li><strong>' . esc_html( $file[0] ) . '</strong>: ' . esc_html( $file[1] ) . '</li>';
	}
	echo '</ul></noscript>';

	platinum_window_close();
}

/**
 * Address not found.
 */
function platinum_missing_window() {
	platinum_window_open( 'alert', __( 'Not found', 'platinum' ), array( 'main' => true ) );
	echo '<div class="alert-body">';
	echo '<p>' . esc_html__( 'That file could not be found. It may have been moved or renamed.', 'platinum' ) . '</p>';
	echo '<p class="alert-actions"><a class="button button--default" href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Back to desktop', 'platinum' ) . '</a></p>';
	echo '</div>';
	platinum_window_close();
}

/**
 * Hidden templates for the windows that have no address of their own.
 * The scripts copy these when the visitor opens them from the menu.
 */
function platinum_the_app_templates() {
	?>
	<template id="tpl-wallpaper">
		<?php platinum_window_open( 'app', __( 'Appearance', 'platinum' ), array( 'app' => 'wallpaper' ) ); ?>
		<div class="app-pad">
			<p id="wallpaper-label"><?php esc_html_e( 'Choose a desktop pattern.', 'platinum' ); ?></p>
			<div class="swatches" role="radiogroup" aria-labelledby="wallpaper-label"></div>
		</div>
		<?php platinum_window_close(); ?>
	</template>

	<template id="tpl-terminal">
		<?php platinum_window_open( 'app', __( 'Terminal', 'platinum' ), array( 'app' => 'terminal' ) ); ?>
		<div class="terminal">
			<div class="terminal-out" role="log" aria-live="polite"></div>
			<form class="terminal-form" autocomplete="off">
				<label class="terminal-prompt" for="terminal-input">&gt;</label>
				<input id="terminal-input" class="terminal-input" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="<?php esc_attr_e( 'Command', 'platinum' ); ?>">
			</form>
		</div>
		<?php platinum_window_close(); ?>
	</template>

	<template id="tpl-puzzle">
		<?php platinum_window_open( 'app', __( 'Puzzle', 'platinum' ), array( 'app' => 'puzzle' ) ); ?>
		<div class="app-pad puzzle">
			<div class="puzzle-board" role="group" aria-label="<?php esc_attr_e( 'Sliding puzzle', 'platinum' ); ?>"></div>
			<p class="puzzle-status" role="status"></p>
			<p><button type="button" class="button puzzle-shuffle"><?php esc_html_e( 'Shuffle', 'platinum' ); ?></button></p>
		</div>
		<?php platinum_window_close(); ?>
	</template>

	<template id="tpl-paint">
		<?php platinum_window_open( 'app', __( 'Paint', 'platinum' ), array( 'app' => 'paint' ) ); ?>
		<div class="paint">
			<div class="paint-tools" role="toolbar" aria-label="<?php esc_attr_e( 'Tools', 'platinum' ); ?>">
				<button type="button" class="button" data-tool="pencil" aria-pressed="true"><?php esc_html_e( 'Pencil', 'platinum' ); ?></button>
				<button type="button" class="button" data-tool="brush" aria-pressed="false"><?php esc_html_e( 'Brush', 'platinum' ); ?></button>
				<button type="button" class="button" data-tool="eraser" aria-pressed="false"><?php esc_html_e( 'Eraser', 'platinum' ); ?></button>
				<button type="button" class="button" data-tool="fill" aria-pressed="false"><?php esc_html_e( 'Fill', 'platinum' ); ?></button>
				<span class="paint-gap"></span>
				<button type="button" class="button" data-act="clear"><?php esc_html_e( 'Clear', 'platinum' ); ?></button>
				<button type="button" class="button" data-act="save"><?php esc_html_e( 'Save picture', 'platinum' ); ?></button>
			</div>
			<div class="paint-stage"><canvas class="paint-canvas" width="460" height="300" aria-label="<?php esc_attr_e( 'Drawing area', 'platinum' ); ?>"></canvas></div>
			<div class="paint-colours" role="radiogroup" aria-label="<?php esc_attr_e( 'Colour', 'platinum' ); ?>"></div>
		</div>
		<?php platinum_window_close(); ?>
	</template>

	<template id="tpl-mines">
		<?php platinum_window_open( 'app', __( 'Mines', 'platinum' ), array( 'app' => 'mines' ) ); ?>
		<div class="mines">
			<div class="mines-top">
				<span class="mines-led mines-left" role="img" data-label="<?php esc_attr_e( 'Mines left to flag', 'platinum' ); ?>"></span>
				<button type="button" class="mines-face mines-new" aria-label="<?php esc_attr_e( 'New game', 'platinum' ); ?>" title="<?php esc_attr_e( 'New game', 'platinum' ); ?>"></button>
				<span class="mines-led mines-time" role="img" data-label="<?php esc_attr_e( 'Seconds', 'platinum' ); ?>"></span>
			</div>
			<div class="mines-field"><div class="mines-grid" role="group" aria-label="<?php esc_attr_e( 'Minefield', 'platinum' ); ?>"></div></div>
			<div class="mines-foot">
				<select class="mines-level" aria-label="<?php esc_attr_e( 'Level', 'platinum' ); ?>">
					<option value="0"><?php esc_html_e( 'Beginner', 'platinum' ); ?></option>
					<option value="1"><?php esc_html_e( 'Intermediate', 'platinum' ); ?></option>
					<option value="2"><?php esc_html_e( 'Expert', 'platinum' ); ?></option>
				</select>
				<button type="button" class="button mines-flag" aria-pressed="false"><?php esc_html_e( 'Flag', 'platinum' ); ?></button>
			</div>
			<p class="mines-status" role="status"></p>
		</div>
		<?php platinum_window_close(); ?>
	</template>

	<template id="tpl-solitaire">
		<?php platinum_window_open( 'app', __( 'Solitaire', 'platinum' ), array( 'app' => 'solitaire' ) ); ?>
		<div class="sol">
			<div class="sol-bar">
				<button type="button" class="button sol-new"><?php esc_html_e( 'New game', 'platinum' ); ?></button>
				<button type="button" class="button sol-undo"><?php esc_html_e( 'Undo', 'platinum' ); ?></button>
				<span class="sol-moves"></span>
			</div>
			<div class="sol-board" role="group" aria-label="<?php esc_attr_e( 'Card table', 'platinum' ); ?>"></div>
			<p class="sol-status" role="status"></p>
		</div>
		<?php platinum_window_close(); ?>
	</template>

	<?php $platinum_lists = platinum_playlist(); ?>
	<?php if ( $platinum_lists || platinum_can_write() ) : ?>
	<template id="tpl-player">
		<?php platinum_window_open( 'app', __( 'Music', 'platinum' ), array( 'app' => 'player' ) ); ?>
		<div class="player">
			<div class="player-frame"></div>
			<div class="player-track">
				<span class="player-time">00:00</span>
				<div class="player-bar" role="slider" tabindex="0" aria-label="<?php esc_attr_e( 'Position', 'platinum' ); ?>" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><b></b></div>
			</div>
			<div class="player-deck">
				<label class="player-vol"><svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true" focusable="false"><path d="M2 6.500h3l4-3.500v12l-4-3.500H2z" fill="currentColor"/><path d="M11.500 6q2 3 0 6M13.800 4q3.500 5 0 10" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round"/></svg><input type="range" min="0" max="100" value="80" aria-label="<?php esc_attr_e( 'Volume', 'platinum' ); ?>"></label>
				<div class="player-keys">
					<button type="button" class="player-key" data-act="first" aria-label="<?php esc_attr_e( 'Previous track', 'platinum' ); ?>" title="<?php esc_attr_e( 'Previous track', 'platinum' ); ?>"><svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"><path d="M4 4v10M14 4L6.500 9l7.500 5z"/></svg></button>
					<button type="button" class="player-key" data-act="back" aria-label="<?php esc_attr_e( 'Back 15 seconds', 'platinum' ); ?>" title="<?php esc_attr_e( 'Back 15 seconds', 'platinum' ); ?>"><svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"><path d="M9 4L2 9l7 5zM16 4L9 9l7 5z"/></svg></button>
					<button type="button" class="player-key player-key--play" data-act="play" aria-label="<?php esc_attr_e( 'Play', 'platinum' ); ?>" title="<?php esc_attr_e( 'Play', 'platinum' ); ?>"><svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"><path class="g-play" d="M5.500 3.500l9 5.500-9 5.500z"/><path class="g-pause" d="M5 4h3v10H5zM10 4h3v10h-3z"/></svg></button>
					<button type="button" class="player-key" data-act="ahead" aria-label="<?php esc_attr_e( 'Forward 15 seconds', 'platinum' ); ?>" title="<?php esc_attr_e( 'Forward 15 seconds', 'platinum' ); ?>"><svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"><path d="M2 4l7 5-7 5zM9 4l7 5-7 5z"/></svg></button>
					<button type="button" class="player-key" data-act="last" aria-label="<?php esc_attr_e( 'Next track', 'platinum' ); ?>" title="<?php esc_attr_e( 'Next track', 'platinum' ); ?>"><svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"><path d="M14 4v10M4 4l7.500 5L4 14z"/></svg></button>
				</div>
				<a class="player-out" href="#" target="_blank" rel="noopener" aria-label="<?php esc_attr_e( 'Open on YouTube', 'platinum' ); ?>" title="<?php esc_attr_e( 'Open on YouTube', 'platinum' ); ?>"><svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.800"><path d="M7 4H3.500v10.500H14V11M10 3.500h4.500V8M14.500 3.500L8 10"/></svg></a>
			</div>
			<div class="player-name"></div>
			<ol class="player-list">
				<?php foreach ( $platinum_lists as $platinum_list ) : ?>
					<li><button type="button" class="player-item" data-embed="<?php echo esc_url( $platinum_list[1] ); ?>" data-url="<?php echo esc_url( $platinum_list[2] ); ?>"><?php echo esc_html( $platinum_list[0] ); ?></button><?php if ( platinum_can_write() ) : ?><button type="button" class="player-x" data-act="remove" aria-label="<?php esc_attr_e( 'Remove', 'platinum' ); ?>" title="<?php esc_attr_e( 'Remove', 'platinum' ); ?>">×</button><?php endif; ?></li>
				<?php endforeach; ?>
			</ol>
			<?php if ( platinum_can_write() ) : ?>
			<form class="player-add">
				<input type="url" class="player-link" required placeholder="<?php esc_attr_e( 'Paste a YouTube link to a song', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'YouTube link', 'platinum' ); ?>">
				<input type="text" class="player-label" maxlength="60" placeholder="<?php esc_attr_e( 'Name (optional)', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Name', 'platinum' ); ?>">
				<button type="submit" class="button"><?php esc_html_e( 'Add', 'platinum' ); ?></button>
			</form>
			<p class="player-note" role="status"></p>
			<?php endif; ?>
		</div>
		<?php platinum_window_close(); ?>
	</template>
	<?php endif; ?>

	<?php if ( platinum_can_write() ) : ?>
	<template id="tpl-write">
		<?php platinum_window_open( 'app', __( 'Untitled', 'platinum' ), array( 'app' => 'write' ) ); ?>
		<div class="wp write">
			<div class="wp-tools write-tools" role="toolbar" aria-label="<?php esc_attr_e( 'Formatting', 'platinum' ); ?>">
				<select class="write-style" aria-label="<?php esc_attr_e( 'Paragraph style', 'platinum' ); ?>">
					<option value="p"><?php esc_html_e( 'Normal', 'platinum' ); ?></option>
					<option value="h2"><?php esc_html_e( 'Heading', 'platinum' ); ?></option>
					<option value="h3"><?php esc_html_e( 'Subheading', 'platinum' ); ?></option>
					<option value="blockquote"><?php esc_html_e( 'Quotation', 'platinum' ); ?></option>
				</select>
				<button type="button" class="wp-btn wp-b" data-fmt="bold" aria-label="<?php esc_attr_e( 'Bold', 'platinum' ); ?>">B</button>
				<button type="button" class="wp-btn wp-i" data-fmt="italic" aria-label="<?php esc_attr_e( 'Italic', 'platinum' ); ?>">I</button>
				<button type="button" class="wp-btn wp-u" data-fmt="underline" aria-label="<?php esc_attr_e( 'Underline', 'platinum' ); ?>">U</button>
				<span class="wp-sep"></span>
				<button type="button" class="write-key" data-fmt="insertUnorderedList"><?php esc_html_e( 'Bullets', 'platinum' ); ?></button>
				<button type="button" class="write-key" data-fmt="insertOrderedList"><?php esc_html_e( 'Numbers', 'platinum' ); ?></button>
				<button type="button" class="write-key" data-act="link"><?php esc_html_e( 'Link', 'platinum' ); ?></button>
				<button type="button" class="write-key" data-act="picture"><?php esc_html_e( 'Picture', 'platinum' ); ?></button>
				<input type="file" class="write-file" accept="image/*" hidden>
				<span class="paint-gap"></span>
				<button type="button" class="button write-save" data-act="save"><?php esc_html_e( 'Save', 'platinum' ); ?></button>
			</div>
			<div class="wp-ruler" aria-hidden="true"></div>
			<div class="wp-desk">
				<article class="doc doc--page">
					<h2 class="doc-title write-title" contenteditable="true" role="textbox" aria-label="<?php esc_attr_e( 'Title', 'platinum' ); ?>" data-placeholder="<?php esc_attr_e( 'Untitled', 'platinum' ); ?>"></h2>
					<div class="write-body" contenteditable="true" role="textbox" aria-multiline="true" aria-label="<?php esc_attr_e( 'Document text', 'platinum' ); ?>" data-placeholder="<?php esc_attr_e( 'Start writing…', 'platinum' ); ?>"><p><br></p></div>
				</article>
			</div>
			<div class="write-status" role="status"></div>
		</div>
		<?php platinum_window_close(); ?>
	</template>
	<?php endif; ?>

	<?php
	// About: how much is in each folder, shown as bars.
	$platinum_rows  = array();
	$platinum_terms = get_terms(
		array(
			'taxonomy'   => PLATINUM_TAX,
			'hide_empty' => false,
			'parent'     => 0,
			'orderby'    => 'term_id',
			'order'      => 'ASC',
		)
	);
	if ( ! is_wp_error( $platinum_terms ) ) {
		foreach ( $platinum_terms as $platinum_term ) {
			$platinum_rows[] = array( 'folder', $platinum_term->name, (int) $platinum_term->count );
		}
	}
	$platinum_rows[] = array( 'notes', __( 'Notes', 'platinum' ), (int) wp_count_posts( 'post' )->publish );
	$platinum_rows[] = array( 'doc', __( 'Documents', 'platinum' ), (int) wp_count_posts( 'page' )->publish );
	$platinum_most   = 1;
	foreach ( $platinum_rows as $platinum_row ) {
		$platinum_most = max( $platinum_most, $platinum_row[2] );
	}
	?>
	<template id="tpl-about">
		<?php platinum_window_open( 'app', sprintf( /* translators: %s: system name. */ __( 'About %s', 'platinum' ), PLATINUM_OS ), array( 'app' => 'about' ) ); ?>
		<div class="about">
			<div class="about-top">
				<?php echo platinum_icon( 'cel' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<p class="about-word"><?php echo esc_html( PLATINUM_OS ); ?></p>
			</div>
			<dl class="about-facts">
				<div><dt><?php esc_html_e( 'Version:', 'platinum' ); ?></dt><dd><?php echo esc_html( PLATINUM_OS . ' ' . PLATINUM_VERSION ); ?></dd></div>
				<div><dt><?php esc_html_e( 'Belongs to:', 'platinum' ); ?></dt><dd><?php bloginfo( 'name' ); ?></dd></div>
				<div><dt><?php esc_html_e( 'Built on:', 'platinum' ); ?></dt><dd>WordPress</dd></div>
			</dl>
			<ul class="about-list">
				<?php foreach ( $platinum_rows as $platinum_row ) : ?>
					<li>
						<span class="about-name"><?php echo platinum_icon( $platinum_row[0] ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $platinum_row[1] ); ?></span>
						<span class="about-count"><?php echo platinum_count_label( $platinum_row[2] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<span class="about-bar"><i style="width:<?php echo (int) round( 100 * $platinum_row[2] / $platinum_most ); ?>%"></i></span>
					</li>
				<?php endforeach; ?>
			</ul>
			<p class="about-small"><?php esc_html_e( 'An original design inspired by late-1990s desktops.', 'platinum' ); ?></p>
		</div>
		<?php platinum_window_close(); ?>
	</template>
	<?php
}

<?php
/**
 * The desktop. Every address on the site is drawn by this one file:
 * the menu bar and icons are always there, and the window for the current
 * address (a folder, a project, a page, Notes, My Music or the Trash) is already open.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$platinum_has_music = (bool) platinum_playlist();
$platinum_has_player = $platinum_has_music || platinum_can_write();
?><!doctype html>
<html class="no-js" <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="theme-color" content="#dddddd">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'platinum' ); ?>>
<?php wp_body_open(); ?>
<?php platinum_the_icon_defs(); ?>

<a class="skip-link" href="#desktop"><?php esc_html_e( 'Skip to content', 'platinum' ); ?></a>

<header class="menubar">
	<nav class="menus" aria-label="<?php esc_attr_e( 'Menu bar', 'platinum' ); ?>">
		<div class="menu menu--mark">
			<button type="button" class="menu-title" aria-haspopup="true" aria-expanded="false" aria-label="<?php esc_attr_e( 'Site menu', 'platinum' ); ?>">
				<?php echo platinum_icon( 'mark' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</button>
			<ul class="menu-list" hidden>
				<li><button type="button" data-cmd="about"><?php echo esc_html( sprintf( /* translators: %s: system name. */ __( 'About %s', 'platinum' ), PLATINUM_OS ) ); ?></button></li>
				<?php $platinum_readme = get_page_by_path( 'read-me' ); ?>
				<?php if ( $platinum_readme && 'publish' === $platinum_readme->post_status ) : ?>
				<li><a href="<?php echo esc_url( get_permalink( $platinum_readme ) ); ?>"><?php echo esc_html( get_the_title( $platinum_readme ) ); ?></a></li>
				<?php endif; ?>
				<li class="menu-rule" role="separator"></li>
				<?php if ( $platinum_has_player ) : ?>
				<li><button type="button" data-cmd="player"><?php echo platinum_icon( 'music' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Music', 'platinum' ); ?></button></li>
				<?php endif; ?>
				<li><button type="button" data-cmd="paint"><?php echo platinum_icon( 'paint' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Paint', 'platinum' ); ?></button></li>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="solitaire"><?php echo platinum_icon( 'cards' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Solitaire', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="mines"><?php echo platinum_icon( 'mines' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Mines', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="puzzle"><?php echo platinum_icon( 'puzzle' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Puzzle', 'platinum' ); ?></button></li>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="terminal"><?php echo platinum_icon( 'terminal' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Terminal', 'platinum' ); ?></button></li>
				<?php if ( platinum_can_write() ) : ?>
				<li class="phone-only"><button type="button" data-cmd="write"><?php echo platinum_icon( 'doc' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'New Document', 'platinum' ); ?></button></li>
				<li class="phone-only"><button type="button" data-cmd="edit-doc"><?php echo platinum_icon( 'doc' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Edit This Document', 'platinum' ); ?></button></li>
				<?php endif; ?>
				<li class="phone-only"><button type="button" data-cmd="wallpaper"><?php echo platinum_icon( 'pattern' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Appearance', 'platinum' ); ?></button></li>
			</ul>
		</div>
		<div class="menu">
			<button type="button" class="menu-title" aria-haspopup="true" aria-expanded="false"><?php esc_html_e( 'File', 'platinum' ); ?></button>
			<ul class="menu-list" hidden>
				<?php if ( platinum_can_write() ) : ?>
				<li><button type="button" data-cmd="write"><?php esc_html_e( 'New Document', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="new-note"><?php esc_html_e( 'New Note', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="new-folder"><?php esc_html_e( 'New Folder', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="add-file"><?php esc_html_e( 'Add File…', 'platinum' ); ?></button></li>
				<li class="menu-rule" role="separator"></li>
				<?php endif; ?>
				<li><a href="<?php echo esc_url( home_url( '/notes/' ) ); ?>"><?php esc_html_e( 'Open Notes', 'platinum' ); ?></a></li>
				<?php if ( $platinum_has_music ) : ?>
				<li><a href="<?php echo esc_url( home_url( '/music/' ) ); ?>"><?php esc_html_e( 'Open My Music', 'platinum' ); ?></a></li>
				<?php endif; ?>
				<?php if ( platinum_can_write() ) : ?>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="edit-doc"><?php esc_html_e( 'Edit This Document', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="rename-folder"><?php esc_html_e( 'Rename…', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="save-doc"><?php esc_html_e( 'Save', 'platinum' ); ?></button></li>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="trash-doc"><?php esc_html_e( 'Move to Trash', 'platinum' ); ?></button></li>
				<?php endif; ?>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="close"><?php esc_html_e( 'Close Window', 'platinum' ); ?></button></li>
				<li><button type="button" data-cmd="close-all"><?php esc_html_e( 'Close All', 'platinum' ); ?></button></li>
			</ul>
		</div>
		<div class="menu">
			<button type="button" class="menu-title" aria-haspopup="true" aria-expanded="false"><?php esc_html_e( 'View', 'platinum' ); ?></button>
			<ul class="menu-list" hidden>
				<li><button type="button" data-cmd="clean-up"><?php esc_html_e( 'Clean Up', 'platinum' ); ?></button></li>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="wallpaper"><?php esc_html_e( 'Appearance…', 'platinum' ); ?></button></li>
			</ul>
		</div>
		<div class="menu">
			<button type="button" class="menu-title" aria-haspopup="true" aria-expanded="false"><?php esc_html_e( 'Special', 'platinum' ); ?></button>
			<ul class="menu-list" hidden>
				<li><button type="button" data-cmd="empty-trash"><?php esc_html_e( 'Empty Trash…', 'platinum' ); ?></button></li>
				<li class="menu-rule" role="separator"></li>
				<li><button type="button" data-cmd="restart"><?php esc_html_e( 'Restart', 'platinum' ); ?></button></li>
			</ul>
		</div>
	</nav>
	<time class="clock" aria-hidden="true"></time>
	<div class="menu menu--apps">
		<button type="button" class="menu-title" aria-haspopup="true" aria-expanded="false">
			<?php echo platinum_icon( 'window' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<span><?php bloginfo( 'name' ); ?></span>
		</button>
		<div class="menu-list" hidden>
			<div class="tasks" role="group" aria-label="<?php esc_attr_e( 'Open windows', 'platinum' ); ?>" data-empty="<?php esc_attr_e( 'No windows open', 'platinum' ); ?>"></div>
			<div class="menu-rule" role="separator"></div>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" data-desktop><?php esc_html_e( 'Show Desktop', 'platinum' ); ?></a>
		</div>
	</div>
</header>

<main id="desktop" class="desktop" tabindex="-1">
	<nav class="icons" aria-label="<?php esc_attr_e( 'Desktop', 'platinum' ); ?>">
		<?php platinum_the_desktop_icons(); ?>
	</nav>
	<div class="windows">
		<?php platinum_the_window(); ?>
	</div>
	<nav class="strip" aria-label="<?php esc_attr_e( 'Control strip', 'platinum' ); ?>">
		<div class="strip-items">
			<?php if ( platinum_can_write() ) : ?>
			<button type="button" data-cmd="write" title="<?php esc_attr_e( 'New Document', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'New Document', 'platinum' ); ?>"><?php echo platinum_icon( 'doc' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<?php endif; ?>
			<?php if ( $platinum_has_player ) : ?>
			<button type="button" data-cmd="player" title="<?php esc_attr_e( 'Music', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Music', 'platinum' ); ?>"><?php echo platinum_icon( 'music' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<?php endif; ?>
			<button type="button" data-cmd="paint" title="<?php esc_attr_e( 'Paint', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Paint', 'platinum' ); ?>"><?php echo platinum_icon( 'paint' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" data-cmd="solitaire" title="<?php esc_attr_e( 'Solitaire', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Solitaire', 'platinum' ); ?>"><?php echo platinum_icon( 'cards' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" data-cmd="mines" title="<?php esc_attr_e( 'Mines', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Mines', 'platinum' ); ?>"><?php echo platinum_icon( 'mines' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" data-cmd="puzzle" title="<?php esc_attr_e( 'Puzzle', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Puzzle', 'platinum' ); ?>"><?php echo platinum_icon( 'puzzle' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" data-cmd="terminal" title="<?php esc_attr_e( 'Terminal', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Terminal', 'platinum' ); ?>"><?php echo platinum_icon( 'terminal' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" data-cmd="wallpaper" title="<?php esc_attr_e( 'Appearance', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Appearance', 'platinum' ); ?>"><?php echo platinum_icon( 'pattern' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<button type="button" data-cmd="sound" aria-pressed="true" title="<?php esc_attr_e( 'Sound', 'platinum' ); ?>" aria-label="<?php esc_attr_e( 'Sound', 'platinum' ); ?>"><?php echo platinum_icon( 'sound' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
		</div>
		<button type="button" class="strip-tab" data-cmd="strip" aria-label="<?php esc_attr_e( 'Hide or show the control strip', 'platinum' ); ?>"></button>
	</nav>
</main>

<div class="startup" aria-hidden="true">
	<div class="startup-box">
		<div class="startup-brand">
			<?php echo platinum_icon( 'cel' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<p class="startup-word"><?php echo esc_html( PLATINUM_OS ); ?></p>
		</div>
		<p class="startup-text"><?php echo esc_html( sprintf( /* translators: %s: system name. */ __( 'Welcome to %s.', 'platinum' ), PLATINUM_OS ) ); ?></p>
		<div class="startup-bar"><span></span></div>
	</div>
	<div class="startup-icons">
		<?php
		foreach ( array( 'folder', 'doc', 'mail', 'notes', 'music', 'paint', 'mines', 'puzzle', 'terminal', 'pattern' ) as $platinum_i => $platinum_name ) {
			echo '<span style="--i:' . (int) $platinum_i . '">' . platinum_icon( $platinum_name ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		?>
	</div>
</div>

<?php platinum_the_app_templates(); ?>
<?php wp_footer(); ?>
</body>
</html>

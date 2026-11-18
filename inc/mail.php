<?php
/**
 * The small pictures used in the mail window (Contact Me).
 * Original drawings, 24 by 20, one line each.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return array name => SVG shapes.
 */
function platinum_mail_glyphs() {
	return array(
		'new'      => '<path d="M7 3.500h8l4 4v11H7z" fill="#fff" stroke="#000"/><path d="M15 3.500v4h4" fill="#ccccff" stroke="#000"/><path d="M5.500 1v7M2 4.500h7M3 2l5 5M8 2L3 7" stroke="#e0261c" stroke-width="1.200"/>',
		'reply'    => '<path d="M6.500 8.500h15v10h-15z" fill="#fff" stroke="#000"/><path d="M6.500 8.500l7.500 5.500 7.500-5.500" fill="none" stroke="#000"/><path d="M8 1L2 5l6 4V6.500h5v-3H8z" fill="#e0261c" stroke="#000" stroke-width=".800" stroke-linejoin="round"/>',
		'replyall' => '<path d="M9.500 6.500h12v8h-12z" fill="#ccccff" stroke="#000"/><path d="M6.500 9.500h13v9h-13z" fill="#fff" stroke="#000"/><path d="M6.500 9.500l6.500 5 6.500-5" fill="none" stroke="#000"/><path d="M6.500 1L1.500 4.500l5 3.500V6h3V3h-3zM13 1L8 4.500l5 3.500V6h3V3h-3z" fill="#e0261c" stroke="#000" stroke-width=".800" stroke-linejoin="round"/>',
		'forward'  => '<path d="M2.500 8.500h15v10h-15z" fill="#fff" stroke="#000"/><path d="M2.500 8.500l7.500 5.500 7.500-5.500" fill="none" stroke="#000"/><path d="M16 1l6 4-6 4V6.500h-5v-3h5z" fill="#3a55c8" stroke="#000" stroke-width=".800" stroke-linejoin="round"/>',
		'person'   => '<circle cx="10" cy="6" r="3.500" fill="#f1c9a0" stroke="#000"/><path d="M3.500 18.500c0-5 2.500-7 6.500-7s6.500 2 6.500 7z" fill="#3a55c8" stroke="#000" stroke-linejoin="round"/><path d="M19.500 2v7M16 5.500h7" stroke="#e0261c" stroke-width="1.600"/>',
		'bin'      => '<path d="M6.500 6.500h11l-1 12h-9z" fill="#cfcfcf" stroke="#000" stroke-linejoin="round"/><path d="M5 4.500h14v2H5z" fill="#eee" stroke="#000"/><path d="M10 4.500V2.500h4v2" fill="none" stroke="#000"/><path d="M9.500 9v7M12 9v7M14.500 9v7" stroke="#666"/>',
		'book'     => '<path d="M5.500 2.500h13v15h-13z" fill="#3a55c8" stroke="#000"/><path d="M5.500 2.500h3v15h-3z" fill="#16205e" stroke="#000"/><path d="M11 6h5M11 8.500h5" stroke="#fff"/><path d="M18.500 5h2v2.500h-2zM18.500 9h2v2.500h-2zM18.500 13h2v2.500h-2z" fill="#e8c14a" stroke="#000" stroke-width=".700"/>',
		'find'     => '<circle cx="9.500" cy="8.500" r="5.500" fill="#dfe8ff" stroke="#000" stroke-width="1.400"/><path d="M13.500 12.500l6.500 6" stroke="#000" stroke-width="3" stroke-linecap="round"/><path d="M6.500 7a3.500 3.500 0 0 1 3-2.200" fill="none" stroke="#fff" stroke-width="1.200"/>',
		'sync'     => '<path d="M2.500 9.500h13v9h-13z" fill="#fff" stroke="#000"/><path d="M2.500 9.500l6.500 5 6.500-5" fill="none" stroke="#000"/><path d="M15.500 1l3.500 4h-2.200v4.500h-2.600V5H12z" fill="#3a55c8" stroke="#000" stroke-width=".700" stroke-linejoin="round"/><path d="M21.500 13.500L18 9.500h2.200V5h2.600v4.500H25z" transform="translate(-2 0)" fill="#e0261c" stroke="#000" stroke-width=".700" stroke-linejoin="round"/>',
		'clip'     => '<path d="M16.500 6.500l-7 7a2.200 2.200 0 0 0 3.100 3.100l7.500-7.500a3.800 3.800 0 0 0-5.400-5.400l-8 8a5.400 5.400 0 0 0 7.600 7.600l6.200-6.200" fill="none" stroke="#000" stroke-width="1.300" stroke-linecap="round"/>',
		'inbox'    => '<path d="M2.500 11.500h5l1.500 2.500h6l1.500-2.500h5v7h-19z" fill="#3a55c8" stroke="#000" stroke-linejoin="round"/><path d="M12 1v5.500M8.500 5.500L12 10l3.500-4.500z" fill="#e0261c" stroke="#e0261c" stroke-width="1.600" stroke-linejoin="round"/>',
		'outbox'   => '<path d="M2.500 11.500h5l1.500 2.500h6l1.500-2.500h5v7h-19z" fill="#3a55c8" stroke="#000" stroke-linejoin="round"/><path d="M12 10V4.500M8.500 5.500L12 1l3.500 4.500z" fill="#e0261c" stroke="#e0261c" stroke-width="1.600" stroke-linejoin="round"/>',
		'sent'     => '<path d="M3.500 4.500h17v12h-17z" fill="#fff" stroke="#000"/><path d="M3.500 4.500l8.500 6.500 8.500-6.500" fill="none" stroke="#000"/><path d="M14 12.500l2.200 2.500 4.300-5" fill="none" stroke="#3a55c8" stroke-width="1.800"/>',
		'drafts'   => '<path d="M2.500 6.500V4l1.500-1.500h5L10.500 4h9l2 2.500v11h-19z" fill="#a9bdf2" stroke="#16205e" stroke-linejoin="round"/><path d="M2.500 7.500h19" stroke="#16205e"/>',
	);
}

/**
 * One mail picture as inline SVG.
 *
 * @param string $name Glyph name.
 * @return string
 */
function platinum_mail_glyph( $name ) {
	$shapes = platinum_mail_glyphs();
	if ( ! isset( $shapes[ $name ] ) ) {
		return '';
	}
	return '<svg class="mail-glyph" viewBox="0 0 24 20" width="24" height="20" aria-hidden="true" focusable="false">' . $shapes[ $name ] . '</svg>';
}

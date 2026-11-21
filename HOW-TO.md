# How to run your desktop site

Everything visitors see comes from WordPress. You never need to touch the theme files for day-to-day changes.

| On the desktop | Where you edit it in WordPress |
|---|---|
| Folders (Creative, Career, Community, Coaching) | Portfolio > Project Types |
| Files inside a folder | Portfolio > Projects |
| Documents on the desktop (About Me, Contact Me, CV) | Pages |
| Notes | Posts |
| Joke files in the Trash | A page called "Trash files" |
| Playlists in My Music and the Music player | A page called "Playlist" |
| Your name at the right of the menu bar and in About RetroOS | Settings > General > Site Title |
| The system's name, RetroOS, on the start-up screen and in About | One line near the top of `functions.php`: `define( 'PLATINUM_OS', 'RetroOS' );` |

## The Read Me (your introduction)

A page called "Read Me" (its address must be `read-me`) is your introduction. It does three jobs:

- it opens by itself the first time someone visits the site, so they learn who you are and how to use the desktop;
- its opening words (about 155 characters) are what Google and link previews show under your name;
- it sits on the desktop and in the menu at the far left of the menu bar.

Edit it like any document: open it and press Edit. Keep the first sentence about you, since that is the part search engines show.

Visitors who click an icon once and wait are shown "Double-click an icon to open it", twice at most; you never see it while logged in.

## Write on the desktop itself

When you are logged in to WordPress, the desktop gains a word processor that visitors never see.

1. Choose File > New Document (or the page icon at the left of the control strip).
2. Type a title at the top of the page, then write. The toolbar gives paragraph styles, bold, italic, underline, bulleted and numbered lists, links and pictures.
3. Choose Save (the button, File > Save, or Command-S). The first time, pick where it goes: Notes (a blog post), the desktop (a page) or one of your folders (a project). Tick "Keep as a draft" to hide it from visitors for now.
4. After that, Save updates the same document.

To put a document straight into a folder, open that folder first (Creative, say), then choose File > New Document. When you save, that folder is already chosen. You can still pick another place in the Save dialog.

To change something already on the site, open it and press Edit at the top of its window (or choose File > Edit This Document). You can also click a file once to select it and choose File > Edit This Document without opening it.

To remove a document, do any one of these:

- drag its file onto the Trash icon;
- open it and press Move to Trash at the top of its window;
- click its file once and choose File > Move to Trash.

You are asked to confirm first. The document is taken off the site and kept in WordPress's own Trash for 30 days: to put it back, go to Portfolio (or Pages, or Posts) in WordPress, open Trash and choose Restore. The Trash window on the desktop only holds the joke files.

For a quick note, choose File > New Note, or open Notes and press New Note. It is the same page with Notes already chosen in the Save dialog. Edit This Note, beside it, opens the note you are reading.

Things to know:

- In a project, the first picture you add also becomes the file's icon and cover.
- Pasted text arrives as plain text, so formatting from other programs is not carried over.
- Documents that contain a form, a file, an embedded player or other special blocks cannot be opened here; the desktop offers to open them in WordPress instead, so nothing in them is lost.
- Closing with unsaved changes asks whether to save. One document can be open for writing at a time.
- Deleting a folder and setting the page order are still done in WordPress.
- If Save says you are no longer logged in, log in to WordPress in another tab and press Save again; your text stays on the page.

## Add your own files to a folder

While logged in, you can put PDFs, pictures and other files from your computer straight into a folder.

- **Drag and drop:** drag the file from your computer onto a folder icon, or into an open folder window.
- **Or use the menu:** open the folder (or click it once), then choose File > Add File… and pick one or more files.

A line at the bottom of the screen shows progress. Each file then appears in the folder, named after the file. A PDF opens as a document viewer with a Download button; a picture opens as a document showing the picture, and also becomes the file's icon; anything else opens with a link to download it.

Very large files are slow for visitors, above all on phones. For PDFs, try to stay under about 10 MB; in Preview on a Mac, File > Export… with the Quartz Filter "Reduce File Size" makes a smaller copy.

## Rename a file or a folder

Click it once to select it, then click its name and type the new one. Press Return to keep it, or Escape to cancel. File > Rename… does the same. Renaming a file changes the name visitors see, not its web address.

## Folders, from the desktop

When you are logged in:

- **New folder:** File > New Folder, type a name, Create. It appears on the desktop straight away. With a folder window open in front, the new folder goes inside that folder instead.
- **Folders inside folders:** drag a folder onto another folder (its icon or its open window) to put it inside. Drag a folder out of its window onto an empty part of the desktop to bring it back to the desktop. A folder window shows its subfolders first, and the line under its title says which folder it sits in (click that name to go up). In WordPress, the same thing is the "Parent" setting under Portfolio > Project Types. Moving folders works on a computer, not on a phone.
- **Rename:** click a folder once to select it, then click its name (or choose File > Rename Folder). Type the new name and press Return. Escape cancels. The folder's web address keeps its original wording.
- **Move a project:** open a folder, then drag a file onto another folder's icon or onto another open folder window.

Only projects live in folders. Desktop documents (pages) and notes cannot be dropped into one. Deleting a folder is still done in WordPress, under Portfolio > Project Types.

## Add a project to a folder

1. Go to Portfolio > Add New.
2. Give it a title. This is the file name visitors see.
3. Write the content with the usual blocks: text, images, video, links.
4. In the sidebar, under Project Types, tick one folder.
5. Set a Featured image. It becomes the file's icon and the cover at the top of the window. Without one, the file shows a plain document icon.
6. Publish.

The newest project appears first in its folder.

## Add a shortcut to another site

A project that contains only one link to another site (and at most a short line of text) becomes a shortcut: its file shows a small arrow in the corner, and opening it takes the visitor to that site in a new tab.

1. Go to Portfolio > Add New (or File > New Document on the desktop).
2. Give it a title, paste the link as the only content, and tick a folder.
3. Publish.

The icon is chosen from the address: a code file for GitHub, a joystick for games on the Internet Archive (archive.org/details/…), and a globe for anything else. A Featured image, if you set one, is used instead.

## Add, rename or remove a folder

Go to Portfolio > Project Types.

- Add a type and a new folder appears on the desktop.
- Rename a type and the folder is renamed.
- Delete a type and the folder goes. Its projects are not deleted; they just have no folder until you tick another one.

Folders appear in the order you created them.

## Add or change a desktop document

Every published top-level page appears on the desktop as a document. Add a page and it shows up; set it to Draft and it leaves.

- Order: set Order under Page Attributes (lowest number first).
- Icon: a page whose address contains "contact" gets an envelope; "cv" or "resume" gets a CV icon; everything else gets a document icon.

## Replace the CV

In WordPress, open the CV page, select the File block, and choose Replace to upload the new PDF.

Any page or project that contains a PDF opens as a document viewer: the PDF itself fills the window, page by page, with Full screen and Download buttons above it. The other text on that page is not shown. On phones and tablets, whose browsers cannot show a PDF inside a page, the pages are drawn as pictures instead, using PDF.js (a free library from Mozilla, loaded from cdnjs only when someone opens a PDF on such a device).

## Write a note

Posts > Add New, write, Publish. It appears at the top of the Notes window.

## Change the Trash jokes

Create a page titled "Trash files" (its address must start with "trash"). Add a List block. Each line is one file, written as:

    file name: message shown when someone opens it

Set the page to Private if you do not want it to have a public address. Without this page, three built-in joke files are shown.

## Add music

Every song is one YouTube video, and one file in the My Music folder. You add them on the desktop itself, while logged in to WordPress.

1. Open Music from the menu at the far left of the menu bar, or from the control strip.
2. In the box at the bottom, paste a YouTube link to a song.
3. Type a name beside it if you like. Left empty, the song's own title on YouTube is used.
4. Press Add.

If you paste a link to a whole YouTube playlist instead, it is split up: each song in it (up to 100) is added as its own file. Songs already in your list are skipped.

To take a song out, press the × at the end of its row. Visitors never see the box or the × buttons.

The player plays the songs in order and moves on by itself when one ends. Its round buttons are, from left to right: previous song, back 15 seconds, play or pause, forward 15 seconds, next song. Clicking a song in the list, or opening its file in My Music, plays that one.

The links are kept on a WordPress page called "Playlist", which the desktop writes for you. Anything other than the YouTube links on that page is replaced the next time you add or remove a song here.

Nothing is loaded from YouTube until a visitor opens the Music player. Videos whose owners have switched off embedding will not play. My Music and the Music player appear for visitors only when there is at least one song.

## The contact form

The Contact Me page opens as a new message being written to you: a toolbar, To and Subject lines, then whatever you put on the page, which is the Form block. Send in the toolbar sends the form, like the button under the message; the other tools are decoration. A short line under the form says how the details are used.

Messages are emailed to the address on your WordPress account (or the one you set on the Form block) and are also kept in WordPress under Feedback > Form responses. Your private email address is not shown anywhere on the site.

- To change the fields, the button or the subject line, edit the Contact Me page in WordPress (the desktop word processor cannot open a page with a form in it).
- To send messages to a different address, select the Form block and set it under the block's settings, "Email address to send to".
- Opening Contact Me reloads the page once, so that the form's own checks and spam protection can run.

## The Browser and your links

A page whose address starts with "links" opens as a web browser window, and appears on the desktop with a globe icon.

1. Create a page titled "Links" (or edit it from the desktop: open it, then File > Edit This Document).
2. Write a List. On each line, type the name of the site, select it and add the link, then a short description after it if you like.
3. Publish.

Each link opens the real site in a new tab. Sites such as LinkedIn and Instagram do not allow themselves to be shown inside another site's window, so they cannot open inside the Browser itself.

## How pages look

- A page or project opens as a word-processor document: its title at the top, then your content on a white page. The toolbar and ruler are decoration.
- A page whose address contains "contact" opens as a mail window, with your site name in "To" and the page title in "Subject". Put your contact details or a Form block in the page as usual.
- Blog posts open in Notes as plain typewriter text.

## The built-in apps

Paint, Mines, Solitaire, Puzzle, Terminal and Appearance need no upkeep. Visitors open them from the menu at the far left of the menu bar or from the control strip at the bottom left. Nothing a visitor draws or plays is saved on your site; "Save picture" in Paint downloads to their own device.

## Sounds and motion

The desktop answers almost every action with a short sound, in the manner of a late-1990s desktop: menus opening, each item you pass over, the item you choose; buttons going down and coming back up; icons being picked up and put down; windows opening, closing, rolling up, and chittering while dragged; a chord at start-up; and a few in the games. They are generated by the visitor's browser, so there are no audio files to look after. The speaker button at the end of the control strip switches them off, and each visitor's choice is remembered in their own browser. Browsers only allow sound after a first click, so the start-up chord plays on that click, or on Special > Restart.

Windows open and close with a run of outlines between the icon and the window, and a chosen menu item blinks before the menu closes. Visitors who ask their device for reduced motion get neither.

To remove the sounds altogether, take `sound` out of the list of extras below and delete the Sound button from the control strip in `index.php`.

## Switch an extra off

In `functions.php` there is one line listing the extras:

    $scripts = array( 'desktop', 'sound', 'pdfview', 'startup', 'wallpaper', 'terminal', 'puzzle', 'paint', 'mines', 'solitaire', 'player' );

Remove a name to switch that extra off. `desktop` must stay. Also remove that app's lines from the menu and the control strip in `index.php` (`wallpaper` is Appearance, `player` is Music).

## Things to know

- Each folder, project, page and note has its own address, so you can share a link straight to it.
- Menus, window titles and buttons use ChicagoFLF by Robin Casady, a public-domain font stored inside the theme (`assets/fonts`). Its readme sits beside it.
- On phones, visitors get an icon grid and full-screen windows instead of a draggable desktop.
- The start-up screen shows once per visitor. Special > Restart shows it again.
- About RetroOS (first item in the menu at the far left) counts what is in each folder, in Notes and on the desktop, and updates by itself.
- The icon in the browser tab, in bookmarks and in link previews is the RetroOS mark (`assets/img`). To use a different picture, choose one under Settings > General > Site Icon in WordPress; it then takes over.
- The smiling mark is drawn inside the theme (`inc/icons.php`, the entries called `mark` and `cel`), not taken from the WordPress Site Icon.
- The desktop pattern a visitor picks under Appearance is remembered in their own browser only.
- The box at the right of each title bar rolls the window up into its title bar; the menu at the far right of the menu bar lists the open windows.
- Visitors can use the desktop as they would a real one: click an icon to select it and double-click to open it; drag icons anywhere, on the desktop or inside a folder window; drag across the empty desktop to select several; shift-click to add to a selection; double-click a title bar to roll a window up. View > Clean Up tidies the front folder window, or the desktop when no folder is in front.
- Where a visitor leaves the icons is remembered in their own browser only. It does not change the layout for anyone else, and you cannot set a custom arrangement for all visitors from WordPress.
- Embedded players that rely on scripts may need the visitor to open the item's own link directly if they do not load inside a window.

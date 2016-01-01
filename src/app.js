'use strict';
/* global console, process, require, application, 
   Window, WebView, MenuItem, Notification, Menu, 
   MenuItemSeparator, Panel */

require('Common');
var fs      = require('fs');
var screens = require('Screens');
var pkg     = require('./package.json');

/////////////////////////////////// Globals. ///////////////////////////////////

var LOCATION_ABOUT = 'app://static/about.html';
var LOCATION_PREFS = 'app://static/preferences.html';
var LOCATION_LOGIN = 'https://www.messenger.com/login/';

var PATH_IJ_COMMON = __dirname + '/js/i_common.js';
var PATH_IJ_VISUAL = __dirname + '/js/i_visual.js';
var PATH_IJ_NOTIFS = __dirname + '/js/i_notifications.js';

var g_notifications_enabled = true;
var g_win_main_focused = false;
var g_focused_window = null;

var win_main  = null;
var win_prefs = null;
var win_about = null;

var web_main  = null;
var web_notif = null;

var IS_MAC    = require('os').platform().toLowerCase() == 'darwin';


/////////////////////////////////// Windows. ///////////////////////////////////

var show_main_window = function () {
  if (win_main) {
    console.log('WEB_MAIN: window exists.');
    return win_main.bringToFront();
  }

  win_main = create_window({
    title           : pkg.longname,
    backgroundColor : 'white',
    canBeFullscreen : true,
    width           : 900,
    height          : 620,
    x               : (screens.active.bounds.width / 2) - 450,
    y               : (screens.active.bounds.height / 2) - 310,
  });

  create_menu_for_window(win_main);

  /** The web view. */
  web_main = new WebView();
  web_main.top = web_main.left = web_main.right = web_main.bottom = 0;
  web_main.location = LOCATION_LOGIN;
  win_main.appendChild(web_main);
  win_main.addEventListener('focus',   function () { g_win_main_focused = true;  });
  win_main.addEventListener('blur',    function () { g_win_main_focused = false; });
  win_main.addEventListener('close',   function () { win_main = null;            });
  web_main.addEventListener('message', handler_for_webview('WEB_MAIN'));
  web_main.addEventListener('load',    function () {
    console.log('WEB_MAIN: Loaded', web_main.location);
    try {
      console.log('WEB_MAIN: INJECTING SCRIPTS');
      web_main.execute(fs.readFileSync(PATH_IJ_COMMON, 'utf-8'));
      web_main.execute(fs.readFileSync(PATH_IJ_VISUAL, 'utf-8'));
    } catch (e) {
      console.log('WEB_MAIN: ERROR injecting scripts', e);
    }
  });

  win_main.visible = true;
};

/** 
 * Creates or brings about window to front
 */
var show_about_window = function() {

  if (win_about)
      return win_about.bringToFront();
  
  // Create about window
   win_about = create_window({
     panel           : true,
     canBeFullscreen : false,
     width           : 284,
     height          : 212,
     x               : (screens.active.bounds.width / 2) - 150,
     y               : (screens.active.bounds.height / 2) - 200,
   });

  // Actual content
  var webview_about = new WebView();
      webview_about.transparent = true;
      webview_about
        .top = webview_about
        .left = webview_about
        .right = webview_about
        .bottom = 0;
      webview_about.location = LOCATION_ABOUT;
      webview_about.addEventListener('load', function() {
        try {
          webview_about.execute('version(\'' + JSON.stringify(pkg) + '\');');
        } catch (e) {
          console.log('error injecting package version in about panel');
        }
      });

  win_about.appendChild(webview_about);
  win_about.addEventListener('close', function () {win_about = null;});
  win_about.visible = true;
};

/** 
 * Creates or brings preferences window to front
 */
var show_preferences_window = function () {

  if (win_prefs)
      return win_prefs.bringToFront();
  
  win_prefs = create_window({
    title           : 'Preferences',
    canBeFullscreen : false,
    width           : 194,
    height          : 122,
    x               : (screens.active.bounds.width / 2) - 150,
    y               : (screens.active.bounds.height / 2) - 200,
  });

  var prefs_webview = new WebView();
      prefs_webview.transparent = true;
      prefs_webview
        .top = prefs_webview
        .left = prefs_webview
        .right = prefs_webview
        .bottom = 0;
      prefs_webview.location = LOCATION_PREFS;
      prefs_webview.addEventListener('message', function (settings) {
        console.log('haosdfl');
        settings = JSON.parse(settings);
        g_notifications_enabled = settings.notifications;
        console.log('notificaitons', g_notifications_enabled);
      });
      prefs_webview.addEventListener('load', function() {
        try {
          prefs_webview.execute('setup(\'' + JSON.stringify({
            notifications : g_notifications_enabled
          }) + '\');');
        } catch (e) {
          console.log('error injecting settings in preferences window');
        }
      });

  win_prefs.appendChild(prefs_webview);
  win_prefs.addEventListener('close', function () {
    win_prefs = null;
  });
  win_prefs.visible = true;
};

/** 
 * Closes topmost focused window
 */
var close_top_window = function() {
  if (g_focused_window === win_main) {
    win_main.visible = false;
    return;
  } else {
    g_focused_window.fireEvent('close');
    g_focused_window.destroy();
  }
};

//////////////////////////////////// Menus. ////////////////////////////////////

/** The menus */

var create_menu_for_window = function (win) {

  var mainMenu   = new Menu();
  var appleMenu  = new MenuItem(application.name, '');
  var fileMenu   = new MenuItem('File', '');
  var editMenu   = new MenuItem('Edit', '');
  var windowMenu = new MenuItem('Window', '');
  var helpMenu   = new MenuItem('Help', '');

  if (IS_MAC)
  mainMenu.appendChild(appleMenu);
  mainMenu.appendChild(fileMenu);
  mainMenu.appendChild(editMenu);
  mainMenu.appendChild(windowMenu);
  mainMenu.appendChild(helpMenu);

  var appleSubmenu  = new Menu(application.name);
  var fileSubmenu   = new Menu('File');
  var editSubmenu   = new Menu('Edit');
  var windowSubmenu = new Menu('Window');
  var helpSubmenu   = new Menu('Help');

  appleSubmenu
    .appendChild(new MenuItem('About ' + application.name, ''))
    .addEventListener('click', show_about_window);
  appleSubmenu
    .appendChild(new MenuItemSeparator());
  appleSubmenu
    .appendChild(new MenuItem('Preferences...', ','))
    .addEventListener('click', show_preferences_window);
  appleSubmenu
    .appendChild(new MenuItemSeparator());
  appleSubmenu
    .appendChild(new MenuItem('Hide ' + application.name, 'h'))
    .addEventListener('click', function() { application.visible = false; });
  appleSubmenu
    .appendChild(new MenuItem('Hide Others', ''))
    .addEventListener('click', function() { application.hideAllOtherApplications(); });
  appleSubmenu
    .appendChild(new MenuItem('Show All', ''))
    .addEventListener('click', function() { application.unhideAllOtherApplications(); });
  appleSubmenu
    .appendChild(new MenuItemSeparator());
  appleSubmenu
    .appendChild(new MenuItem('Quit ' + application.name, 'q'))
    .addEventListener('click', function() { process.exit(0); });

  fileSubmenu
    .appendChild(new MenuItem('Close window', 'w'))
    .addEventListener('click', close_top_window);

  editSubmenu
    .appendChild(new MenuItem('Undo', 'u'))
    .addEventListener('click', function() { application.undo(); });
  editSubmenu
    .appendChild(new MenuItem('Redo', 'r'))
    .addEventListener('click', function() { application.redo(); });
  editSubmenu
    .appendChild(new MenuItemSeparator());
  editSubmenu
    .appendChild(new MenuItem('Copy', 'c'))
    .addEventListener('click', function() { application.copy(); });
  editSubmenu
    .appendChild(new MenuItem('Cut', 'x'))
    .addEventListener('click', function() { application.cut(); });
  editSubmenu
    .appendChild(new MenuItem('Paste', 'p'))
    .addEventListener('click', function() { application.paste(); });
  editSubmenu
    .appendChild(new MenuItem('Select All', 'a'))
    .addEventListener('click', function() { application.selectAll(); });

  windowSubmenu
    .appendChild(new MenuItem('Minimize', 'm'))
    .addEventListener('click', function() { g_focused_window.state = 'minimized'; });
  // windowSubmenu
  //   .appendChild(new MenuItemSeparator());
  // windowSubmenu
  //   .appendChild(new MenuItem('Bring All to Front', ''))
  //   .addEventListener('click', function() { g_focused_window.bringToFront(); }); // TODO
  // windowSubmenu
  //   .appendChild(new MenuItemSeparator());

  helpSubmenu
    .appendChild(new MenuItem('Website', ''))
    .addEventListener('click', function() { console.log('Do something for website?!'); });
  helpSubmenu
    .appendChild(new MenuItem('License', ''))
    .addEventListener('click', function() { console.log('Do something for license?!'); });

  appleMenu.submenu  = appleSubmenu;
  fileMenu.submenu   = fileSubmenu;
  editMenu.submenu   = editSubmenu;
  windowMenu.submenu = windowSubmenu;
  helpMenu.submenu   = helpSubmenu;

  win.menu = mainMenu; 
};


/////////////////////////////////// Helpers. ///////////////////////////////////

/**
 * Creates window or panel with specified
 * properties
 * @param  {Object} opts properties to be set
 * @return {Object}      Window, Panel or null on error.
 */
var create_window = function (opts) {

  var new_win;
  try {
    // Setup mcjiggs.
    new_win = opts.panel ? new Panel() : new Window();
    new_win.addEventListener('focus', function() {
      g_focused_window = new_win;
    });

    // Apply properties
    Object.keys(opts).forEach(function (key) {
      if (key === 'panel') return;
      new_win[key] = opts[key];
    });

    return new_win;
  }

  catch (e) {
    console.log('ERROR: creating window', e);
    return null;
  }

};

/**
 * Notifies about a newly recieved message
 * @param  {Object} message Message object
 */
var notify_new_msg = function (message) {
  Notification.requestPermission(function(result) {
    if (!result || g_win_main_focused || !g_notifications_enabled) return;
    // Create a new notification
    var notify      = new Notification();
    notify.title    = message.name;
    notify.subtitle = message.time;
    notify.text     = message.text;
    notify.sound    = true;

    // // The text for the button at @img{assets/notifications_main_button.png}
    // notify.buttonLabel = "Main";
    // // The text for the button at @img{assets/notifications_aux_button.png}
    // notify.addEventListener('fired', function() {
    //   /* @hidden */ if(IS_MAC) {
    //     /* @hidden */ var xpos = Screens.active.bounds.width - 60;
    //     /* @hidden */ setTimeout(function() { $utils.clickAt(xpos,60); },1000); //TODO: Find a better way than hardcoding 80.
    //   /* @hidden */ } else {
    //     /* @hidden */ var xpos = Screens.active.bounds.width - 80;
    //     /* @hidden */ setTimeout(function() { $utils.clickAt(xpos, Screens.active.bounds.height - 60); },500);
    //   /* @hidden */ }
    // });

    notify.addEventListener('click', function(arg) {
      show_main_window();
    });

    // Throw the notification to the user's face.
    notify.dispatch();
  });
};

var handle_web_message = function(msg) {
  var data;
  try {
    data = JSON.parse(msg);
    if (!data.fun || !data.arg)
      throw new Error('Invalid call msg.');
  } catch (e) {
    console.log('  INVAL_CALL_MSG:', msg);
  }

  switch (data.fun) {
    case 'NOTIFY_NEW_MSG':
      console.log('  NOTIFICATION:', data.arg);
      notify_new_msg(data.arg);
      break;
    case 'DEBUG_LOG':
      console.log('  DEBUG_LOG:', data.arg);
      break;
    case 'DEBUG_ERROR':
      console.log('  DEBUG_ERROR:', data.arg);
      break;
    default:
      console.log('  NO_FUN_MSG:', msg);
      break;
  }
};

var handler_for_webview = function (webview) {
  return function (msg) {
    console.log(webview + ':');
    handle_web_message(msg);
  };
};

//////////////////////////////////// Setup. ////////////////////////////////////

/** Create and register new AppDelegate */
var $ = process.bridge.objc;
var CustomDelegate = $.AppDelegate2.extend('AppDelegate3');

// - (BOOL)applicationShouldHandleReopen:(NSApplication *)theApplication 
//                     hasVisibleWindows:(BOOL)flag
CustomDelegate.addMethod(
  'applicationShouldHandleReopen:hasVisibleWindows:', 'B@:@B', 
  function(self, selector, theApplication, hasVisibleWindows) {
    console.log(arguments);
    if (!hasVisibleWindows) show_main_window();
    return false;
});

CustomDelegate.register();
var delegate = CustomDelegate('alloc')('init');
$.NSApplication('sharedApplication')('setDelegate', delegate);

/** Setup the Application */
application.name = pkg.name;
application.exitAfterWindowsClose = false;

/** The notifications web view */
web_notif = new WebView();
web_notif.location = LOCATION_LOGIN;
web_notif.addEventListener('message', handler_for_webview('WEB_NOTIF'));
web_notif.addEventListener('load', function() {
  console.log('WEB_NOTIF: Loaded', web_notif.location);
  try {
    console.log('WEB_NOTIF: INJECTING SCRIPTS');
    web_notif.execute(fs.readFileSync(PATH_IJ_COMMON, 'utf-8'));
    web_notif.execute(fs.readFileSync(PATH_IJ_NOTIFS, 'utf-8'));
  } catch (e) {
    console.log('WEB_NOTIF: ERROR injecting scripts');
  }
});

show_main_window();

/////////////////////////////// Show this mcjigg ///////////////////////////////




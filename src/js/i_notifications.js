
// Message Helpers

/** Returns all unread messages.
 *  Note: This loads just the topmost message in a conversation. */
var unread_messages = function () {
  // var convo_list = document.querySelectorAll('ul[aria-label="Conversation List"]')[0];
  var unread_list = document.querySelectorAll('ul[aria-label="Conversation List"] > li[aria-live="polite"]');
  unread_list = unread_list ? Array.prototype.slice.call(unread_list) : [];

  var unread_msgs = unread_list.map(function (li) {
    // var img = li.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].src;
    var nme = li.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].textContent;
    var tme = li.childNodes[0].childNodes[0].childNodes[1].childNodes[0].textContent.replace(nme, '');
    var txt = li.childNodes[0].childNodes[0].childNodes[1].childNodes[1].textContent;
    return {
      // img: img,
      name: nme,
      time: tme,
      text: txt
    };
  });

  return unread_msgs;
};

/* returns `unread_messages` as a map of hashCode -> msg object. */
var unread_hashed = function () {
  return unread_messages().reduce(function(acc, x) {
    acc[JSON.stringify(x).hashCode()] = x;
    return acc;
  }, {});
};

/* posts a message for every new unread message */
var notify_new_unreads = function () {
  var new_unreads = unread_hashed();

  Object.keys(new_unreads)
  /* get all the new ones */
  .filter(function (nhash) {
    return !window.unread_msgs.hasOwnProperty(nhash);
  })
  /* post a message to app */
  .forEach(function (nhash) {
    post_message('NOTIFY_NEW_MSG', new_unreads[nhash]);
  });

  window.unread_msgs = new_unreads;
};

setTimeout(function () {
  /******************************* crete logger *******************************/
  try {
    var h = document.createElement('H1');
    h.style['position'] = 'absolute';
    h.style['background-color'] = '#EE0011';
    h.style['z-indez'] = 999999;
    if (LOGGER_ENABLED) document.body.appendChild(h);
    post_message('DEBUG_LOG', 'LOGGER IS ON.');
  } catch (e) {
    post_message('DEBUG_ERROR', 'ERROR with setup of log');
  }
  /*************************** load unread messages ***************************/
  try {
    window.unread_msgs = unread_hashed();
    post_message('DEBUG_LOG', 'Already unread messages loaded');
  } catch (e) {
    post_message('DEBUG_ERROR', 'Error getting initial unread messages');
  }
  /************************ set newmessage poll watch. ************************/
  try {
    setTimeout(notify_new_unreads, 5000);
    post_message('DEBUG_LOG', 'UNREAD POLL IS ON.');
  } catch (e) {
    post_message('DEBUG_ERROR', 'Error getting new unread messages: poll');
  }
  /********************** set newmessage observer watch. **********************/
  try {
    if (!window.WebKitMutationObserver)
      throw new Error('No support for WebKitMutationObserver');
    var target = document.querySelector('head > title');
    var observer = new window.WebKitMutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        h.textContent = mutation.target.textContent;
        notify_new_unreads();
      });
    });
    observer.observe(target, {
      subtree: true,
      characterData: true,
      childList: true
    });
    post_message('DEBUG_LOG', 'UNREAD TITLE OBSERVER IS ON.');
  } catch (e) {
    post_message('DEBUG_ERROR', 'Error getting new unread messages: title observer');
  }
} , 1000);

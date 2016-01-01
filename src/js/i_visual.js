'use strict';
/* global post_message */
setTimeout(function () {
  /**************** remove photo icon: we have no file dialogs ****************/
  try {
    var photo_upload = document.querySelectorAll('form[title="Add Files"]')[0];
    photo_upload.parentNode.removeChild(photo_upload);
    post_message('DEBUG_LOG', 'Upload photo removed');
  } catch (e) {
    post_message('DEBUG_ERROR', 'Error removing photo icon');
  }
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
} , 1000);

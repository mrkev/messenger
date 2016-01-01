'use strict';

var LOGGER_ENABLED = false;

///////////////////////////// Prototype Extensions /////////////////////////////

if (typeof String.prototype.hashCode !== 'function') {
  String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length === 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };
}

if (typeof String.prototype.trimLeft !== 'function') {
  String.prototype.trimLeft = function() {
    return this.replace(/^\s+/, '');
  };
}

if (typeof String.prototype.trimRight !== 'function') {
  String.prototype.trimRight = function() {
    return this.replace(/\s+$/, '');
  };
}

if (typeof Array.prototype.map !== 'function') {
  Array.prototype.map = function(callback, thisArg) {
      for (var i=0, n=this.length, a=[]; i<n; i++) {
        if (i in this) a[i] = callback.call(thisArg, this[i]);
      }
      return a;
  };
}

///////////////////////////////// Chalam Balam /////////////////////////////////

var post_message = function (fun, arg) {
  window.postMessageToHost(JSON.stringify({
    'fun' : fun,
    'arg' : arg
  }));
};


window.addEventListener('message', function (e) {
  var msg;
  try {
    msg = JSON.parse(e.data);
    if (!msg.fun || !msg.arg) throw new Error('non-tint JSON message');
  } catch (err) {
    return; // console.log('nope, not this message');
  }
  switch (msg.fun) {
    case 'PING':
      post_message('DEBUG_LOG', 'PINGBACK: ' + JSON.stringify(msg.arg));
      break;
    default:
      post_message('DEBUG_LOG:', 'WEBVIEW: No function. ' + JSON.stringify(msg.arg));
      break;
  }
});

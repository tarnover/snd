/* global Android */
let html;
try {
  html = require('choo/html');
} catch (e) {
  // running in the service worker
}
function arrayToB64(array) {
  let bin = '';
  for (let i = 0; i < array.length; i++) {
    bin += String.fromCharCode(array[i]);
  }
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function b64ToArray(str) {
  str =
    str.replace(/-/g, '+').replace(/_/g, '/') +
    '==='.slice((str.length + 3) % 4);
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

function locale() {
  return document.querySelector('html').lang;
}

function isFile(id) {
  return /^[0-9a-fA-F]{10,16}$/.test(id);
}

function copyToClipboard(str) {
  // navigator.clipboard only exists in secure contexts; plain-HTTP self-hosts
  // fall back to execCommand, which still works there.
  if (navigator.clipboard) {
    navigator.clipboard.writeText(str).catch(() => execCopy(str));
    return true;
  }
  return execCopy(str);
}

function execCopy(str) {
  const aux = document.createElement('input');
  aux.value = str;
  aux.readOnly = true;
  document.body.appendChild(aux);
  aux.select();
  aux.setSelectionRange(0, str.length); // iOS ignores select()
  let result = false;
  try {
    result = document.execCommand('copy');
  } catch (e) {
    // unsupported
  }
  document.body.removeChild(aux);
  return result;
}

const UNITS = ['bytes', 'kb', 'mb', 'gb'];
function bytes(num) {
  if (num < 1) {
    return '0B';
  }
  const exponent = Math.min(Math.floor(Math.log10(num) / 3), UNITS.length - 1);
  const n = Number(num / Math.pow(1024, exponent));
  const decimalDigits = Math.floor(n) === n ? 0 : 1;
  let nStr = n.toFixed(decimalDigits);
  try {
    nStr = n.toLocaleString(locale(), {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits
    });
  } catch (e) {
    // no document (service worker); keep toFixed
  }
  return translate('fileSize', {
    num: nStr,
    units: translate(UNITS[exponent])
  });
}

function percent(ratio) {
  try {
    return ratio.toLocaleString(locale(), { style: 'percent' });
  } catch (e) {
    return `${Math.floor(ratio * 100)}%`;
  }
}

function number(n) {
  try {
    return n.toLocaleString(locale());
  } catch (e) {
    return n.toString();
  }
}

function delay(delay = 100) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

function fadeOut(selector) {
  const classes = document.querySelector(selector).classList;
  classes.remove('effect--fadeIn');
  classes.add('effect--fadeOut');
  return delay(300);
}

function openLinksInNewTab(links, should = true) {
  links = links || Array.from(document.querySelectorAll('a:not([target])'));
  if (should) {
    links.forEach(l => {
      l.setAttribute('target', '_blank');
      l.setAttribute('rel', 'noopener noreferrer');
    });
  } else {
    links.forEach(l => {
      l.removeAttribute('target');
      l.removeAttribute('rel');
    });
  }
  return links;
}

function browserName() {
  try {
    // order of these matters
    if (/firefox/i.test(navigator.userAgent)) {
      return 'firefox';
    }
    if (/edge/i.test(navigator.userAgent)) {
      return 'edge';
    }
    if (/edg/i.test(navigator.userAgent)) {
      return 'edgium';
    }
    if (/trident/i.test(navigator.userAgent)) {
      return 'ie';
    }
    if (/chrome/i.test(navigator.userAgent)) {
      return 'chrome';
    }
    if (/safari/i.test(navigator.userAgent)) {
      return 'safari';
    }
    return 'other';
  } catch (e) {
    return 'unknown';
  }
}

async function streamToArrayBuffer(stream, size) {
  if (!size) {
    return new Response(stream).arrayBuffer();
  }
  // known size: write into one buffer to avoid holding chunks + copy (2x peak)
  const result = new Uint8Array(size);
  const reader = stream.getReader();
  let offset = 0;
  for (let s = await reader.read(); !s.done; s = await reader.read()) {
    result.set(s.value, offset);
    offset += s.value.length;
  }
  return result.buffer;
}

function list(items, ulStyle = '', liStyle = '') {
  const lis = items.map(
    i =>
      html`
        <li class="${liStyle}">${i}</li>
      `
  );
  return html`
    <ul class="${ulStyle}">
      ${lis}
    </ul>
  `;
}

function secondsToL10nId(seconds) {
  if (seconds < 3600) {
    return { id: 'timespanMinutes', num: Math.floor(seconds / 60) };
  } else if (seconds < 86400) {
    return { id: 'timespanHours', num: Math.floor(seconds / 3600) };
  } else {
    return { id: 'timespanDays', num: Math.floor(seconds / 86400) };
  }
}

function timeLeft(milliseconds) {
  if (milliseconds < 1) {
    return { id: 'linkExpiredAlt' };
  }
  const minutes = Math.floor(milliseconds / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) {
    return {
      id: 'expiresDaysHoursMinutes',
      days,
      hours: hours % 24,
      minutes: minutes % 60
    };
  }
  if (hours >= 1) {
    return {
      id: 'expiresHoursMinutes',
      hours,
      minutes: minutes % 60
    };
  } else if (hours === 0) {
    if (minutes === 0) {
      return { id: 'expiresMinutes', minutes: '< 1' };
    }
    return { id: 'expiresMinutes', minutes };
  }
  return null;
}

function platform() {
  if (typeof Android === 'object') {
    return 'android';
  }
  return 'web';
}

const ECE_RECORD_SIZE = 1024 * 64;
const TAG_LENGTH = 16;
function encryptedSize(size, rs = ECE_RECORD_SIZE, tagLength = TAG_LENGTH) {
  const chunk_meta = tagLength + 1; // Chunk metadata, tag and delimiter
  return 21 + size + chunk_meta * Math.ceil(size / (rs - chunk_meta));
}

let translate = function() {
  throw new Error('uninitialized translate function. call setTranslate first');
};
function setTranslate(t) {
  translate = t;
}

module.exports = {
  locale,
  fadeOut,
  delay,
  bytes,
  percent,
  number,
  copyToClipboard,
  arrayToB64,
  b64ToArray,
  isFile,
  openLinksInNewTab,
  browserName,
  streamToArrayBuffer,
  list,
  secondsToL10nId,
  timeLeft,
  platform,
  encryptedSize,
  setTranslate
};

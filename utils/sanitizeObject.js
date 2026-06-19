const sanitizeHtml = require('sanitize-html');

function sanitizeObjectStrings(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeHtml(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(item =>
        typeof item === 'string' ? sanitizeHtml(item)
        : typeof item === 'object' && item !== null ? sanitizeObjectStrings(item)
        : item
      );
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = sanitizeObjectStrings(obj[key]);
    }
  }
  return obj;
}

module.exports = sanitizeObjectStrings;

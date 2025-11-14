const rateLimit = require('express-rate-limit');
const ms = require('ms');

exports.contactLimiter = rateLimit({
    windowMs: ms('60m'),
    max: 5,
    message: 'You have exceeded the maximum number of messages allowed. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
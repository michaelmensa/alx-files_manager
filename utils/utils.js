import crypto from 'crypto';

const utils = {
  hashPassword: (string) => {
    // takes a string and hashes it with sha1
    return crypto.createHash('sha1').update(string).digest('hex');
  },

  decodeString: (string) => {
    return decodeURIComponent(escape(atob(string)));
  }
};

module.exports = utils;

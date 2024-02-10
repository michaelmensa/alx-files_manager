import crypto from 'crypto';

const utils = {
  hashPassword: (string) => {
    // takes a string and hashes it with sha1
    return crypto.createHash('sha1').update(string).digest('hex');
  },
};

module.exports = utils;

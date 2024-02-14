import crypto from 'crypto';

const utils = {
  // takes a string and hashes it with sha1
  hashPassword: (string) => crypto.createHash('sha1').update(string).digest('hex'),

  decodeString: (string) => Buffer.from(string, 'base64').toString('utf-8'),
};

module.exports = utils;

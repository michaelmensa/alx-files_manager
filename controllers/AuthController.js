import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import utils from '../utils/utils';

const authController = {
  getConnect: async (req, res) => {
    try {
      // retrieve the base64 string from header
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        res.status(401).json({ error: 'Unauthorized: No authorization header' });
      }
      const substrings = authorizationHeader.split(' ');
      const base64String = substrings[substrings.length - 1];

      // retrieve the email and password from base64 string
      const decodedString = utils.decodeString(base64String);
      const [email, _password] = decodedString.split(':');
      // hash password
      const password = utils.hashPassword(_password);

      // find user with password if exists
      const user = await dbClient.findUser(password);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const token = uuidv4();
        const key = `auth_${token}`;
        const duration = 86400;
        await dbClient.updateUserByField(email, 'auth_token', token);
        await redisClient.set(key, token, duration);
        res.status(200).json({ token });
      }
    } catch (error) {
      res.status(500).json({ Server: `getConnect Error ${error}` });
    }
  },

  getDisconnect: async (req, res) => {
    try {
      const token = req.headers['x-token'];
      const user = await dbClient.findUserByField('auth_token', token);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const { email } = user;
        await redisClient.del(`auth_${token}`);
        await dbClient.deleteUserField(email, 'auth_token');
        res.status(204).end();
      }
    } catch (error) {
      res.status(500).json({ Server: `Disconnect Internal Server Error: ${error}` });
    }
  },
};

module.exports = authController;

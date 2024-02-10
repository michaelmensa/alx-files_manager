import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const usersController = {
  postNew: async (req, res) => {
    const { email, password } = req.body;
    // check if email is missing
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    }

    // check if password is missing
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
    }

    try {
    // create user
      const existingUser = await dbClient.findUser(email);
      if (!existingUser) {
        const newUser = await dbClient.createUser(email, password);
        const { _id, email: _email } = newUser;
        res.status(201).json({ id: _id, email: _email });
      } else {
        res.status(400).json({ error: 'Already exist' });
      }
    } catch (error) {
      res.status(500).json({ error: `Error when creating user: ${error}` });
    }
  },

  getMe: async (req, res) => {
    // get token from custom X-Token Header
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const existingToken = await redisClient.get(`auth_${token}`);
      if (existingToken) {
        // find user with existingToken
        const user = await dbClient.findUserByField('auth_token', existingToken);
        const { _id, email: _email } = user;
        res.status(201).json({ id: _id, email: _email });
      }
    } catch (error) {
      res.status(500).json({ Server: `${error}` });
    }
  },
};

module.exports = usersController;

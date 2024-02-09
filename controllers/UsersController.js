import parser from '../server';
import dbClient from '../utils/db';
import crypto from 'crypto';

const usersController = {
  postNew: async (req, res) => {
    const { email, password } = req.body;

    try {
    // check if email is missing
    if (!email) {
      res.status(400).json({ error: 'Missing email'});
    }

    // check if password is missing
    if (!password) {
      res.status(400).json({ error: 'Missing password'});
    }

    // hash password with SHA
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // create user
    const existingUser = await dbClient.findUser(email);
    if (existingUser) {
      res.status(400).json({error: 'Already exist'});
     } else {
      const newUser = await dbClient.createUser(email, hashedPassword);
      const { _id, email: _email } = newUser;
      res.status(201).json({id: _id, email: _email});
     }
    } catch (error) {
      res.status(500).json({Server: `${error}`});
    }
  },
};

module.exports = usersController;

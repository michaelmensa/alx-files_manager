import redisClient from '../utils/redis';

const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
// const UserController = require('../controllers/UserController');

const router = express.Router();

// middleware to authenticate routes that need authentication
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const exists = await redisClient.get(`auth_${token}`);
    if (exists) {
      next();
    } else {
    res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ error: `Middleware Internal server error: ${error}` });
  }
};

// GET routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', authenticate, AuthController.getDisconnect);
router.get('/users/me', authenticate, UsersController.getMe);

// POST routes
router.post('/users', UsersController.postNew);

module.exports = router;

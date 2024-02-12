import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// should return { redis: true, db: true} with status code 200
// if redis is alive and if DB is alive
const appController = {
  getStatus: (req, res) => {
    try {
      const redisAlive = redisClient.isAlive();
      const dbAlive = dbClient.isAlive();
      res.status(200).json({ redis: redisAlive, db: dbAlive });
    } catch (error) {
      res.status(500).json({ Server: `${error}` });
    }
  },

  getStats: async (req, res) => {
    try {
      const countUsers = await dbClient.nbUsers();
      const countFiles = await dbClient.nbFiles();
      //await dbClient.deleteAllUsers();
      //await dbClient.deleteAllFiles();
      res.status(200).json({ users: countUsers, files: countFiles });
    } catch (error) {
      res.status(500).json({ Server: `${error}` });
    }
  },
};

module.exports = appController;

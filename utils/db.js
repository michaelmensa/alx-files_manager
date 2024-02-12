import { MongoClient } from 'mongodb';

require('dotenv').config();

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${dbHost}:${dbPort}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = dbName;

    // connect to db when DBClient instance is created
    (async () => {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    })();
  }

  // isAlive() to check if MongoClient is connected
  isAlive() {
    return this.client.topology.isConnected();
  }

  // async nbUsers to count number of docs in users collection
  async nbUsers() {
    const count = await this.db.collection('users').countDocuments();
    return count;
  }

  // async nbFiles to count number of documents in files collection
  async nbFiles() {
    const count = await this.db.collection('files').countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

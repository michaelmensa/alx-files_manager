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
    this.connect();
  }

  // connect to db
  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    } catch (error) {
      console.log('Error connecting to MongoDB', error);
    }
  }

  // isAlive to check if DB is connected
  isAlive() {
    try {
      return this.client.topology.isConnected();
    } catch (error) {
      return false;
    }
  }

  // async nbUsers to count number of docs in users collection
  async nbUsers() {
    try {
      const count = await this.db.collection('users').countDocuments();
      return count;
    } catch (error) {
      console.log('Error counting docs in users collection', error);
    }
  }

  // async nbFiles to count number of documents in files collection
  async nbFiles() {
    try {
      const count = await this.db.collection('files').countDocuments();
      return count;
    } catch (error) {
      console.log('Error counting docs in files collection', error);
    }
  }

  // async findUser() takes email arg and returns one user
  async findUser(email) {
    if (!email) {
      throw new Error('Email missing');
    }
    const user = await this.db.collection('users').findOne({ email });
    return user || null;
  }

  // async createUser() with takes email and password and saves to mongodb
  async createUser(email, password) {
    try {
      if (!email) {
        throw new Error('Email missing');
      }
      if (!password) {
        throw new Error('Password missing');
      }
      await this.db.collection('users').insertOne({ email, password });
    } catch (error) {
      console.log('Could not create user in users collection', error);
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

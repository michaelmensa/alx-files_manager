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

  // async findUser(email) returns user if exists otherwise null
  async findUser(email) {
    if (!email) {
      throw new Error('Email missing');
    }
    const user = await this.db.collection('users').findOne({ email });
    return user || null;
  }

  // async findUserByField() takes field and value args and returns one user
  async findUserByField(field, value) {
    const user = await this.db.collection('users').findOne({ [field]: value });
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

  // async updateUserByField() with takes email, field and value as args
  // and updates user document in users collection
  async updateUserByField(email, field, value) {
    const filter = { email };
    const update = { $set: { [field]: value } };
    await this.db.collection('users').updateOne(filter, update);
  }

  // async deleteUserField() deletes a field from user doc in collections user
  async deleteUserField(email, field) {
    const filter = { email };
    const update = { $unset: { [field]: 1 } };
    await this.db.collection('users').updateOne(filter, update);
  }

  // async deleteAllUsers() to delete all users
  async deleteAllUsers() {
    await this.db.collection('users').deleteMany({});
  }

  // async deleteUserByEmail(email)
  async deleteUserByEmail(email) {
    const filter = { email };
    const result = await this.db.collection('users').deleteOne(filter);
    if (result.deletedCount === 0) {
      console.log('No user found with email');
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

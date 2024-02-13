import { MongoClient } from 'mongodb';
import utils from './utils';

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
    const hashedPassword = utils.hashPassword(password);
    await this.db.collection('users').insertOne({ email, password: hashedPassword });
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

  // file collection methods

  // async createFile(File) takes a file object and inserts in collections 'files'
  async createFile(file) {
    await this.db.collection('files').insertOne(file);
  }

  // async getFile(key) takes file.key and finds the file
  async getFile(key) {
    const filter = { key };
    const file = await this.db.collection('files').findOne(filter);
    return file || null;
  }

  // async deleteAllFiles() to delete all files
  async deleteAllFiles() {
    await this.db.collection('files').deleteMany({});
  }

  // async getFileByField() takes field and value args and returns one user
  async getFileByField(field, value) {
    const file = await this.db.collection('files').findOne({ [field]: value });
    return file || null;
  }

  // async updateFileByField(filter, field, value) to update field with value
  async updateFileByField(filter, field, value) {
    const update = { $set: { [field]: value } };
    await this.db.collection('files').updateOne(filter, update);
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

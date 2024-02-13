import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_FILE_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

const filesController = {
  postUpload: async (req, res) => {
    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const data = req.body.data || '';
    const token = req.headers['x-token'];
    const user = await dbClient.findUserByField('auth_token', token);
    const { _id } = user;
    // check if name is missing
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    // check if data is missing for non-folder type
    if (!data && type !== VALID_FILE_TYPES.folder) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    try {
      if (parentId) {
        const parentFile = await dbClient.getFile(parentId);
        if (!parentFile) {
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
        if (parentFile.type !== VALID_FILE_TYPES.folder) {
          res.status(400).json({ error: 'Parent is not a folder' });
          return;
        }
      }
      let localPath = '';
      if (type === VALID_FILE_TYPES.folder) {
        const newFolder = {
          userId: _id,
          name,
          type,
          parentId,
          isPublic,
        };
        await dbClient.createFile(newFolder);
        const folder = await dbClient.getFile(newFolder.UserId);
        res.status(201).json({
          id: folder._id,
          userId: folder.userId,
          name: folder.name,
          type: folder.type,
          isPublic: folder.isPublic,
          parentId: folder.parentId,
        });
      } else {
      // create dir if not exists
        if (!fs.existsSync(FOLDER_PATH)) {
          fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }
        // save file locally
        const fileName = uuidv4();
        localPath = path.join(FOLDER_PATH, fileName);
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, buffer);

        // Add file to DB
        const newFile = {
          userId: _id,
          name,
          type,
          parentId,
          isPublic,
          localPath: type !== 'folder' ? localPath : null,
        };
        await dbClient.createFile(newFile);
        const createdFile = await dbClient.getFile(newFile.UserId);
        res.status(201).json({
          id: createdFile._id,
          userId: createdFile.userId,
          name: createdFile.name,
          type: createdFile.type,
          isPublic: createdFile.isPublic,
          parentId: createdFile.parentId,
        });
      }
    } catch (error) {
      res.status(500).json({ error: `Adding file: Internal Server Error: ${error}` });
    }
  },

  getShow: async (req, res) => {
    // retrieve user based on token
    const token = req.headers['x-token'];
    const user = await dbClient.findUserByField('auth_token', token);
    const { id } = req.params;
    const { _id } = user;

    // find file based on req.params.id
    const file = await dbClient.getFileByField('userId', _id);

    if (!file || file._id.toString() !== id) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.json(file);
    }
  },

  getIndex: async (req, res) => {
    const token = req.headers['x-token'];
    const user = await dbClient.findUserByField('auth_token', token);
    const parentId = req.query.parentId ? parseInt(req.query.parentId, 10) : 0;
    const page = req.query.page ? parseInt(req.query.page, 10) : 0;
    const skip = page * 20;
    const pipeline = [
      { $match: { userId: user._id, parentId } },
      { $skip: skip },
      { $limit: 20 },
    ];
    const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();
    res.status(200).json(files);
  },

  putPublish: async (req, res) => {
    const token = req.headers['x-token'];
    const user = await dbClient.findUserByField('auth_token', token);
    const { id } = req.params;
    const { _id } = user;

    // find file based on user id
    const file = await dbClient.getFileByField('userId', _id);
    const fileId = file._id.toString();

    // if no file is linke to user and req.param, return error 404
    if (!file || fileId !== id) {
      res.status(404).json({ error: 'Not found' });
    }
    await dbClient.updateFileByField({ _id: file._id }, 'isPublic', true);
    const updatedFile = await dbClient.getFileByField('userId', _id);
    return res.json(updatedFile);
  },

  putUnpublish: async (req, res) => {
    const token = req.headers['x-token'];
    const user = await dbClient.findUserByField('auth_token', token);
    const { id } = req.params;
    const { _id } = user;

    // find file based on user id
    const file = await dbClient.getFileByField('userId', _id);
    const fileId = file._id.toString();

    // if no file is linke to user and req.param, return error 404
    if (!file || fileId !== id) {
      res.status(404).json({ error: 'Not found' });
    }
    await dbClient.updateFileByField({ _id: file._id }, 'isPublic', false);
    const updatedFile = await dbClient.getFileByField('userId', _id);
    return res.json(updatedFile);
  },

  getFile: async (req, res) => {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const user = await dbClient.findUserByField('auth_token', token);
    const { _id } = user;

    // check if file exists in DB and is for user, user authenticated
    const file = await dbClient.getFileByField('userId', _id);
    if (file._id.toString() !== id) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (file.isPublic === true && file.userId !== _id) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // check document type
    if (file.type === VALID_FILE_TYPES.folder) {
      res.status(400).json({ error: "A folder doesn't have content" });
      return;
    }

    // check if file is locally present
    if (!file.localPath || !fs.existsSync(file.localPath)) {
      res.status(400).json({ error: 'Not found' });
      return;
    }

    const mimeType = mime.lookup(file.name);

    const fileContent = fs.readFileSync(file.localPath);
    res.setHeader('Content-Type', mimeType);
    res.send(fileContent);
  },
};

module.exports = filesController;

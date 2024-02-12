import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

const fs = require('fs');
const path = require('path');

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
};

module.exports = filesController;

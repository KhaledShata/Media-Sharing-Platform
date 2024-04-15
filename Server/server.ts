
import express, { Request, Response } from 'express';
import mongoose, { Document, Types } from 'mongoose';
import cors from 'cors';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { GridFsStorage } from 'multer-gridfs-storage';
import gridfsStream from 'gridfs-stream';
import MyFile from './models/FileModel'; 
import { ObjectId } from 'mongoose';
import Grid from 'gridfs-stream';


const app = express()
app.use(cors())
app.use(express.json())


// MongoDB Connection
const mongoURI = "mongodb+srv://admin:Khaled2003@c0.5zjxc0a.mongodb.net/MEDIA?retryWrites=true&w=majority&appName=C0"
const conn = mongoose.connection;
let gfs: gridfsStream.Grid;

mongoose.connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB Successfully");
    
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');

    const Port = 3001
    app.listen(Port, () => {
    console.log(`NODE API IS RUNNING ON PORT ${Port}`);
});
  }).catch((error) => {
    console.error(error);
  });

// Create Storage Engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

// Allowing only uploading of images or videos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({ storage , fileFilter:fileFilter});  
interface GridFsFile extends Express.Multer.File {
    id?: ObjectId;  
}

// Endpoints

// Main API
app.get('/', async(req,res)=>{

})

// API for uploading files
app.post('/upload', upload.single('file'), async (req: express.Request, res: express.Response) => {
    
    const file = req.file as GridFsFile;  
    // console.log("File metadata:", req.file);
    // console.log("File ID (gridfsId):", file.id);  

    if (file) {
        try {
            const myFile = new MyFile({
                gridfsId: file.id, 
            });
            await myFile.save();
            res.json({ file: file, myFile });
        } catch (error) {
            // console.error("Error saving file reference:", error);
            res.status(500).json({ message: 'Failed to save file reference in the database' });
        }
    } else {
        res.status(400).json({ message: 'Only image and video files are accepted!' });
    }
});

// API for retrieving files (json)
app.get("/files", async (req, res) => {
    try {
        const files = await MyFile.find(); 
        res.json(files); 
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve files' , error : error});
    }
 });

 // API for retreving specific file with ID (json)
 app.get("/files/:id", async (req, res) => {
    try {
        // Validating Input
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }

        const file = await MyFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json(file); 

    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve files', error : error });
    }
 });


 // API for deleting file
 app.delete("/files/:id", async (req, res) => {
    try {
        const file = await MyFile.findByIdAndDelete(req.params.id);
        if (!file) {
            return res.status(404).send('File not found');
        }

        const bucket = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'uploads'});
        await bucket.delete(new mongoose.Types.ObjectId(file.gridfsId.toString()));
        res.status(204).send('File deleted successfully');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting file');
    }
});


// API for updating file content
app.put("/files/:id", upload.single('file'), async (req, res) => {
    const uploaded_file = req.file as GridFsFile;  

    if (!req.file) {
        return res.status(400).send('No file uploaded or file type not supported.');
    }
    try {

        const file = await MyFile.findById(req.params.id); 
           
        const bucket = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'uploads'});
        if(file) {
            // Deleting the existing gridfs object
            const gfsfile = await bucket.delete(new mongoose.Types.ObjectId(file.gridfsId.toString()));
            
            if (!uploaded_file.id) {
                res.status(400).send('File ID is missing.');
                return;
            }
            // Updating the file with the new gridfs id 
            file.gridfsId = uploaded_file.id;
                        
            
            await file.save();
            res.status(204).send('File Updated successfully');
        }

        else{
            res.status(500).send('Error updating file.');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating file.');
    }
});


// API for viewing the file
app.get("/files/view/:id", async (req, res) => {

    try {
        // Validating Input
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }

        const file = await MyFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Validating gfs File
        let gfsfile = await gfs.files.findOne({_id:file.gridfsId})

        if (!gfsfile || gfsfile.length === 0) {
            return res.status(404).json({
                err: 'No file exists with that ID.'
            });
        }
        const gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'uploads',
        });    

        const readStream = gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(file.gridfsId.toString()));
        
        readStream.pipe(res);

    } catch (err) {
        res.status(500)
    }   

 });


  // API for liking a file
 app.get("/files/like/:id", async (req, res) => {
    try {
        // Validating Input
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }

        const file = await MyFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.numberOfLikes = (file.numberOfLikes || 0) + 1;  
        await file.save();
        res.status(200).json({ message: 'File Liked successfully', numberOfLikes: file.numberOfLikes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to like the file', error: error });
    }
});

  // API for unliking a file
app.get("/files/unlike/:id", async (req, res) => {
    try {
        // Validating Input
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }

        const file = await MyFile.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.numberOfLikes = file.numberOfLikes > 0 ? file.numberOfLikes - 1 : 0;
        await file.save();
        res.status(200).json({ message: 'File UnLiked successfully', numberOfLikes: file.numberOfLikes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unlike the file', error: error });
    }
});

// API for retrieving gfs files
app.get("/media", async (req, res) => {

    try {
        let files = await gfs.files.find({}).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: 'No Available Files.'
            });
        }
        res.status(200).json({files})
    } catch (err) {
        res.status(500)
    }
 });

 // API for retrieving specific gfs file
 app.get("/media/:id", async (req, res) => {
    try {
        let file = await gfs.files.findOne({_id:new mongoose.Types.ObjectId(req.params.id)})

        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists with that ID.'
            });
        }
        res.json(file);

    } catch (err) {
        res.status(500)
    }
 });
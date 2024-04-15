Media Sharing Platform Web Application :


**Backend** : [Nodejs - TypeScript]


**Frontend** : React 



**Database** : MongoDB



https://github.com/KhaledShata/Media-Sharing-Platform/assets/105244576/2cbf0faa-c4b0-4991-9125-be435a086c29


**Backend Server- CRUD Operations:**


Create: File upload functionality using multer and GridFsStorage.


Read: Endpoints for listing all files and viewing specific files by ID are provided.


Update: There is an endpoint to replace the content of a file.


Delete: Files can be deleted using the specified endpoint.



**Models**:


Files are handled through **MyFile** model which facilitates operations such as creating, reading, updating, and deleting file metadata and has the following fields:



- **gridfsId**: This is a MongoDB ObjectId that serves as a reference linking this metadata document to an actual file stored in GridFS.


- **numberOfLikes**: This field represents the number of likes or positive interactions a file has received. (It's 0 by default).



**APIS**:


1. File Management :
- **POST /upload**: Handles file uploads. (It accepts only image or video files)
- **GET /files**: Retrieves a list of all files stored in the MongoDB database.
- **GET /files/:id**: Retrieves metadata for a specific file identified by its MongoDB _id.
- **DELETE /files/:id**: Deletes a specific file from both MongoDB and GridFS using the file's _id. This includes deleting both the database entry and GridFS file.
- **PUT /files/:id**: Updates the content of an existing file. This operation involves deleting the old file from GridFS and updating the database entry with the new file's GridFS ID.


2. File Viewing and Interaction :
- **GET /files/view/:id**: Streams the content of a specific file from GridFS to the client, identified by the file's MongoDB _id. 
- **GET /files/like/:id**: Increments the like count for a specific file.
- **GET /files/unlike/:id**: Decrements the like count for a specific file, ensuring it never goes below zero.


3. GridFS File Retrieval :
- **GET /media**: Retrieves a list of all files stored in GridFS, including their MongoDB metadata.
- **GET /media/:id**: Retrieves metadata for a specific file stored in GridFS, identified by its MongoDB _id.


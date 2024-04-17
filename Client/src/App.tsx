import React, { useEffect, useState, ChangeEvent } from 'react'; 
import axios from 'axios';
import './App.css';

interface IFile {
  contentType: any;
  _id: string;
  gridfsId: string;
  numberOfLikes: number;
  filename:string;
}


function App() {
  const [file, setFile] = useState<File | null>(null); 
  const [filesList, setFilesList] = useState<IFile[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null); 
  const [updatingFileId, setUpdatingFileId] = useState<string | null>(null);

  const handleUpload = () => {
    console.log("GOT FILE = " , file);
    if (!file) return;
    setIsLoading(true); 
    const formData = new FormData();
    formData.append('file', file);

    console.log("DATA SENT TO SERVER" , formData);
    axios.post('http://localhost:3001/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(() => {
      fetchFiles(); 
    })
    .catch(err => console.log(err))
    .finally(() => {
      setIsLoading(false); 
    });
    console.log(formData);
  };

  const handleDelete = (fileId) => {
    axios.delete(`http://localhost:3001/files/${fileId}`)
    .then(() => {
      fetchFiles(); 
    })
    .catch(err => console.log(err));
  };

  const handleLike = (fileId) => {
    axios.get(`http://localhost:3001/files/like/${fileId}`)
    .then(() => {
      fetchFiles(); 
    })
    .catch(err => console.log(err));
  };

  const handleunLike = (fileId) => {
    axios.get(`http://localhost:3001/files/unlike/${fileId}`)
    .then(() => {
      fetchFiles(); 
    })
    .catch(err => console.log(err));
  };
  

  const handleFileUpdate = (fileId) => {
    if (!updateFile) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', updateFile);

    axios.put(`http://localhost:3001/files/${fileId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(() => {
      fetchFiles();
      setUpdateFile(null);
      setUpdatingFileId(null);
    })
    .catch(err => console.log(err))
    .finally(() => setIsLoading(false));

  };


  

  const fetchFiles = () => {
    axios.get('http://localhost:3001/files')
      .then(res => {
        const files = res.data;
        const detailFetchPromises = files.map(file =>
          axios.get(`http://localhost:3001/media/${file.gridfsId}`)
            .then(mediaResponse => {
              const { _id, ...mediaDetails } = mediaResponse.data; 
              return {
                ...file, 
                ...mediaDetails, 
              };
            })
        );
  
        Promise.all(detailFetchPromises)
          .then(fullFiles => {
            setFilesList(fullFiles as IFile[]);
            // console.log(fullFiles);
          })
          .catch(error => console.error('Error fetching media details:', error));
      })
      .catch(err => console.error('Error fetching files:', err)); 
  };
  

  useEffect(() => {
    fetchFiles();
  }, []);
  const uploadContainerStyle = { border: '20px solid blue', padding: '20px', display: 'inline-block', marginBottom: '20px', maxWidth: '500px', width: '100%' };
  const fileStyle = { border: '20px solid grey', marginBottom: '20px', padding: '10px', maxWidth: '500px', width: '100%' };
  const deleteButtonStyle = { color: 'white', backgroundColor: 'red', padding: '10px 20px', cursor: 'pointer', border: 'none' };
  const updateButtonStyle = { ...deleteButtonStyle, backgroundColor: 'green', marginLeft: '10px' };
  const likeButtonStyle = { ...deleteButtonStyle, backgroundColor: 'blue', marginLeft: '10px', marginRight:'10px' };

  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1><b>Media Sharing Platform</b></h1>
      <div style={uploadContainerStyle}>
        <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={handleUpload} disabled={isLoading}>Upload</button>
        {isLoading && <p>Loading...</p>}
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {filesList.map((file, index) => (
          <div key={index} style={fileStyle}>
            <p>{file.filename} - Likes: {file.numberOfLikes}</p>
            {file.contentType.startsWith('image/') && (
              <img src={`http://localhost:3001/files/view/${file._id}?cb=${new Date().getTime()}`}  alt={file._id} style={{ width: '100%', maxWidth: '500px', height: 'auto' }} />
            )}
            {file.contentType.startsWith('video/') && (
              <video style={{ width: '100%', maxWidth: '500px', height: 'auto' }} controls>
                <source src={`http://localhost:3001/files/view/${file._id}?cb=${new Date().getTime()}`}  type={file.contentType} />
                Your browser does not support the video tag.
              </video>
            )}
            <button style={likeButtonStyle} onClick={() => handleLike(file._id)}>Like</button>

            <button style={likeButtonStyle} onClick={() => handleunLike(file._id)}>Unlike</button>

            <button style={deleteButtonStyle} onClick={() => handleDelete(file._id)}>Delete</button>

            {updatingFileId === file._id ? (
              <>
                <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setUpdateFile(e.target.files ? e.target.files[0] : null)} />
                <button style={updateButtonStyle} onClick={() => handleFileUpdate(file._id)}>Confirm Update</button>
              </>
            ) : (
              <button style={updateButtonStyle} onClick={() => setUpdatingFileId(file._id)}>Update</button>
            )}
            

          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

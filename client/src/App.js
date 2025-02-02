import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { useLoader } from '@react-three/fiber';

function ModelViewer({ filename }) {
    const obj = useLoader(OBJLoader, `http://localhost:5000/file/${filename}`);
    return <primitive object={obj} />;
}

function App() {
    const [file, setFile] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('objFile', file);

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('File uploaded successfully');
            setUploadedFile(response.data.filename);
        } catch (err) {
            console.error(err);
            alert('Error uploading file');
        }
    };

    return (
        <div>
            <h1>3D Object Viewer</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            {uploadedFile && (
                <Canvas frameloop="demand" shadows camera={{ position: [0, 5, 10], fov: 50 }} style={{ width: '600px', height: '600px' }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 5, 5]} intensity={1} castShadow />
                    <ModelViewer filename={uploadedFile} />
                    <OrbitControls />
                </Canvas>
            )}
        </div>
    );
}

export default App;

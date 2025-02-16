import os
import cv2
import torch
import numpy as np
import firebase_admin
from firebase_admin import credentials, storage, db
from flask import Flask, request, jsonify
from torchvision import transforms
from torchvision.models.segmentation import deeplabv3_resnet101
from PIL import Image
from io import BytesIO

# Initialize Firebase
cred = credentials.Certificate("firebase_credentials.json")  # Replace with your Firebase credentials JSON
firebase_admin.initialize_app(cred, {
    'storageBucket': 'your-bucket-name.appspot.com',  # Replace with your Firebase Storage bucket
    'databaseURL': 'https://your-database-url.firebaseio.com/'  # Replace with your Firebase Database URL
})

bucket = storage.bucket()

# Initialize Flask app
app = Flask(__name__)

# Load a DeepLabV3 segmentation model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = deeplabv3_resnet101(pretrained=True).to(device).eval()

# Image preprocessing function
def preprocess_image(image):
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return transform(image).unsqueeze(0).to(device)

# Post-process segmentation mask
def postprocess_mask(output):
    mask = output['out'].squeeze(0).argmax(0).byte().cpu().numpy()
    mask_colored = cv2.applyColorMap(mask * 15, cv2.COLORMAP_JET)
    return mask_colored

# Function to process image and return segmented result
def segment_image(image):
    with torch.no_grad():
        output = model(image)
    return postprocess_mask(output)

# Function to download image from Firebase Storage
def download_image(image_path):
    blob = bucket.blob(image_path)
    img_data = blob.download_as_bytes()
    image = Image.open(BytesIO(img_data)).convert("RGB")
    return image

# Function to upload segmented image to Firebase Storage
def upload_image(image_np, output_path):
    _, img_encoded = cv2.imencode('.png', image_np)
    img_bytes = img_encoded.tobytes()
    blob = bucket.blob(output_path)
    blob.upload_from_string(img_bytes, content_type="image/png")
    return blob.public_url

# API Endpoint to process an image
@app.route('/process', methods=['POST'])
def process_request():
    try:
        data = request.json
        image_path = data.get('image_path')  # Input image path in Firebase Storage
        user_id = data.get('user_id')  # User ID for returning result

        if not image_path or not user_id:
            return jsonify({'error': 'Missing image_path or user_id'}), 400

        # Download image from Firebase Storage
        image = download_image(image_path)

        # Preprocess and run segmentation
        input_tensor = preprocess_image(image)
        segmented_image = segment_image(input_tensor)

        # Save the segmented image
        output_path = f"processed/{user_id}_segmented.png"
        segmented_url = upload_image(segmented_image, output_path)

        # Update Firebase Database with the segmented image URL
        db.reference(f'users/{user_id}/processed_image').set(segmented_url)

        return jsonify({'message': 'Processing complete', 'segmented_url': segmented_url})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run Flask server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const files = [
  'public/Hero.png',
  'public/Registrations.png',
  'public/Schedule.png',
  'public/Sponsors.png'
];

async function uploadFiles() {
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: 'sabrang-2026/menu-scroll-covers',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
      console.log(`+Uploaded ${file}: ${result.secure_url}`);
    } catch (error) {
      console.error(`-Error uploading ${file}:`, error);
    }
  }
}

uploadFiles();

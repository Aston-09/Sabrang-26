require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const files = [
  'public/menu-scroll-covers/about.png',
  'public/menu-scroll-covers/contactus.png',
  'public/menu-scroll-covers/events.png',
  'public/menu-scroll-covers/faq.png',
  'public/menu-scroll-covers/gallery.png',
  'public/menu-scroll-covers/team.png',
  'public/images/home-bg.png',
  'public/Sabrang Anthem _ ElevenLabs Music(3).m4a'
];

async function uploadFiles() {
  for (const file of files) {
    try {
      const isVideo = file.endsWith('.m4a');
      const result = await cloudinary.uploader.upload(file, {
        folder: isVideo ? 'sabrang-2026/audio' : (file.includes('menu') ? 'sabrang-2026/menu-scroll-covers' : 'sabrang-2026/images'),
        resource_type: isVideo ? 'video' : 'image',
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

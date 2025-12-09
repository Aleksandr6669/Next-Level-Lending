
const sharp = require('sharp');

const sizes = [16, 32, 48];
const appleSize = 180;

sizes.forEach(size => {
  sharp('logo.svg')
    .resize(size, size)
    .png()
    .toFile(`favicon-${size}x${size}.png`)
    .then(info => console.log(`Created favicon-${size}x${size}.png`, info))
    .catch(err => console.error(`Error creating favicon-${size}x${size}.png:`, err));
});

sharp('logo.svg')
  .resize(appleSize, appleSize)
  .png()
  .toFile('apple-touch-icon.png')
  .then(info => console.log('Created apple-touch-icon.png', info))
  .catch(err => console.error('Error creating apple-touch-icon.png:', err));

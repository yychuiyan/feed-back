import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  IMAGE_MAX_EDGE,
  optimizedDimensions,
  optimizedFileName,
  shouldOptimizeImage
} from '../public/image-optimization.js';

test('large PNG, JPEG and WebP files are selected for optimization', () => {
  const oversized = 2 * 1024 * 1024;
  assert.equal(shouldOptimizeImage({name:'screen.png', type:'image/png', size:oversized}), true);
  assert.equal(shouldOptimizeImage({name:'photo.jpg', type:'image/jpeg', size:oversized}), true);
  assert.equal(shouldOptimizeImage({name:'paste', type:'image/webp', size:oversized}), true);
});

test('small images, GIF, PDF and non-images keep their original bytes', () => {
  const oversized = 2 * 1024 * 1024;
  assert.equal(shouldOptimizeImage({name:'small.png', type:'image/png', size:500_000}), false);
  assert.equal(shouldOptimizeImage({name:'motion.gif', type:'image/gif', size:oversized}), false);
  assert.equal(shouldOptimizeImage({name:'brief.pdf', type:'application/pdf', size:oversized}), false);
  assert.equal(shouldOptimizeImage({name:'notes.txt', type:'', size:oversized}), false);
});

test('missing MIME type is inferred from supported image extensions', () => {
  const oversized = 2 * 1024 * 1024;
  assert.equal(shouldOptimizeImage({name:'photo.JPG', type:'', size:oversized}), true);
  assert.equal(shouldOptimizeImage({name:'screen.webp', type:'', size:oversized}), true);
});

test('large images are bounded to the configured longest edge', () => {
  assert.deepEqual(optimizedDimensions(4032, 3024), {
    width: IMAGE_MAX_EDGE,
    height: 1500,
    resized: true
  });
  assert.deepEqual(optimizedDimensions(1200, 800), {
    width: 1200,
    height: 800,
    resized: false
  });
});

test('optimized filenames follow the encoded image type', () => {
  assert.equal(optimizedFileName('IMG_2449.PNG', 'image/webp'), 'IMG_2449.webp');
  assert.equal(optimizedFileName('photo.jpeg', 'image/jpeg'), 'photo.jpg');
  assert.equal(optimizedFileName('截图', 'image/png'), '截图.png');
});

test('file sizes use compact upload labels', () => {
  assert.equal(formatFileSize(4 * 1024 * 1024), '4.0 MB');
  assert.equal(formatFileSize(420_000), '410 KB');
});

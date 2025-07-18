# Images Directory

This directory is for storing website images such as:

- Logo files
- Hero images
- Service icons
- Team photos
- Gallery images
- Backgrounds

## Recommended Image Formats

- **PNG** - For logos, icons, and images with transparency
- **JPG/JPEG** - For photos and complex images
- **SVG** - For scalable icons and simple graphics
- **WebP** - For modern browsers (better compression)

## Image Optimization Tips

1. Compress images before uploading
2. Use appropriate dimensions (don't use 4K images for thumbnails)
3. Consider using lazy loading for better performance
4. Provide alt text for accessibility
5. Use responsive images with different sizes for different screen sizes

## Example Usage in HTML

```html
<!-- Regular image -->
<img src="images/logo.png" alt="Achieve Logo" width="200" height="100">

<!-- Responsive image -->
<picture>
  <source media="(max-width: 768px)" srcset="images/hero-mobile.jpg">
  <source media="(max-width: 1200px)" srcset="images/hero-tablet.jpg">
  <img src="images/hero-desktop.jpg" alt="Hero Image">
</picture>
```

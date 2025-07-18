# Deployment Guide: Connecting Your Website to GoDaddy Domain

## Prerequisites
- Your domain purchased from GoDaddy
- Website files ready (index.html, css/, js/, images/)
- GoDaddy hosting plan (if using their hosting)

## Method 1: GoDaddy Hosting (Recommended for beginners)

### Step 1: Access GoDaddy Hosting
1. Log into your GoDaddy account
2. Navigate to "My Products" → "Web Hosting"
3. Click "Manage" next to your hosting plan

### Step 2: Upload Files via File Manager
1. In your hosting control panel, find "File Manager"
2. Navigate to the `public_html` directory
3. Upload your website files:
   ```
   public_html/
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   └── script.js
   ├── images/
   │   └── (your images)
   └── README.md
   ```

### Step 3: Test Your Website
- Visit your domain: `https://yourdomain.com`
- It may take a few minutes to propagate

## Method 2: Third-Party Hosting (More flexibility)

### Popular Hosting Options:
1. **Netlify** (Free tier available)
2. **Vercel** (Free tier available)
3. **GitHub Pages** (Free)
4. **DigitalOcean**
5. **AWS S3 + CloudFront**

### Using Netlify (Free & Easy):
1. Sign up at netlify.com
2. Drag and drop your website folder
3. Get a temporary URL like `random-name.netlify.app`
4. Connect your GoDaddy domain

### Connect GoDaddy Domain to Netlify:
1. In Netlify: Go to Site Settings → Domain Management
2. Add your custom domain: `yourdomain.com`
3. Netlify will provide DNS records
4. In GoDaddy: Go to DNS Management
5. Add the provided DNS records

## Method 3: GitHub Pages (Free + Version Control)

### Step 1: Create GitHub Repository
1. Create a new repository on GitHub
2. Upload your website files
3. Name the main file `index.html`

### Step 2: Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "Pages" section
3. Select source branch (usually `main`)
4. Your site will be available at `username.github.io/repository-name`

### Step 3: Connect Custom Domain
1. In your repository, create a file named `CNAME`
2. Add your domain: `yourdomain.com`
3. In GoDaddy DNS settings, add:
   - Type: CNAME
   - Name: www
   - Value: username.github.io
   - Type: A
   - Name: @
   - Value: 185.199.108.153 (GitHub's IP)

## DNS Configuration for GoDaddy

### For most hosting providers, you'll need to update DNS:
1. Log into GoDaddy
2. Go to "My Products" → "Domains"
3. Click "DNS" next to your domain
4. Modify these records:

```
Type    Name    Value                   TTL
A       @       [Your hosting IP]       1 Hour
CNAME   www     yourdomain.com          1 Hour
```

## SSL Certificate (HTTPS)
Most modern hosting providers offer free SSL certificates:
- **Netlify**: Automatic
- **GitHub Pages**: Automatic
- **GoDaddy**: Available in hosting plans
- **Cloudflare**: Free tier available

## Pre-Deployment Checklist

### Optimize Your Website:
- [ ] Compress images
- [ ] Minify CSS and JavaScript (optional)
- [ ] Test on multiple devices
- [ ] Validate HTML
- [ ] Check all links work

### SEO Preparation:
- [ ] Add meta descriptions
- [ ] Add Open Graph tags
- [ ] Create robots.txt
- [ ] Create sitemap.xml

## File Upload Instructions

### If using File Manager:
1. Create a ZIP file of your website folder
2. Upload the ZIP file
3. Extract it in the `public_html` directory
4. Ensure `index.html` is in the root of `public_html`

### If using FTP:
1. Download an FTP client (FileZilla, WinSCP)
2. Connect using your hosting credentials
3. Upload files to the correct directory

## Troubleshooting

### Website Not Loading:
- Check file paths in HTML (css/style.css, js/script.js)
- Ensure `index.html` is in the root directory
- Wait for DNS propagation (up to 24 hours)

### CSS/JS Not Working:
- Verify file paths are correct
- Check file permissions (755 for directories, 644 for files)
- Clear browser cache

### DNS Issues:
- Use tools like whatsmydns.net to check propagation
- Ensure DNS records are correctly configured
- Contact hosting provider support

## Next Steps After Deployment

1. **Set up Google Analytics** for tracking
2. **Configure Google Search Console** for SEO
3. **Set up email forwarding** for contact forms
4. **Regular backups** of your website
5. **Monitor website performance**

## Cost Breakdown

### Free Options:
- GitHub Pages: Free
- Netlify: Free tier (100GB bandwidth)
- Vercel: Free tier

### Paid Options:
- GoDaddy Hosting: $5-15/month
- Professional hosting: $10-50/month

Choose the method that best fits your technical comfort level and budget!

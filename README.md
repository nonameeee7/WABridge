# WABridge - WhatsApp Business Services Website

A production-ready static website for WABridge, a WhatsApp Business API integration service provider based in Ahmedabad, India.

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/wabridge)

### Option 2: CLI Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /path/to/WABridge
vercel

# For production
vercel --prod
```

### Option 3: GitHub Integration
1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Deploy automatically on every push

## 📁 Project Structure

```
WABridge/
├── index.html      # Main landing page
├── privacy.html    # Privacy policy (Meta verification)
├── style.css       # Shared responsive styles
├── script.js       # JavaScript interactions
├── vercel.json     # Vercel deployment config
└── README.md       # This file
```

## ✨ Features

- **Modern Dark Theme**: #0b1120 background with #22c55e WhatsApp green accents
- **Mobile-First**: Optimized for Indian SMBs on mobile devices
- **Fast Loading**: Pure HTML/CSS/JS, no frameworks, <2s load time
- **SEO Optimized**: Meta tags, semantic HTML, proper headings
- **Animations**: Subtle fade-in-up effects and hover interactions
- **Contact Form**: Ready for Formspree/EmailJS integration
- **WhatsApp Button**: Floating chat button for quick contact

## 🔧 Configuration

### 1. WhatsApp Number
Edit `script.js` and replace the phone number:
```javascript
const phone = '919876543210'; // Your WhatsApp Business number
```

### 2. Contact Form
Choose one option:

**Formspree:**
1. Create account at [formspree.io](https://formspree.io)
2. Create a new form and get your form ID
3. Update `script.js`:
```javascript
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  body: formData,
  headers: { 'Accept': 'application/json' }
});
```

**EmailJS:**
1. Create account at [emailjs.com](https://emailjs.com)
2. Add to `index.html` before `</body>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>emailjs.init('YOUR_PUBLIC_KEY');</script>
```
3. Update form submission in `script.js`

### 3. Analytics (Optional)
Add Google Analytics to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

## 📋 Meta Business Verification Checklist

This website includes all requirements for Meta Business verification:

- [x] Business name and description
- [x] Physical address (Ahmedabad, Gujarat, India)
- [x] Contact information (email, phone, WhatsApp)
- [x] Services description
- [x] Privacy Policy page (GDPR/DPDP compliant)
- [x] Professional website design

## 🌐 Custom Domain Setup (Vercel)

1. Go to your Vercel project settings
2. Navigate to Domains
3. Add your domain (e.g., wabridge.in)
4. Update DNS records as instructed
5. SSL is automatic

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS/Android)

## 📄 License

© 2026 WABridge. All rights reserved.

## 📞 Support

- Email: contact@wabridge.in
- WhatsApp: +91 98765 43210

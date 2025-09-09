# Kateriss AI Video Generator

A modern, brutalist-designed AI video generation platform powered by Google's Veo AI technology. Create stunning AI-generated videos with simple text prompts and professional-grade controls.

![Kateriss AI Video Generator](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-Private-red)

## 🎥 Features

### Core Features
- **AI Video Generation**: Advanced text-to-video generation using Google Veo 3 Fast
- **Real-time Processing**: Live progress tracking with queue management
- **Multiple Video Settings**: Resolution, duration, style, and aspect ratio controls
- **User Authentication**: Secure login/signup with Supabase Auth
- **Payment Processing**: Integrated Paddle payments with multiple pricing tiers
- **Video Management**: Comprehensive video library with favorites, tags, and categories
- **Usage Tracking**: Real-time usage monitoring with tier-based limits

### Pricing Tiers
- **Pay-per-video**: $2.49 per video generation
- **Basic Plan**: $29/month - 20 videos included
- **Premium Plan**: $149/month - Unlimited videos + commercial rights

### Design Philosophy
- **Brutalist Aesthetic**: Bold, geometric design with strong contrasts
- **Color Palette**: Primary pink (#ff0080) and vibrant green (#00ff00) accents
- **Typography**: Space Grotesk monospace font for modern tech feel
- **Responsive Design**: Mobile-first approach with desktop optimization

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Full type safety and enhanced developer experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework with custom brutalist theme
- **Framer Motion** - Smooth animations and micro-interactions
- **React Query** - Server state management with caching
- **React Router** - Client-side routing with protected routes
- **React Hook Form** - Performant form handling
- **Zustand** - Lightweight state management

### Backend & Services
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Edge Functions** - Serverless functions for video processing
- **Google Veo 3 Fast** - AI video generation engine
- **Paddle** - Payment processing and subscription management
- **Vercel** - Deployment and hosting platform

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing with Tailwind
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Supabase account and project
- Paddle account for payments
- Google Cloud account for Veo AI access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kateriss-video-generator-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # Paddle Configuration  
   VITE_PADDLE_VENDOR_ID=your_paddle_vendor_id
   VITE_PADDLE_CLIENT_SIDE_TOKEN=your_paddle_client_token
   VITE_PADDLE_ENVIRONMENT=sandbox # or 'production'
   
   # Google Veo AI
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # App Configuration
   VITE_SITE_URL=http://localhost:5173
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
kateriss-video-generator-ai/
├── public/                     # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components (Header, Footer)
│   │   ├── payment/          # Payment and billing components
│   │   ├── ui/               # Basic UI components
│   │   └── video/            # Video-related components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page components
│   ├── services/             # API services and utilities
│   ├── styles/               # Global styles and themes
│   ├── types/                # TypeScript type definitions
│   └── config/               # Configuration files
├── supabase/
│   ├── functions/            # Edge functions
│   └── migrations/           # Database migrations
├── docs/                     # Documentation
├── .github/                  # GitHub workflows
└── dist/                     # Build output
```

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build locally

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler
npm run format          # Format code (if available)
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes with proper commit messages
3. Run linting and type checking: `npm run lint && npm run type-check`
4. Push to GitHub: `git push origin feature/your-feature-name`
5. Create Pull Request for review
6. Automatic deployment on merge to `main`

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Implement proper error handling
- Write descriptive commit messages
- Add JSDoc comments for complex functions

## 🚀 Deployment

### Automatic Deployment (Recommended)

1. **GitHub Actions**: Automatic deployment on push to `main` branch
2. **Vercel Integration**: Connected to GitHub for seamless deployments
3. **Environment Variables**: Managed through Vercel dashboard

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Supabase project set up and configured
- [ ] Paddle webhook endpoints configured
- [ ] Domain name configured (if custom domain)
- [ ] SSL certificate active
- [ ] Database migrations applied
- [ ] Edge functions deployed

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1...` |
| `VITE_PADDLE_VENDOR_ID` | Paddle vendor ID | `12345` |
| `VITE_PADDLE_CLIENT_SIDE_TOKEN` | Paddle client token | `live_xxx` or `test_xxx` |
| `VITE_PADDLE_ENVIRONMENT` | Paddle environment | `sandbox` or `production` |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | `AIzaSyxxx...` |
| `VITE_SITE_URL` | Site URL | `https://kateriss.ai` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_PAY_PER_VIDEO_PRICE` | Pay-per-video price | `2.49` |
| `VITE_BASIC_MONTHLY_PRICE` | Basic plan price | `29` |
| `VITE_PREMIUM_MONTHLY_PRICE` | Premium plan price | `149` |
| `VITE_BASIC_VIDEO_LIMIT` | Basic plan video limit | `20` |

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation as needed
- Ensure all CI checks pass

### Pull Request Process

1. Ensure your PR description clearly describes the problem and solution
2. Include the relevant issue number if applicable
3. Update documentation if you're changing functionality
4. Ensure the CI pipeline passes
5. Request review from maintainers

## 📄 License

This project is proprietary software. All rights reserved.

## 🔗 Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [API Documentation](./API.md) - Complete API reference
- [Development Guide](./DEVELOPMENT.md) - In-depth development guidelines
- [Database Schema](./DATABASE.md) - Database design and schema

## 📞 Support

For technical support or questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🎯 Roadmap

### Version 1.1
- [ ] Batch video generation
- [ ] Video templates
- [ ] Advanced editing features
- [ ] Social media integrations

### Version 1.2
- [ ] API access for developers
- [ ] White-label solutions
- [ ] Advanced analytics dashboard
- [ ] Mobile app development

---

**Built with ❤️ by the Kateriss Team**

*Empowering creators with AI-powered video generation*
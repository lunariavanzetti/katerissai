#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 Validating Kateriss AI Video Generator Setup...\n');

let errors = [];
let warnings = [];

// Helper functions
const exists = (filePath) => fs.existsSync(path.join(rootDir, filePath));
const readFile = (filePath) => {
  try {
    return fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  } catch (error) {
    return null;
  }
};

const checkRequired = (filePath, description) => {
  if (!exists(filePath)) {
    errors.push(`❌ Missing required file: ${filePath} (${description})`);
    return false;
  } else {
    console.log(`✅ ${filePath}`);
    return true;
  }
};

const checkOptional = (filePath, description) => {
  if (!exists(filePath)) {
    warnings.push(`⚠️  Optional file missing: ${filePath} (${description})`);
    return false;
  } else {
    console.log(`✅ ${filePath}`);
    return true;
  }
};

// 1. Check core configuration files
console.log('📋 Core Configuration Files:');
checkRequired('package.json', 'NPM configuration');
checkRequired('vite.config.ts', 'Vite configuration');
checkRequired('tsconfig.json', 'TypeScript configuration');
checkRequired('tailwind.config.js', 'Tailwind CSS configuration');
checkRequired('postcss.config.js', 'PostCSS configuration');
checkRequired('.eslintrc.cjs', 'ESLint configuration');
checkRequired('.env.example', 'Environment variables template');
checkRequired('.gitignore', 'Git ignore rules');

// 2. Check entry points
console.log('\n📝 Entry Points:');
checkRequired('index.html', 'Main HTML file');
checkRequired('src/main.tsx', 'React entry point');
checkRequired('src/App.tsx', 'Main App component');

// 3. Check core directories and files
console.log('\n📁 Core Application Structure:');
checkRequired('src/styles/globals.css', 'Global styles');
checkRequired('src/styles/brutalist.css', 'Brutalist design system');
checkRequired('src/config/env.ts', 'Environment configuration');

// 4. Check UI components
console.log('\n🎨 UI Components:');
checkRequired('src/components/ui/Button.tsx', 'Button component');
checkRequired('src/components/ui/Card.tsx', 'Card component');
checkRequired('src/components/ui/Input.tsx', 'Input component');
checkRequired('src/components/ui/Modal.tsx', 'Modal component');
checkRequired('src/components/ui/Loading.tsx', 'Loading component');
checkRequired('src/components/ui/index.ts', 'UI components export');

// 5. Check layout components
console.log('\n🏗️  Layout Components:');
checkRequired('src/components/layout/Header.tsx', 'Header component');
checkRequired('src/components/layout/Footer.tsx', 'Footer component');

// 6. Check authentication system
console.log('\n🔐 Authentication System:');
checkRequired('src/contexts/AuthContext.tsx', 'Authentication context');
checkRequired('src/components/auth/LoginForm.tsx', 'Login form');
checkRequired('src/components/auth/SignUpForm.tsx', 'Sign up form');
checkRequired('src/components/auth/AuthGuard.tsx', 'Route protection');

// 7. Check pages
console.log('\n📄 Application Pages:');
checkRequired('src/pages/HomePage.tsx', 'Home page');
checkRequired('src/pages/AuthPage.tsx', 'Authentication page');
checkRequired('src/pages/PricingPage.tsx', 'Pricing page');
checkRequired('src/pages/GeneratePage.tsx', 'Video generation page');
checkRequired('src/pages/DashboardPage.tsx', 'User dashboard');

// 8. Check deployment configuration
console.log('\n🚀 Deployment Configuration:');
checkRequired('vercel.json', 'Vercel configuration');
checkOptional('.github/workflows/deploy.yml', 'GitHub Actions workflow');

// 9. Check documentation
console.log('\n📚 Documentation:');
checkOptional('README.md', 'Project documentation');
checkOptional('DEPLOYMENT.md', 'Deployment guide');
checkOptional('DEVELOPMENT.md', 'Development guide');

// 10. Check package.json structure
console.log('\n📦 Package Configuration:');
const packageJson = readFile('package.json');
if (packageJson) {
  try {
    const pkg = JSON.parse(packageJson);
    
    // Check scripts
    const requiredScripts = ['dev', 'build', 'preview', 'lint', 'type-check'];
    requiredScripts.forEach(script => {
      if (pkg.scripts?.[script]) {
        console.log(`✅ npm script: ${script}`);
      } else {
        errors.push(`❌ Missing npm script: ${script}`);
      }
    });

    // Check dependencies
    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'react-hot-toast'
    ];
    
    requiredDeps.forEach(dep => {
      if (pkg.dependencies?.[dep]) {
        console.log(`✅ dependency: ${dep}`);
      } else {
        errors.push(`❌ Missing dependency: ${dep}`);
      }
    });

  } catch (error) {
    errors.push(`❌ Invalid package.json format: ${error.message}`);
  }
}

// 11. Check environment variables template
console.log('\n🔧 Environment Variables:');
const envExample = readFile('.env.example');
if (envExample) {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PADDLE_VENDOR_ID',
    'VITE_PADDLE_CLIENT_SIDE_TOKEN',
    'VITE_PADDLE_ENVIRONMENT',
    'VITE_GEMINI_API_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    if (envExample.includes(envVar)) {
      console.log(`✅ Environment variable template: ${envVar}`);
    } else {
      errors.push(`❌ Missing environment variable in .env.example: ${envVar}`);
    }
  });
}

// 12. Check TypeScript configuration
console.log('\n🔧 TypeScript Configuration:');
const tsConfig = readFile('tsconfig.json');
if (tsConfig) {
  try {
    const config = JSON.parse(tsConfig);
    if (config.compilerOptions?.strict) {
      console.log('✅ TypeScript strict mode enabled');
    } else {
      warnings.push('⚠️  TypeScript strict mode not enabled');
    }
    
    if (config.compilerOptions?.paths?.['@/*']) {
      console.log('✅ Path aliases configured');
    } else {
      warnings.push('⚠️  Path aliases not configured');
    }
  } catch (error) {
    errors.push(`❌ Invalid tsconfig.json format: ${error.message}`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED! Your Kateriss AI setup is ready for production.');
} else {
  if (errors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log(`\n📈 Status: ${errors.length} errors, ${warnings.length} warnings`);
  
  if (errors.length > 0) {
    console.log('\n🔧 Please fix the critical errors before deploying to production.');
    process.exit(1);
  } else {
    console.log('\n✨ Ready for production! Consider addressing warnings for optimal setup.');
  }
}

console.log('\n🚀 Next Steps:');
console.log('   1. Copy .env.example to .env and configure your environment variables');
console.log('   2. Set up your Supabase project and run the database migrations');
console.log('   3. Configure Paddle for payment processing');
console.log('   4. Set up Google Gemini API for video generation');
console.log('   5. Deploy to Vercel and configure your custom domain');
console.log('\n📖 See README.md and DEPLOYMENT.md for detailed instructions.');
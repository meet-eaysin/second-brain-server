# 🚀 Vercel Deployment Guide

This guide explains how to deploy the Second Brain Server to Vercel as a serverless function.

## 📋 Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- MongoDB Atlas database (serverless-friendly)
- GitHub repository connected to Vercel

## 🚀 Quick Deploy

### Option 1: Deploy Button (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/meet-eaysin/second-brain-server)

### Option 2: Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   yarn vercel:deploy
   ```

## ⚙️ Environment Variables Setup

### 1. Copy Environment Template
Use `.env.vercel` as a template for your environment variables.

### 2. Set Variables in Vercel Dashboard
Go to your Vercel project → Settings → Environment Variables

**Required Variables:**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
ENCRYPTION_SECRET=your-encryption-secret-32-chars
```

**Optional Variables:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name

# Client URLs
CLIENT_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### 3. Set Variables via CLI
```bash
# Set required variables
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add ENCRYPTION_SECRET

# Set optional variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas cluster
2. Whitelist Vercel's IP ranges (or use 0.0.0.0/0 for serverless)
3. Create a database user
4. Get the connection string

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## 📁 Project Structure

```
second-brain-server/
├── src/
│   ├── index.tsx          # Main entry point (works for both server & serverless)
│   ├── app.ts            # Express app
│   ├── config/
│   │   └── db/
│   │       └── index.tsx  # Enhanced DB connection with serverless support
│   └── ...
├── vercel.json           # Vercel configuration
└── .env.vercel          # Environment template
```

## 🔧 Vercel Configuration

The `vercel.json` file configures:
- **Build**: TypeScript compilation
- **Routes**: API routing
- **Functions**: Serverless function settings
- **Environment**: Production environment

Key settings:
```json
{
  "functions": {
    "api/index.tsx": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

## 🌐 API Endpoints

After deployment, your API will be available at:

- **Base URL**: `https://your-project.vercel.app`
- **API Docs**: `https://your-project.vercel.app/api/v1/docs`
- **Health Check**: `https://your-project.vercel.app/health`
- **Authentication**: `https://your-project.vercel.app/api/v1/auth/*`

## 🔍 Testing Deployment

### 1. Health Check
```bash
curl https://your-project.vercel.app/health
```

### 2. API Documentation
Visit: `https://your-project.vercel.app/api/v1/docs`

### 3. Test Authentication
```bash
curl -X POST https://your-project.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'
```

## 🚨 Troubleshooting

### Common Issues

**1. Function Timeout**
- Increase `maxDuration` in `vercel.json`
- Optimize database queries
- Use connection pooling

**2. Database Connection Issues**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has proper permissions

**3. Environment Variables**
- Verify all required variables are set
- Check variable names (case-sensitive)
- Redeploy after adding variables

**4. Build Failures**
- Check TypeScript compilation errors
- Verify all dependencies are installed
- Review build logs in Vercel dashboard

### Debug Commands

```bash
# View deployment logs
vercel logs

# Check function logs
vercel logs --follow

# Test locally
vercel dev

# Check environment variables
vercel env ls
```

## 📊 Performance Optimization

### 1. Database Connection
- Use connection pooling (`maxPoolSize: 1`)
- Implement connection caching
- Set appropriate timeouts

### 2. Function Configuration
- Optimize bundle size
- Use appropriate regions
- Set memory limits

### 3. Caching
- Implement response caching
- Use CDN for static assets
- Cache database queries

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to Git
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use MongoDB Atlas with authentication
   - Implement proper access controls
   - Monitor database access

3. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs

## 📈 Monitoring

### Vercel Analytics
- Enable Vercel Analytics in dashboard
- Monitor function performance
- Track error rates

### Custom Monitoring
```typescript
// Add to your API routes
console.log('Function execution time:', Date.now() - startTime);
```

## 🔄 CI/CD Pipeline

### GitHub Integration
1. Connect repository to Vercel
2. Enable automatic deployments
3. Set up preview deployments

### Deployment Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Issues**: Create an issue in the GitHub repository

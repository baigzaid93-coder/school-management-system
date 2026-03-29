# Deploy to Render

## Prerequisites
- GitHub account
- MongoDB Atlas account (for database)

## Steps

### 1. Push to GitHub
Create a new repository on GitHub and push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/school-management-system.git
git push -u origin main
```

### 2. Create MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Create a free cluster (M0 Sandbox)
3. Create a database user
4. Whitelist IP address `0.0.0.0/0` (for Render access)
5. Get your connection string (DATABASE_URL)

### 3. Deploy Backend to Render
1. Go to [Render](https://render.com)
2. Connect your GitHub account
3. Click "New +" → "Blueprint"
4. Select your repository
5. For the backend service:
   - Name: `school-management-backend`
   - Region: Choose closest to you
   - Branch: `main`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add Environment Variable:
     - `DATABASE_URL`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string

6. For the frontend service:
   - Name: `school-management-frontend`
   - Region: Same as backend
   - Branch: `main`
   - Root Directory: `frontend`
   - Environment: `Static Site`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add Environment Variable:
     - `VITE_API_URL`: `https://school-management-backend.onrender.com/api` (replace with your actual backend URL)

### 4. Configure CORS on Backend
After deploying the backend, update the CORS configuration in `backend/src/index.js`:
```javascript
app.use(cors({
  origin: ['https://school-management-frontend.onrender.com'],
  credentials: true
}));
```

### 5. Test Your Deployment
1. Access your frontend URL
2. Login or register
3. Test all features

## Manual Deployment (Alternative)

### Backend Only
1. Create a Web Service on Render
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Configure environment variables
5. Deploy

### Frontend Only
1. Create a Static Site on Render
2. Connect your GitHub repo
3. Set root directory to `frontend`
4. Add `VITE_API_URL` environment variable
5. Deploy

## Environment Variables

### Backend
- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Set to `production`

### Frontend
- `VITE_API_URL` - Backend API URL (e.g., `https://api.yoursite.com/api`)

## Troubleshooting

### CORS Errors
- Ensure backend CORS includes your frontend domain
- Check that frontend API_URL matches backend URL

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check MongoDB Atlas IP whitelist includes Render IPs

### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are listed in package.json

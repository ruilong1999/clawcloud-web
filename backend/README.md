# ClawCloud Backend API

Complete backend API for ClawCloud using Node.js + Express + MongoDB.

## Setup Instructions

### 1. Install MongoDB

**Option A: Install locally (macOS)**
```bash
# Turn off VPN first, then:
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Option B: Use MongoDB Atlas (Free Cloud Database)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster (M0)
4. Get your connection string
5. Create a `.env` file with:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clawcloud?retryWrites=true&w=majority
   ```

### 2. Install Dependencies
```bash
cd ~/clawcloud-web/backend
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at http://localhost:3000/api

### 5. Seed Sample Data (Optional)
```bash
npm run seed
```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `PUT /api/employees/:id/toggle` - Toggle work status
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/:id/clone` - Clone employee

### Stats
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/usage-trend?days=7` - Usage trend data
- `GET /api/stats/activities?limit=20` - Activity logs

### Billing
- `GET /api/billing/today` - Today's billing
- `GET /api/billing/history?startDate=&endDate=` - Billing history
- `POST /api/billing/generate-stats` - Generate daily stats (cron)

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   │   ├── employeeController.js
│   │   ├── statsController.js
│   │   └── billingController.js
│   ├── models/
│   │   ├── Employee.js    # Employee schema
│   │   ├── Activity.js    # Activity log schema
│   │   ├── DailyStats.js  # Daily stats schema
│   │   └── index.js
│   ├── routes/
│   │   ├── employeeRoutes.js
│   │   ├── statsRoutes.js
│   │   └── billingRoutes.js
│   ├── utils/
│   │   └── seedData.js    # Database seeder
│   └── server.js          # Express app entry point
├── .env.example
├── package.json
└── README.md
```

## Frontend Integration

The frontend at `/index.html` is already configured to use this API:
- API client at `website/js/api.js`
- Auto-connects to `http://localhost:3000/api`
- Falls back to demo mode if API is unavailable

## Testing

Test the API with curl:
```bash
# Health check
curl http://localhost:3000/api/health

# Get employees
curl http://localhost:3000/api/employees

# Create employee
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Bot","role":"assistant","tier":"low","modelType":"normal"}'
```

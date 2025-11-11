# CareDevi Backend – EMR & Patient Portal (Prisma + Express.js + PostgreSQL)

## 🧰 Tech Stack
- **Runtime**: Node.js
- **Backend Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful

---

## 📁 Project Structure

```
caredevi-backend/
├── prisma/                 # Prisma schema and migrations
│   └── schema.prisma
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── middleware/
├── .env
├── app.js
├── server.js
└── package.json
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo and install dependencies
```bash
git clone https://github.com/caredevisolutions/caredevi-backend.git
cd caredevi-backend
npm install
```

### 2. Configure environment variables

Create a `.env` file:

```
DATABASE_URL="postgresql://user:password@localhost:5432/caredevi"
JWT_SECRET="supersecuresecret"
PORT=4000
```

### 3. Initialize Prisma and run migrations
```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the development server
```bash
npm run dev
```

---

## 🚦 Create User Model(TODO: update)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      String   // 'patient' | 'clinician' | 'admin'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔐 Authentication

- JWT-based login and session handling
- Secure routes using middleware that checks user roles

---

## 📊 Core API Endpoints

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| POST   | `/api/auth/register`   | Register new user                  |
| POST   | `/api/auth/login`      | Login user and return JWT          |
| GET    | `/api/me`              | Get current logged-in user profile|
| GET    | `/api/patients/:id`    | Get patient health record          |
| POST   | `/api/appointments`    | Book an appointment                |
| GET    | `/api/claims`          | Retrieve insurance claims          |

---

## 🔒 Security

- Helmet and CORS for securing HTTP headers and access
- Bcrypt for password hashing
- JWT for token-based authentication

---

## 🧪 Testing

To be added using Jest and Supertest.

---

## 📖 Documentation

- Auto-generated with Swagger/OpenAPI (coming soon)

---

---

# Firebase Setup

This application uses Firebase Authentication with Google Cloud Service Account Impersonation for secure OAuth login functionality.

## 🔧 Prerequisites

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Firebase project created
- Google Cloud project with Firebase enabled

## 🚀 Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing: 
3. Enable **Authentication** → **Sign-in method** → **Google** (and/or Apple)

### Step 2: Setup Google Cloud Authentication

```powershell
# Install Google Cloud CLI (if not already installed)
# Download from: https://cloud.google.com/sdk/docs/install

# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Set your project
gcloud config set project caredevi-test

# Verify authentication
gcloud auth list
```

### Step 3: Create Service Account (Optional)

If the Firebase service account doesn't exist, create one:

# Create Firebase admin service account

# Grant Firebase Admin role

# Grant yourself impersonation rights

### Step 4: Environment Variables

Add these Firebase configuration variables to your `.env` file:

```bash
# Firebase Configuration (Service Account Impersonation)
FIREBASE_ADMIN_PROJECT_ID= xxx
FIREBASE_SERVICE_ACCOUNT_EMAIL= xxx
USE_SERVICE_ACCOUNT_IMPERSONATION="true"

# Optional: Client-side Firebase config (for frontend)
# FIREBASE_API_KEY="your-api-key"
# FIREBASE_AUTH_DOMAIN=
# FIREBASE_STORAGE_BUCKET=
# FIREBASE_MESSAGING_SENDER_ID=
# FIREBASE_APP_ID=
```

### Step 5: Find Your Service Account Email

**Option 1: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `caredevi-test`
3. **Project Settings** → **Service Accounts** tab
4. Copy the email 

## 🔍 Testing Firebase Setup

### Test Server Startup
```powershell
npm run dev
```

**Expected output:**
```
🔄 Initializing Firebase Admin with service account impersonation...
✅ Firebase Admin SDK initialized with service account impersonation
✅ GraphQL endpoint ready at /graphql
🚀 Server running on port 4000
```

### Test Firebase Endpoints

**Health Check:**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/auth/firebase-config" -Method GET
```

**OAuth Login (Test):**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/auth/oauth/login" -Method POST -ContentType "application/json" -Body '{"idToken":"test","provider":"google"}'
```
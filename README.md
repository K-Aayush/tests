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

## 👥 License

MIT – open for contribution and modification.
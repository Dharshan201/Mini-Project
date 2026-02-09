# 💳 SecurePay Gateway

A professional MERN stack credit card payment gateway simulation with realistic 3D card visuals, OTP verification, transaction analytics, and admin tracking.

![SecurePay Gateway](https://img.shields.io/badge/MERN-Stack-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🔐 Authentication
- Secure login and registration with JWT tokens
- Password hashing with bcrypt (12 rounds)
- User profile management (update name, email, password)
- Role-based access control (User/Admin)

### 💳 3D Credit Card Component
- **Realistic 3D card** with CSS transforms and perspective
- **360° rotation animation** with smooth transitions
- **Live typing** - card number, name, expiry appear in real-time
- **Card type detection** - Automatically detects Visa, MasterCard, American Express, RuPay
- **Flip animation** when entering CVV (shows card back)
- **Embossed fonts**, gradients, chip, and contactless icons
- Dynamic brand logos based on card type

### 💰 Payment Simulation
- **Luhn's Algorithm** validation for card numbers
- Expiry date and CVV validation
- **Fake OTP step** - Enter `123456` to proceed
- Animated success/failure popups
- **Masked card numbers** for security

### 📊 Transaction History
- Complete transaction logs with filtering
- Filter by date range, status, card type
- Pagination for large datasets
- **CSV/Excel export** functionality

### 📈 Analytics Dashboard
- Monthly spending trends (Area chart)
- Transaction by card type (Pie chart)
- Status breakdown (Bar chart)
- Summary statistics

### 👨‍💼 Admin Panel
- View all users and their cards
- Approve/reject pending transactions
- Transaction management with filters
- Export logs as CSV
- Revenue and user statistics

### 🔔 Notifications
- Toast notifications for payment status
- Simulated email receipts using Nodemailer (Ethereal)

### 🌓 Dark/Light Mode
- Theme toggle with smooth transitions
- Persisted preference in localStorage

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Material-UI (MUI)** for components
- **Framer Motion** for animations
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls
- **React Toastify** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email simulation

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── server.js              # Express server entry
│   ├── seed.js                # Database seeder
│   ├── routes/
│   │   ├── auth.js            # Auth APIs (login, register, profile)
│   │   ├── card.js            # Card & payment APIs
│   │   └── admin.js           # Admin APIs
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Card.js            # Card schema
│   │   └── Transaction.js     # Transaction schema
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   └── utils/
│       ├── luhn.js            # Luhn's Algorithm
│       └── email.js           # Nodemailer setup
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Card3D.jsx     # 3D rotating card
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── OTPModal.jsx
│   │   │   ├── PaymentResult.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── cardType.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── database/
│   └── connection.js          # MongoDB connection
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd "c:\Users\DHARSHAN\Desktop\mini project"
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure Environment**
   
   The `.env` file is already set up with defaults. Update MongoDB URI if needed:
   ```env
   MONGODB_URI=mongodb://localhost:27017/creditcard_gateway
   JWT_SECRET=your-secret-key
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

6. **Seed the Database (Optional)**
   ```bash
   cd backend
   npm run seed
   ```
   This creates:
   - Admin: `admin@securepay.com` / `admin123`
   - User: `demo@securepay.com` / `demo123`

7. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on `http://localhost:5000`

8. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   App runs on `http://localhost:5173`

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |

### Card & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/card/validate` | Validate card (Luhn) |
| POST | `/api/card/process` | Process payment |
| POST | `/api/card/verify-otp` | Verify OTP (123456) |
| GET | `/api/card/transactions` | Get history |
| GET | `/api/card/stats` | Get statistics |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/transactions` | List all transactions |
| PUT | `/api/admin/transaction/:id` | Approve/reject |
| GET | `/api/admin/export` | Export CSV |

## 🧪 Test Card Numbers

Use these test card numbers (Luhn-valid):

| Card Type | Number | CVV |
|-----------|--------|-----|
| Visa | 4242 4242 4242 4242 | 123 |
| MasterCard | 5555 5555 5555 4444 | 123 |
| Amex | 3782 822463 10005 | 1234 |
| RuPay | 6074 8190 0000 0000 | 123 |

**OTP for all transactions: `123456`**

## 🎨 Screenshots

### Login Page
- Animated gradient background
- Glass-morphism card design
- Smooth form validation

### Dashboard with 3D Card
- Real-time card preview
- Live typing effect
- Card flip animation for CVV

### Payment Flow
- Form validation with Luhn check
- OTP modal with countdown
- Success/failure animations

### Admin Panel
- User management
- Transaction approval workflow
- Revenue analytics

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Card numbers stored as masked values
- Protected routes
- Role-based access control

## 📧 Email Simulation

Uses Ethereal (fake SMTP) by default:
- View sent emails at the Ethereal preview URL (logged in console)
- No real emails are sent
- To use Gmail, update `.env` with SMTP credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built by DHARSHAN

---

⭐ **Note**: This is a simulation project for educational purposes. No real payments are processed.

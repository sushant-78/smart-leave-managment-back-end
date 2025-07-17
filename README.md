# Smart Leave Management System - Backend

A comprehensive leave management system built with Node.js, Express, and MySQL. Features role-based access control, team management, audit logging, and automated leave balance tracking.

## 🚀 Features

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (Admin, Manager, Employee)
- Protected routes and middleware

### User Management

- Admin can create, edit, delete users
- Manager assignment and team management
- Role management (employee ↔ manager)
- Circular assignment prevention

### Leave Management

- Leave application with validation
- Overlapping leave prevention
- Manager approval workflow
- Leave balance tracking and deduction
- Holiday and weekend exclusion

### Admin Features

- System configuration (holidays, working days, leave types)
- Dashboard with statistics
- Audit log management
- Balance reset functionality

### Audit & Logging

- Comprehensive action logging
- Role-based audit access
- Filtering and pagination

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Sequelize
- **Database:** MySQL (via PlanetScale)
- **Authentication:** JWT
- **Validation:** Joi
- **Security:** Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL database (local or PlanetScale)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd smart-leave-managment-back-end
npm install
```

### 2. Environment Setup

Copy `config.env` and update with your database credentials:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_leave_management
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

Create a MySQL database named `smart_leave_management` or update the `DB_NAME` in your config.

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` and automatically seed the database with sample data.

## 📊 Sample Data

The system creates the following sample users:

| Role     | Email                 | Password    |
| -------- | --------------------- | ----------- |
| Admin    | admin@company.com     | admin123    |
| Manager  | manager@company.com   | manager123  |
| Employee | employee1@company.com | employee123 |
| Employee | employee2@company.com | employee123 |

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Users (Admin Only)

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/unassigned` - Get unassigned users
- `GET /api/users/managers` - Get all managers

### Leaves

- `GET /api/leaves` - Get leaves (filtered by role)
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves/:id` - Get leave by ID
- `PUT /api/leaves/:id` - Cancel leave
- `PUT /api/leaves/:id/approve` - Approve/reject leave
- `GET /api/leaves/balance` - Get leave balance
- `GET /api/leaves/team` - Get team leaves (Manager)

### Admin

- `GET /api/admin/dashboard` - Get dashboard stats
- `POST /api/admin/config` - Set system configuration
- `PUT /api/admin/config/:year/lock` - Lock configuration
- `POST /api/admin/reset-balances/:year` - Reset balances
- `GET /api/admin/config/current` - Get current config
- `GET /api/admin/pending-leaves/:manager_id` - Get pending leaves

### Audit

- `GET /api/audit` - Get all audit logs (Admin)
- `GET /api/audit/me` - Get own audit logs
- `GET /api/audit/user/:id` - Get user audit logs (Admin)

## 🔐 Role-Based Access

### Admin

- Full system access
- User management
- System configuration
- View all audit logs
- Dashboard statistics

### Manager

- Team member management
- Approve/reject team leaves
- View team calendar
- Apply for own leaves (approved by admin)

### Employee

- Apply for leaves
- View own leave history
- Check leave balance
- Cancel pending leaves

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
└── app.js          # Main application file
```

## 🚀 Deployment

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Database Migration

For production, use proper migrations instead of `sync()`:

```bash
npm run migrate
```

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run migrate    # Run database migrations
npm run seed       # Seed database
```

### API Testing

Use tools like Postman or curl to test the API endpoints. All requests (except login) require the `Authorization: Bearer <token>` header.

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For questions or issues, please create an issue in the repository.

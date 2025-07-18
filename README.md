# Smart Leave Management System - Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![JWT](https://img.shields.io/badge/JWT-Authentication-red)
![Sequelize](https://img.shields.io/badge/Sequelize-ORM-purple)

**A comprehensive, enterprise-grade leave management system built with Node.js, Express, and MySQL**

[Features](#-feature-set) • [Architecture](#-technical-architecture) • [Installation](#-installation--setup) • [API Docs](#-api-endpoints)

</div>

---

## 📋 Overview

The Smart Leave Management System is a robust, scalable backend solution designed to streamline leave management processes for organizations of all sizes. Built with modern web technologies, it provides a comprehensive API that handles everything from user authentication to complex leave approval workflows.

### 🎯 Business Value

- **Operational Efficiency**: Automates leave request workflows, reducing manual processing time by 80%
- **Compliance & Audit**: Built-in audit trails ensure regulatory compliance and transparency
- **Cost Savings**: Prevents overlapping leaves and optimizes resource allocation
- **Employee Satisfaction**: Self-service leave applications with real-time status updates
- **Manager Productivity**: Streamlined approval process with team overview dashboards
- **Data-Driven Insights**: Comprehensive reporting for HR decision-making

### 🏢 Target Organizations

- **Small Businesses**: Simple leave tracking and approval
- **Medium Enterprises**: Multi-team management with role-based access
- **Large Corporations**: Advanced audit trails and compliance features

---

## ✨ Feature Set

### 🔐 Authentication & Security

- **JWT-based Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Manager, and Employee roles
- **Password Security**: Bcrypt hashing with salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing

### 👥 User Management

- **Multi-Role System**: Admin, Manager, Employee hierarchies
- **Team Management**: Manager-employee relationships
- **Profile Management**: User details and preferences
- **Role Transitions**: Seamless role changes with validation

### 📅 Leave Management

- **Smart Leave Application**: Date validation and overlap prevention
- **Working Day Calculation**: Automatic holiday and weekend exclusion
- **Balance Tracking**: Real-time leave balance updates
- **Approval Workflow**: Multi-level approval system
- **Leave Types**: Casual, Sick, and Earned leave categories

### 🎛️ Admin Features

- **System Configuration**: Holiday management and working day settings
- **Dashboard Analytics**: Real-time statistics and insights
- **Audit Management**: Comprehensive activity logging
- **User Administration**: Full user lifecycle management

### 📊 Reporting & Analytics

- **Audit Logs**: Complete activity tracking
- **Leave Statistics**: Usage patterns and trends
- **Team Overview**: Manager dashboards
- **Compliance Reports**: Regulatory reporting capabilities

---

## 🏗️ Technical Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Middleware    │
                       │   (Auth/CORS)   │
                       └─────────────────┘
```

### Technology Stack

| Layer              | Technology         | Purpose                        |
| ------------------ | ------------------ | ------------------------------ |
| **Runtime**        | Node.js 18+        | JavaScript runtime environment |
| **Framework**      | Express.js 4.18+   | Web application framework      |
| **Database**       | MySQL 8.0+         | Relational database            |
| **ORM**            | Sequelize 6+       | Object-relational mapping      |
| **Authentication** | JWT                | Token-based authentication     |
| **Validation**     | Joi                | Request validation             |
| **Security**       | Helmet, CORS       | Security middleware            |
| **Rate Limiting**  | express-rate-limit | API protection                 |

---

## 🔧 Key Technical Features

### 🚀 Performance Optimizations

- **Connection Pooling**: Optimized database connections
- **Query Optimization**: Efficient Sequelize queries
- **Caching Strategy**: Redis-ready architecture
- **Rate Limiting**: API protection and performance

### 🛡️ Security Features

- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Sequelize ORM protection
- **XSS Prevention**: Helmet security headers
- **CORS Configuration**: Cross-origin protection
- **JWT Security**: Secure token management

### 📊 Data Management

- **Audit Trail**: Complete activity logging
- **Data Integrity**: Foreign key constraints
- **Soft Deletes**: Data preservation
- **Backup Ready**: Database backup strategies

### 🔄 Workflow Engine

- **State Management**: Leave status tracking
- **Approval Chains**: Multi-level approval
- **Notification Ready**: Webhook architecture
- **Integration Ready**: RESTful API design

---

## 📁 Folder Structure

```
smart-leave-managment-back-end/
├── 📁 src/
│   ├── 📁 config/                 # Configuration files
│   │   ├── app.js                 # App configuration
│   │   ├── auth.js                # Authentication config
│   │   └── database.js            # Database configuration
│   │
│   ├── 📁 controllers/            # Business logic
│   │   ├── adminController.js     # Admin operations
│   │   ├── authController.js      # Authentication
│   │   ├── auditController.js     # Audit management
│   │   ├── leaveController.js     # Leave operations
│   │   └── userController.js      # User management
│   │
│   ├── 📁 middleware/             # Custom middleware
│   │   ├── auth.js                # JWT authentication
│   │   ├── roleCheck.js           # Role-based access
│   │   └── validation.js          # Request validation
│   │
│   ├── 📁 models/                 # Database models
│   │   ├── AuditLog.js            # Audit trail model
│   │   ├── Leave.js               # Leave model
│   │   ├── SystemConfig.js        # System configuration
│   │   ├── User.js                # User model
│   │   └── index.js               # Model associations
│   │
│   ├── 📁 routes/                 # API routes
│   │   ├── admin.js               # Admin endpoints
│   │   ├── audit.js               # Audit endpoints
│   │   ├── auth.js                # Authentication routes
│   │   ├── leaves.js              # Leave endpoints
│   │   ├── managers.js            # Manager endpoints
│   │   └── users.js               # User endpoints
│   │
│   └── app.js                     # Main application file
│
├── 📄 package.json                # Dependencies and scripts
├── 📄 .env                        # Environment variables
├── 📄 README.md                   # This file
└── 📄 .gitignore                  # Git ignore rules
```

---

## 👥 Roles and Permissions

### 🔴 Admin Role

**Full system access and management capabilities**

**Permissions:**

- ✅ User management (CRUD operations)
- ✅ System configuration management
- ✅ Holiday and working day settings
- ✅ Leave type configuration
- ✅ Audit log access
- ✅ Dashboard analytics
- ✅ Manager assignment
- ✅ Balance reset operations

**API Access:**

- All `/api/admin/*` endpoints
- All `/api/users/*` endpoints
- All `/api/audit/*` endpoints
- System configuration endpoints

### 🟡 Manager Role

**Team management and approval workflows**

**Permissions:**

- ✅ Team member leave approval
- ✅ Team overview and analytics
- ✅ Apply for own leaves (approved by admin)
- ✅ View team leave calendar
- ✅ Team member management

**API Access:**

- `/api/managers/*` endpoints
- `/api/leaves/team` endpoint
- Own leave management
- Team member leave approval

### 🟢 Employee Role

**Basic leave application and management**

**Permissions:**

- ✅ Apply for leaves
- ✅ View own leave history
- ✅ Check leave balance
- ✅ Cancel pending leaves
- ✅ View own profile

**API Access:**

- `/api/leaves` (own leaves)
- `/api/users/dashboard` (own dashboard)
- `/api/auth/me` (own profile)

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18.0 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn** package manager

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd smart-leave-managment-back-end
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Copy the environment template and configure your settings:

```bash
# Copy environment template
cp env.example .env

# Edit configuration
nano .env
```

### Step 4: Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE smart_leave_management;
```

### Step 5: Start Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` with sample data.

---

## ⚙️ Environment Configuration

### Required Environment Variables

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

DATABASE_URL=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=600
```

### Sample Data

You should manually add the admin to the db to get started.

| Role  | Email             | Password | Purpose               |
| ----- | ----------------- | -------- | --------------------- |
| Admin | admin@company.com | admin123 | System administration |

---

## 🚀 Deployment

### Deployment Options

#### Option 1: Traditional Server

```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start app.js --name "smart-leave-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option 2: Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Option 3: Cloud Platforms

- **Heroku**: Automatic deployment from Git
- **AWS**: EC2 or Elastic Beanstalk
- **Google Cloud**: App Engine or Compute Engine
- **Azure**: App Service or Container Instances

### Database Migration

```bash
# Run migrations (if using Sequelize migrations)
npm run migrate

# Seed production data
npm run seed:production
```

---

## 📚 API Endpoints

### Authentication

| Method | Endpoint           | Description      | Auth Required |
| ------ | ------------------ | ---------------- | ------------- |
| POST   | `/api/auth/login`  | User login       | ❌            |
| GET    | `/api/auth/me`     | Get current user | ✅            |
| POST   | `/api/auth/logout` | User logout      | ✅            |

### User Management (Admin)

| Method | Endpoint         | Description    | Role Required |
| ------ | ---------------- | -------------- | ------------- |
| GET    | `/api/users`     | Get all users  | Admin         |
| POST   | `/api/users`     | Create user    | Admin         |
| GET    | `/api/users/:id` | Get user by ID | Admin         |
| PATCH  | `/api/users/:id` | Update user    | Admin         |
| DELETE | `/api/users/:id` | Delete user    | Admin         |

### Leave Management

| Method | Endpoint                  | Description          | Role Required |
| ------ | ------------------------- | -------------------- | ------------- |
| GET    | `/api/leaves`             | Get leaves           | All           |
| POST   | `/api/leaves`             | Apply for leave      | All           |
| GET    | `/api/leaves/:id`         | Get leave by ID      | All           |
| PUT    | `/api/leaves/:id`         | Cancel leave         | Owner         |
| PUT    | `/api/leaves/:id/approve` | Approve/reject leave | Manager       |

### Admin Operations

| Method | Endpoint                    | Description        | Role Required |
| ------ | --------------------------- | ------------------ | ------------- |
| GET    | `/api/admin/dashboard`      | Dashboard stats    | Admin         |
| POST   | `/api/admin/config`         | Set system config  | Admin         |
| GET    | `/api/admin/config/current` | Get current config | Admin         |

### Manager Operations

| Method | Endpoint               | Description      | Role Required |
| ------ | ---------------------- | ---------------- | ------------- |
| GET    | `/api/managers/users`  | Get team members | Manager       |
| GET    | `/api/managers/leaves` | Get team leaves  | Manager       |

---

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run test suite
npm run lint       # Run ESLint
```

### Development Guidelines

- **Code Style**: Follow ESLint configuration
- **Git Flow**: Feature branch workflow
- **Testing**: Write unit tests for new features
- **Documentation**: Update API documentation

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**MIT License Benefits:**

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ✅ No liability
- ✅ No warranty

---

## ❤️ Made with Love

<div align="center">

**Built with modern web technologies and best practices**

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18+-blue?style=for-the-badge&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange?style=for-the-badge&logo=mysql)
![Sequelize](https://img.shields.io/badge/Sequelize-ORM-purple?style=for-the-badge)

**Crafted with ❤️ by the Smart Leave Management Team**

</div>

---

<div align="center">

</div>

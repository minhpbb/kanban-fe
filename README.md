# 🚀 Kanban Project Management System

A modern, full-stack project management application with real-time collaboration, task management, and team coordination.

## 📋 Project Overview

This repository contains both frontend and backend components of a comprehensive Kanban project management system:

- **🎨 Frontend**: Modern React/Next.js application with real-time features
- **⚙️ Backend**: Robust NestJS API with MySQL database
- **🔄 Real-time**: Server-Sent Events for live updates
- **👥 Team Collaboration**: Multi-user project management

## 🏗️ Architecture

```
kanban/
├── fe/          # Frontend Application (Next.js)
├── be/          # Backend API (NestJS)
└── README.md    # This file
```

## 🚀 Quick Start

### Option 1: Run Everything
```bash
# Clone repository
git clone <repository-url>
cd kanban

# Start Backend
cd be
npm install
npm run start:dev

# Start Frontend (new terminal)
cd fe
npm install
npm run dev
```

### Option 2: Run Individual Components
- **Frontend Only**: See [Frontend README](./fe/README.md)
- **Backend Only**: See [Backend README](./be/README.md)

## 📚 Documentation

| Component | Description | Documentation |
|-----------|-------------|---------------|
| 🎨 **Frontend** | Next.js application with React, TypeScript, Ant Design | [📖 Frontend Docs](./fe/README.md) |
| ⚙️ **Backend** | NestJS API with MySQL, JWT auth, real-time features | [📖 Backend Docs](./be/README.md) | 

## ✨ Key Features

### 🎯 Core Features
- **Project Management**: Create and manage multiple projects
- **Kanban Boards**: Drag-and-drop task management
- **Team Collaboration**: Multi-user support with role-based access
- **Real-time Updates**: Live synchronization using SSE
- **Task Management**: Rich task creation with multiple assignees
- **File Attachments**: Upload and manage task files
- **Comments System**: Collaborative task discussions

### 🔧 Technical Features
- **Responsive Design**: Works on desktop and mobile
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Admin, Owner, Member roles
- **Search & Filter**: Advanced search capabilities
- **Time Tracking**: Track estimated vs actual hours
- **Activity Logs**: Complete audit trail

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Real-time**: Server-Sent Events

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Server-Sent Events
- **Documentation**: Swagger/OpenAPI

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| 🎨 **Frontend** | http://localhost:3000 | Main application interface |
| ⚙️ **Backend API** | http://localhost:3001 | REST API endpoints |
| 📚 **API Docs** | http://localhost:3001/api | Swagger documentation |

## 🚀 Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Getting Started
1. **Clone the repository**
2. **Set up Backend**: Follow [Backend Setup](./be/README.md#-setup)
3. **Set up Frontend**: Follow [Frontend Setup](./fe/README.md#-setup)
4. **Start Development**: Run both services

### Project Structure
```
kanban/
├── fe/                    # Frontend (Next.js)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Next.js pages
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── README.md          # Frontend documentation
├── be/                    # Backend (NestJS)
│   ├── src/
│   │   ├── auth/          # Authentication
│   │   ├── users/         # User management
│   │   ├── projects/      # Project management
│   │   ├── tasks/         # Task management
│   │   └── kanban/        # Kanban boards
│   └── README.md          # Backend documentation
└── README.md              # This file
```

## 🤝 Contributing

We welcome contributions! Please see individual project READMEs for contribution guidelines:

- **Frontend Contributions**: [Frontend Contributing](./fe/README.md#-contributing)
- **Backend Contributions**: [Backend Contributing](./be/README.md#-contributing)

### General Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS** for the excellent backend framework
- **Next.js** for the powerful React framework
- **Ant Design** for the beautiful UI components
- **TypeORM** for the robust database management

---

**Built with ❤️ by the development team**

## 📞 Support

For questions and support:
- **Frontend Issues**: [Frontend Issues](./fe/README.md#-support)
- **Backend Issues**: [Backend Issues](./be/README.md#-support)
- **General Questions**: Open an issue in this repository

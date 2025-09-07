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

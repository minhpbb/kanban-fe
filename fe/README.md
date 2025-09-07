# 🎨 Kanban Frontend

Modern React/Next.js application for project management with real-time collaboration features.

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Real-time**: Server-Sent Events (SSE)
- **Drag & Drop**: @dnd-kit

## 🚀 Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd fe

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎯 Key Features

### 🏠 Dashboard
- **Project Overview**: Display all user projects with statistics
- **Task Statistics**: Task count by status and priority
- **Recent Activity**: Latest activities across all projects
- **Quick Actions**: Create new project, quick task creation

### 📋 Project Management
- **Project Grid**: Grid view of project cards with basic information
- **Project Creation**: Create new projects with name, description, and avatar
- **Project Settings**: Project configuration and member management
- **Member Management**: Add/remove members with role-based permissions

### 📊 Kanban Boards
- **Drag & Drop**: Drag and drop tasks between columns using @dnd-kit
- **Customizable Columns**: Create, edit, and delete Kanban columns
- **Task Cards**: Display task information on interactive cards
- **Real-time Updates**: Live updates when changes occur

### 📝 Task Management
- **Task Creation**: Comprehensive task creation form
- **Multiple Assignees**: Assign tasks to multiple team members
- **Task Details**: Detailed task view with comments and attachments
- **Comments System**: Collaborative commenting on tasks
- **File Attachments**: Attach files to tasks

### 🔔 Real-time Notifications
- **Notification Bell**: Real-time notification system with unread count
- **SSE Integration**: Server-Sent Events for instant updates
- **Activity Logs**: Real-time activity tracking across projects
- **Auto-cleanup**: Automatic task unassignment when members are removed

## 📱 Main Screens

### 🏠 Home Page (Dashboard)
- **Layout**: Sidebar navigation + Main content area
- **Sidebar**: Navigation menu and project list
- **Main**: Project statistics, recent activities, and quick actions
- **Header**: Logo, search, notification bell, and user avatar

### 📋 Projects Page
- **Layout**: Grid view of project cards
- **Project Card**: Avatar, name, description, task count, and members
- **Actions**: "Add New Project" button and dropdown menu for each project
- **Filter**: Filter by status and search functionality

### 📊 Project Detail Page
- **Tabs**: Overview, Members, and Task Management
- **Overview Tab**: Project statistics, charts, and recent activities
- **Members Tab**: Member list, pending invitations, and role management
- **Task Management Tab**: Kanban board with drag & drop functionality

### 📝 Kanban Board
- **Columns**: Status columns (To Do, In Progress, Done, etc.)
- **Task Cards**: Display in respective columns with essential information
- **Drag & Drop**: Move tasks between columns seamlessly
- **Add Task**: "+" button to create new tasks
- **Add Column**: "+" button to create new columns

### 🔔 Notification System
- **Icon**: Bell icon with unread notification badge
- **Dropdown**: Notification list when clicked
- **Real-time**: Live updates when new notifications arrive
- **Mark as Read**: Individual and bulk mark as read functionality



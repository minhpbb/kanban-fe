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
- **Project Overview**: Hiển thị danh sách tất cả dự án của user
- **Task Statistics**: Thống kê số lượng task theo trạng thái
- **Recent Activity**: Hoạt động gần đây trong các dự án
- **Quick Actions**: Nút tạo dự án mới, tạo task nhanh

### 📋 Project Management
- **Project Grid**: Hiển thị dự án dạng lưới với thông tin cơ bản
- **Project Creation**: Form tạo dự án mới với tên, mô tả, avatar
- **Project Settings**: Cài đặt dự án, quản lý thành viên
- **Member Management**: Thêm/xóa thành viên, phân quyền

### 📊 Kanban Boards
- **Drag & Drop**: Kéo thả task giữa các cột
- **Customizable Columns**: Tạo, sửa, xóa cột Kanban
- **Task Cards**: Hiển thị thông tin task trên card
- **Real-time Updates**: Cập nhật real-time khi có thay đổi

### 📝 Task Management
- **Task Creation**: Form tạo task với đầy đủ thông tin
- **Multiple Assignees**: Gán task cho nhiều người
- **Task Details**: Modal hiển thị chi tiết task
- **Comments System**: Bình luận trên task
- **File Attachments**: Đính kèm file vào task

## 📱 Màn hình chính

### 🏠 Trang chủ (Dashboard)
- **Layout**: Sidebar + Main content
- **Sidebar**: Menu navigation, danh sách dự án
- **Main**: Thống kê tổng quan, hoạt động gần đây
- **Header**: Logo, search, notification bell, user avatar

### 📋 Trang dự án (Projects)
- **Layout**: Grid view các project cards
- **Project Card**: Avatar, tên, mô tả, số task, thành viên
- **Actions**: Nút "Add New Project", dropdown menu cho mỗi project
- **Filter**: Lọc theo trạng thái, tìm kiếm

### 📊 Trang chi tiết dự án (Project Detail)
- **Tabs**: Overview, Members, Task Management
- **Overview Tab**: Thống kê dự án, biểu đồ, hoạt động gần đây
- **Members Tab**: Danh sách thành viên, lời mời chờ duyệt
- **Task Management Tab**: Kanban board với drag & drop

### 📝 Kanban Board
- **Columns**: Các cột trạng thái (To Do, In Progress, Done, etc.)
- **Task Cards**: Hiển thị trong từng cột với thông tin cơ bản
- **Drag & Drop**: Kéo thả giữa các cột
- **Add Task**: Nút "+" để tạo task mới
- **Add Column**: Nút "+" để tạo cột mới

### 🔔 Notification Bell
- **Icon**: Bell icon với badge số thông báo chưa đọc
- **Dropdown**: Danh sách thông báo khi click
- **Real-time**: Cập nhật real-time khi có thông báo mới

## 📸 Phần cần ảnh

### 🎯 **Ảnh bắt buộc cần có:**

1. **🏠 Dashboard/Home Page** - `dashboard.png`
   - Toàn bộ màn hình trang chủ
   - Hiển thị sidebar, thống kê, hoạt động gần đây

2. **📋 Projects Page** - `projects.png`
   - Grid view các project cards
   - Nút "Add New Project"
   - Dropdown menu trên project card

3. **📊 Project Detail - Overview Tab** - `project-overview.png`
   - Tab Overview với thống kê, biểu đồ
   - Thông tin dự án, hoạt động gần đây

4. **👥 Project Detail - Members Tab** - `project-members.png`
   - Danh sách thành viên
   - Form thêm thành viên mới
   - Lời mời chờ duyệt

5. **📝 Project Detail - Task Management Tab** - `kanban-board.png`
   - Kanban board với các cột
   - Task cards trong các cột
   - Nút add task, add column

6. **🔔 Notification Bell** - `notification-bell.png`
   - Bell icon với badge
   - Dropdown thông báo khi mở

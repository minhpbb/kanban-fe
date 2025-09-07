"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Button, Card, Statistic, Alert } from "antd";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";
import { formatDate } from "@/utils/dateUtils";

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, assignedTasks, recentProjects, isLoading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    // Fetch dashboard data when component mounts
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const getProjectIcon = (projectName: string) => {
    if (projectName.includes("Mobile")) return "M";
    if (projectName.includes("Website")) return "W";
    return "P";
  };

  const getProjectColor = (projectName: string) => {
    if (projectName.includes("Mobile")) return "bg-blue-500";
    if (projectName.includes("Website")) return "bg-green-500";
    return "bg-gray-500";
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button 
              onClick={() => dispatch(fetchDashboardData())}
              icon={<ReloadOutlined />}
            >
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="text-center">
          <Statistic
            title="Total Projects"
            value={stats?.totalProjects || 0}
            valueStyle={{ color: "#3f8600" }}
            prefix={<ArrowUpOutlined />}
            loading={isLoading}
          />
        </Card>

        <Card className="text-center">
          <Statistic
            title="Total Tasks"
            value={stats?.totalTasks || 0}
            valueStyle={{ color: "#3f8600" }}
            prefix={<ArrowUpOutlined />}
            loading={isLoading}
          />
        </Card>

        <Card className="text-center">
          <Statistic
            title="Assigned Tasks"
            value={stats?.assignedTasks || 0}
            valueStyle={{ color: "#3f8600" }}
            prefix={<ArrowUpOutlined />}
            loading={isLoading}
          />
        </Card>

        <Card className="text-center">
          <Statistic
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            valueStyle={{ color: "#3f8600" }}
            prefix={<ArrowUpOutlined />}
            loading={isLoading}
          />
        </Card>

        <Card className="text-center">
          <Statistic
            title="Overdue Tasks"
            value={stats?.overdueTasks || 0}
            valueStyle={{ color: "#cf1322" }}
            prefix={<ArrowDownOutlined />}
            loading={isLoading}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Assigned Tasks ({assignedTasks.length})</span>
              <Button type="text" icon={<PlusOutlined />} />
            </div>
          }
          className="h-fit"
          loading={isLoading}
        >
          <div className="space-y-4">
            {assignedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">No assigned tasks</div>
                <div className="text-xs mt-1">Tasks assigned to you will appear here</div>
              </div>
            ) : (
              assignedTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm mb-1">
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>Project ID: {task.projectId}</span>
                      {task.dueDate && (
                        <>
                          <ClockCircleOutlined />
                          <span>{getDaysUntilDue(task.dueDate)} days</span>
                        </>
                      )}
                      {task.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {assignedTasks.length > 3 && (
              <Button type="link" className="w-full text-blue-500">
                Show All ({assignedTasks.length} tasks)
              </Button>
            )}
          </div>
        </Card>

        {/* Projects */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Recent Projects ({recentProjects.length})</span>
              <Button type="text" icon={<PlusOutlined />} />
            </div>
          }
          className="h-fit"
          loading={isLoading}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentProjects.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <div className="text-sm">No projects</div>
                <div className="text-xs mt-1">Your projects will appear here</div>
              </div>
            ) : (
              recentProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 ${getProjectColor(
                        project.name
                      )} rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-sm">
                        {getProjectIcon(project.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">
                        {project.name}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Updated: {formatDate(project.updatedAt || project.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;

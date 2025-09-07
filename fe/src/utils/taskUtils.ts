import { Task } from '@/types/task';
import { KanbanColumn } from '@/types/kanban-board';

/**
 * Compute task status from columnId and column name
 * This maps column names to standard status values
 */
export const getTaskStatus = (task: Task, columns: KanbanColumn[]): string => {
  const column = columns.find(col => col.id === task.columnId);
  if (!column) return 'unknown';

  // Map column names to standard status values
  const statusMap: { [key: string]: string } = {
    'backlog': 'backlog',
    'todo': 'todo',
    'to do': 'todo',
    'in progress': 'in_progress',
    'doing': 'in_progress',
    'in review': 'in_review',
    'review': 'in_review',
    'testing': 'testing',
    'done': 'done',
    'completed': 'done',
    'deployed': 'deployed',
    'cancelled': 'cancelled',
  };

  const columnName = column.name.toLowerCase().trim();
  return statusMap[columnName] || 'todo'; // Default to 'todo' if not found
};

/**
 * Get status color for display
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'backlog': return 'gray';
    case 'todo': return 'blue';
    case 'in_progress': return 'orange';
    case 'in_review': return 'purple';
    case 'testing': return 'yellow';
    case 'done': return 'green';
    case 'deployed': return 'green';
    case 'cancelled': return 'red';
    default: return 'default';
  }
};

/**
 * Get status display text
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'backlog': return 'Backlog';
    case 'todo': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'in_review': return 'In Review';
    case 'testing': return 'Testing';
    case 'done': return 'Done';
    case 'deployed': return 'Deployed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

/**
 * Filter tasks by status
 */
export const filterTasksByStatus = (tasks: Task[], status: string, columns: KanbanColumn[]): Task[] => {
  return tasks.filter(task => getTaskStatus(task, columns) === status);
};

/**
 * Get task statistics by status
 */
export const getTaskStats = (tasks: Task[], columns: KanbanColumn[]) => {
  const stats = {
    total: tasks.length,
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    testing: 0,
    done: 0,
    deployed: 0,
    cancelled: 0,
  };

  tasks.forEach(task => {
    const status = getTaskStatus(task, columns);
    if (status in stats) {
      stats[status as keyof typeof stats]++;
    }
  });

  return stats;
};

'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch } from 'antd';
import { KanbanColumn, ColumnType, ColumnColor } from '@/types/kanban-board';

interface ColumnFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Partial<KanbanColumn>) => void;
  column?: KanbanColumn | null;
  // boardId: number; // Not needed for update operations
  loading?: boolean;
}

const ColumnForm: React.FC<ColumnFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  column,
  // boardId,
  loading = false
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (column) {
        // Edit mode - only allow editing custom columns
        if (column.type === ColumnType.SYSTEM) {
          // For system columns, only allow editing description and WIP settings
          form.setFieldsValue({
            description: column.description,
            maxTasks: column.maxTasks,
            isWipLimit: column.isWipLimit,
            wipLimit: column.wipSettings?.limit,
            warningThreshold: column.wipSettings?.warningThreshold,
          });
        } else {
          // For custom columns, allow editing everything
          form.setFieldsValue({
            name: column.name,
            description: column.description,
            type: column.type,
            color: column.color,
            order: column.order,
            maxTasks: column.maxTasks,
            isActive: column.isActive,
            isWipLimit: column.isWipLimit,
            wipLimit: column.wipSettings?.limit,
            warningThreshold: column.wipSettings?.warningThreshold,
          });
        }
      } else {
        // Add mode
        form.setFieldsValue({
          type: ColumnType.CUSTOM,
          color: ColumnColor.BLUE,
          order: 0,
          maxTasks: 0,
          isActive: true,
          isWipLimit: false,
        });
      }
    }
  }, [visible, column, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Process WIP settings
      const wipSettings = values.isWipLimit ? {
        limit: values.wipLimit || 0,
        warningThreshold: values.warningThreshold || 0,
        color: values.color || ColumnColor.BLUE,
      } : undefined;

      const columnData = {
        name: values.name,
        description: values.description,
        type: values.type,
        color: values.color,
        order: values.order,
        maxTasks: values.maxTasks,
        isActive: values.isActive,
        isWipLimit: values.isWipLimit,
        wipSettings,
        rules: values.rules,
      };

      onSubmit(columnData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const isSystemColumn = column?.type === ColumnType.SYSTEM;

  return (
    <Modal
      title={column ? (isSystemColumn ? 'Edit System Column' : 'Edit Column') : 'Add New Column'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={500}
      okText={column ? 'Update' : 'Create'}
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="Column Name"
          rules={[{ required: true, message: 'Please enter column name' }]}
        >
          <Input 
            placeholder="Enter column name" 
            disabled={isSystemColumn}
            addonAfter={isSystemColumn ? '(System Column)' : ''}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={2} 
            placeholder="Enter column description"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="type"
            label="Column Type"
            rules={[{ required: true, message: 'Please select column type' }]}
          >
            <Select disabled={isSystemColumn}>
              <Select.Option value={ColumnType.SYSTEM}>System</Select.Option>
              <Select.Option value={ColumnType.CUSTOM}>Custom</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="color"
            label="Column Color"
            rules={[{ required: true, message: 'Please select column color' }]}
          >
            <Select disabled={isSystemColumn}>
              <Select.Option value={ColumnColor.BLUE}>Blue</Select.Option>
              <Select.Option value={ColumnColor.GREEN}>Green</Select.Option>
              <Select.Option value={ColumnColor.ORANGE}>Orange</Select.Option>
              <Select.Option value={ColumnColor.RED}>Red</Select.Option>
              <Select.Option value={ColumnColor.PURPLE}>Purple</Select.Option>
              <Select.Option value={ColumnColor.YELLOW}>Yellow</Select.Option>
              <Select.Option value={ColumnColor.GRAY}>Gray</Select.Option>
              <Select.Option value={ColumnColor.PINK}>Pink</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="order"
            label="Order Position"
            rules={[{ required: true, message: 'Please enter order position' }]}
          >
            <InputNumber 
              min={0} 
              className="w-full" 
              placeholder="0"
              disabled={isSystemColumn}
            />
          </Form.Item>

          <Form.Item
            name="maxTasks"
            label="Max Tasks"
            help="0 means unlimited"
          >
            <InputNumber 
              min={0} 
              className="w-full" 
              placeholder="0"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="isWipLimit"
          label="Enable WIP Limit"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.isWipLimit !== currentValues.isWipLimit}
        >
          {({ getFieldValue }) => {
            const isWipLimit = getFieldValue('isWipLimit');
            return isWipLimit ? (
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="wipLimit"
                  label="WIP Limit"
                  rules={[{ required: true, message: 'Please enter WIP limit' }]}
                >
                  <InputNumber 
                    min={1} 
                    className="w-full" 
                    placeholder="5"
                  />
                </Form.Item>

                <Form.Item
                  name="warningThreshold"
                  label="Warning Threshold"
                  help="Show warning when reached"
                >
                  <InputNumber 
                    min={1} 
                    className="w-full" 
                    placeholder="3"
                  />
                </Form.Item>
              </div>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ColumnForm;

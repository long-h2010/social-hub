import { UserDisplay } from '@/components/molecules';
import { ReportReason, ReportStatus } from '@/types';
import {
  DeleteOutlined,
  MinusOutlined,
  StopOutlined,
  ThunderboltOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useTable } from '@refinedev/antd';
import {
  useCustomMutation,
  useDelete,
  useInvalidate,
  useUpdate,
} from '@refinedev/core';
import {
  Badge,
  Button,
  Card,
  message,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const reasonOptions = [
  { label: 'All', value: '' },
  { label: 'Invalid', value: ReportReason.INVALID },
  { label: 'Toxic language', value: ReportReason.TOXIC },
  { label: 'Spam', value: ReportReason.SPAM },
  { label: 'Misinfomation', value: ReportReason.MISINFORMATION },
  { label: 'NSFW', value: ReportReason.NSFW },
  { label: 'Violence', value: ReportReason.VIOLENCE },
  { label: 'Hate speech', value: ReportReason.HATE_SPEECH },
  { label: 'Scam', value: ReportReason.SCAM },
  { label: 'Sexual', value: ReportReason.SEXUAL },
];

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Pending', value: ReportStatus.PENDING },
  { label: 'Dismissed', value: ReportStatus.DISMISSED },
  { label: 'Processed', value: ReportStatus.PROCESSED },
];

const reviewOption = [
  { label: 'All', value: '' },
  { label: 'Safe', value: 'safe' },
  { label: 'Warning', value: 'warning' },
];

export const ReportList = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reasonFilter, setReasonFilter] = useState<ReportReason | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(
    undefined,
  );
  const [batchLoading, setBatchLoading] = useState(false);
  const [messageApi] = message.useMessage();
  const invalidate = useInvalidate();

  const { tableProps, setFilters } = useTable({
    filters: {
      permanent: [],
    },
    syncWithLocation: false,
  });

  useEffect(() => {
    setReports(tableProps.dataSource as any[]);
  }, [tableProps.dataSource]);

  const { mutateAsync } = useCustomMutation();
  const { mutate: updateReport } = useUpdate();
  const { mutate: updatePost } = useUpdate();
  const { mutate: updateUser } = useUpdate();

  const runAI = async (content: string, reportId: number) => {
    await mutateAsync(
      {
        url: import.meta.env.VITE_APP_REPORTS_MODERATION_ENDPOINT,
        method: 'post',
        values: {
          content: content,
        },
      },
      {
        onSuccess: (res: any) => {
          const aiReview = res.data.level;

          setReports((prev) =>
            prev.map((r) => (r.id === reportId ? { ...r, aiReview } : r)),
          );

          updateReport({
            resource: import.meta.env.VITE_APP_REPORTS_ENDPOINT,
            id: reportId,
            values: { status: ReportStatus.PROCESSED, aiReview: aiReview },
            mutationMode: 'optimistic',
            successNotification: false,
            errorNotification: false,
          });
        },
      },
    );
  };

  const handleReasonChange = (value: ReportReason | undefined) => {
    setReasonFilter(value);

    if (value) {
      setFilters([{ field: 'reason', operator: 'eq', value }], 'replace');
    } else {
      setFilters([], 'replace');
    }
  };

  const handleStatusChange = (value: ReportStatus | undefined) => {
    setStatusFilter(value);

    if (value) {
      setFilters([{ field: 'status', operator: 'eq', value }], 'replace');
    } else {
      setFilters([], 'replace');
    }
  };

  const runBatchAI = useCallback(async () => {
    const pending = reports.filter((r) => r.status === 'pending');
    if (!pending.length) {
      messageApi.info('No pending reports to evaluate.');
      return;
    }
    setBatchLoading(true);
    for (const r of pending) {
      await runAI(r.post.content, r.id);
      await new Promise((res) => setTimeout(res, 500));
    }
    setBatchLoading(false);
    messageApi.success(
      `Batch evaluation complete for ${pending.length} reports.`,
    );
  }, [reports, messageApi]);

  const handleToggleBan = (author: any) => {
    updateUser(
      {
        id: author.id,
        values: {
          status: author.status === 'banned' ? 'active' : 'banned',
        },
        resource: import.meta.env.VITE_APP_USERS_ENDPOINT,
      },
      {
        onSuccess: () =>
          invalidate({ resource: 'reports', invalidates: ['list'] }),
      },
    );
  };

  const handleRemovePost = (postId: string, deleted: boolean) => {
    updatePost(
      {
        id: postId,
        values: { deletedAt: deleted ? null : Date.now() },
        resource: import.meta.env.VITE_APP_POSTS_ENDPOINT,
      },
      {
        onSuccess: () =>
          invalidate({ resource: 'reports', invalidates: ['list'] }),
      },
    );
  };

  return (
    <div className='flex flex-col gap-10'>
      <Card>
        <div className='flex justify-between'>
          <div className='flex gap-10'>
            <div className='flex items-center gap-3'>
              <span className='uppercase text-xs'>Reason: </span>
              <Select
                placeholder='Reason'
                options={reasonOptions}
                value={reasonFilter}
                onChange={handleReasonChange}
                className='min-w-[140px]'
              />
            </div>
            <div className='flex items-center gap-3'>
              <span className='uppercase text-xs'>Status: </span>
              <Select
                placeholder='Status'
                options={statusOptions}
                value={statusFilter}
                onChange={handleStatusChange}
                className='min-w-[120px]'
              />
            </div>
            <div className='flex items-center gap-3'>
              <span className='uppercase text-xs'>AI Review: </span>
              <Select
                placeholder='Status'
                options={reviewOption}
                className='min-w-[120px]'
              />
            </div>
          </div>
          <Button
            type='primary'
            icon={<ThunderboltOutlined />}
            loading={batchLoading}
            onClick={runBatchAI}
          >
            Review with AI
          </Button>
        </div>
      </Card>

      <Table
        dataSource={reports}
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
          },
        }}
        rowKey={'id'}
      >
        <Table.Column
          dataIndex={['post', 'author']}
          title='AUTHOR'
          render={(value) => (
            <UserDisplay name={value.name} avatar={value.avatar} />
          )}
        />
        <Table.Column dataIndex={['post', 'content']} title='CONTENT' />
        <Table.Column
          dataIndex={'reason'}
          title='REASON'
          render={(values: ReportReason[]) =>
            values.map((value: ReportReason) => (
              <Tag key={value} className='capitalize'>
                {value}
              </Tag>
            ))
          }
        />
        <Table.Column
          dataIndex={'status'}
          title='STATUS'
          render={(value: ReportStatus) => (
            <Tag
              key={value}
              color={
                value == 'processed'
                  ? 'success'
                  : value == 'dismissed'
                  ? 'error'
                  : 'warning'
              }
              className='capitalize'
            >
              {value}
            </Tag>
          )}
        />
        <Table.Column
          title='AI REVIEWS'
          dataIndex={'aiReview'}
          render={(value: string) => (
            <Tag
              key={value}
              color={value == 'safe' ? 'success' : 'error'}
              className='capitalize'
            >
              {value}
            </Tag>
          )}
        />
        <Table.Column
          title='HANDLING VIOLATIONS'
          dataIndex={'post'}
          render={(value) => (
            <div className='flex flex-col'>
              {value.author.status == 'banned' ? (
                <Badge status='error' text='Lock author account' />
              ) : (
                <></>
              )}
              {value.deletedAt ? (
                <Badge status='error' text='Remove post' />
              ) : (
                <></>
              )}
            </div>
          )}
        />
        <Table.Column
          align='center'
          render={(_, record) => (
            <Space>
              {record.post.author.status == 'banned' ? (
                <Tooltip title='Unban author'>
                  <Button
                    icon={<MinusOutlined />}
                    size='small'
                    style={{ color: 'green', borderColor: 'green' }}
                    onClick={() => handleToggleBan(record.post.author)}
                  />
                </Tooltip>
              ) : (
                <Tooltip>
                  <Button
                    icon={<StopOutlined />}
                    size='small'
                    danger
                    onClick={() => handleToggleBan(record.post.author)}
                  />
                </Tooltip>
              )}
              {record.post.deletedAt ? (
                <Tooltip title='Restore post'>
                  <Button
                    icon={<UndoOutlined />}
                    size='small'
                    style={{ color: 'green', borderColor: 'green' }}
                    onClick={() => handleRemovePost(record.post.id, true)}
                  />
                </Tooltip>
              ) : (
                <Tooltip title='Remove post'>
                  <Button
                    icon={<DeleteOutlined />}
                    size='small'
                    danger
                    onClick={() => handleRemovePost(record.post.id, false)}
                  />
                </Tooltip>
              )}
            </Space>
          )}
        />
      </Table>
    </div>
  );
};

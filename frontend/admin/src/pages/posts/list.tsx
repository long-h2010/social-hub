import { UserDisplay } from '@/components/molecules';
import { formatDate } from '@/lib/utils';
import { UndoOutlined } from '@ant-design/icons';
import { DeleteButton, useTable } from '@refinedev/antd';
import { useInvalidate, useUpdate } from '@refinedev/core';
import { Button, Image, Space, Table } from 'antd';
import { useState } from 'react';

export const PostList = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable();
  const invalidate = useInvalidate();

  const { mutate: updatePost } = useUpdate();

  const handleRestorePost = (postId: string) => {
    updatePost(
      {
        id: postId,
        values: { deletedAt: null },
        resource: import.meta.env.VITE_APP_POSTS_ENDPOINT,
      },
      {
        onSuccess: () =>
          invalidate({ resource: 'posts', invalidates: ['list'] }),
      },
    );
  };

  return (
    <Table
      {...tableProps}
      rowSelection={{
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
          setSelectedRowKeys(newSelectedRowKeys);
        },
      }}
      rowKey={'id'}
    >
      <Table.Column
        title='AUTHOR'
        dataIndex={'author'}
        render={(value) => (
          <UserDisplay name={value.name} avatar={value.avatar} />
        )}
      />
      <Table.Column title='CONTENT' dataIndex={'content'} />
      <Table.Column
        title='IMAGES'
        dataIndex={'images'}
        render={(value: string[]) =>
          value.map((img) => <Image src={img} width={40} />)
        }
      />
      <Table.Column
        title='LIKES'
        dataIndex={'likes'}
        render={(value) => value.length}
      />
      <Table.Column title='COMMENTS' dataIndex={'comments'} />
      <Table.Column
        title='DELETED AT'
        dataIndex={'deletedAt'}
        render={(value) => (value ? formatDate(value) : <></>)}
      />
      <Table.Column
        title='POSTED AT'
        dataIndex={'createdAt'}
        render={(value) => formatDate(value)}
      />
      <Table.Column
        align='center'
        render={(_, record) => {
          if (!record.deletedAt)
            return (
              <Space>
                <DeleteButton hideText size='small' recordItemId={record.id} />
              </Space>
            );
          else
            return (
              <Button
                icon={<UndoOutlined />}
                size='small'
                style={{ color: 'green', borderColor: 'green' }}
                onClick={() => handleRestorePost(record.id)}
              />
            );
        }}
      />
    </Table>
  );
};

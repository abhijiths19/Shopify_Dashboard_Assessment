// frontend/src/components/OrderList.jsx
import React from 'react';
import { Card, ResourceList, TextStyle, Button, Stack } from '@shopify/polaris';

export default function OrderList({ orders, onOpen, onSync, isSyncing }) {
  return (
    <Card title="Recent Orders (last 60 days)">
      <Card.Section>
        <Stack distribution="equalSpacing">
          <div>
            <Button primary onClick={onSync} loading={isSyncing}>Sync Orders</Button>
          </div>
        </Stack>
      </Card.Section>

      <Card.Section>
        <ResourceList
          resourceName={{ singular: 'order', plural: 'orders' }}
          items={orders}
          renderItem={(item) => {
            const { orderId, createdAt, status, total, currency } = item;
            return (
              <ResourceList.Item id={orderId}>
                <Stack alignment="center" distribution="equalSpacing">
                  <div>
                    <TextStyle variation="strong">{orderId || item.name}</TextStyle>
                    <div>{createdAt ? new Date(createdAt).toLocaleString() : ''}</div>
                    <div>{status} — {total} {currency}</div>
                  </div>
                  <div>
                    <Button onClick={() => onOpen(item)}>View</Button>
                  </div>
                </Stack>
              </ResourceList.Item>
            );
          }}
        />
      </Card.Section>
    </Card>
  );
}

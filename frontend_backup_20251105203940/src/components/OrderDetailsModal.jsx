// frontend/src/components/OrderDetailsModal.jsx
import React from 'react';
import { Modal, Card, DataTable, TextStyle, Stack, Thumbnail } from '@shopify/polaris';

export default function OrderDetailsModal({ open, order, onClose }) {
  if (!order) return null;

  const rows = (order.lineItems || []).map(li => [
    li.name || '-',
    li.qty || 0,
    li.price || '0',
    li.imageURL ? <Thumbnail source={li.imageURL} alt={li.name} /> : '-'
  ]);

  return (
    <Modal open={open} onClose={onClose} title={`Order ${order.orderId || order.name || ''}`}>
      <Modal.Section>
        <Stack alignment="center" distribution="equalSpacing">
          <div>
            <TextStyle variation="strong">Status:</TextStyle> {order.status}
          </div>
          <div>
            <TextStyle variation="strong">Created:</TextStyle>{' '}
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
          </div>
          <div>
            <TextStyle variation="strong">Total:</TextStyle> {order.total} {order.currency}
          </div>
        </Stack>
      </Modal.Section>

      <Modal.Section>
        <Card title="Line items">
          <DataTable
            columnContentTypes={['text', 'numeric', 'text', 'text']}
            headings={['Title', 'Qty', 'Price', 'Image']}
            rows={rows}
          />
        </Card>
      </Modal.Section>
    </Modal>
  );
}

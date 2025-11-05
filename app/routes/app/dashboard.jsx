// app/routes/app.dashboard.jsx
import React from 'react';
import Dashboard from '../components/Dashboard.jsx'; // relative from app/routes
import { authenticate } from '../shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AppDashboardRoute() {
  return <Dashboard />;
}

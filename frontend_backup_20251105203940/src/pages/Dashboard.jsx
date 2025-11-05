// app/components/Dashboard.jsx
import React from "react";
import * as PolarisPkg from "@shopify/polaris";
const { Page, Layout, Card, Text, Stack, Spinner } = PolarisPkg;

export default function Dashboard() {
  return (
    <Page title="Orders Dashboard">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical>
              <Text as="h2" variant="headingMd">
                Orders in last 60 days
              </Text>
              <Text>
                This section will show your Shopify store’s orders synced from
                the backend MongoDB/PostgreSQL database.
              </Text>
              <Spinner accessibilityLabel="Loading" size="large" />
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

import { Table } from '@team-portal/ui';
export default function AdminHome() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <Table
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'name', header: '名称' },
        ]}
        data={[{ id: '1', name: '租户A' }]}
      />
    </main>
  );
}

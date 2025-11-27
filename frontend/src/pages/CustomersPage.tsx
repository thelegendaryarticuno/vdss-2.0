import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi, Customer } from '../api/customerApi';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCustomers({ page, limit: 10, search });
      if (response.success) {
        setCustomers(response.data || []);
        setPagination(response.pagination || { total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'city', header: 'City' },
    { key: 'region', header: 'Region' },
    { key: 'segment', header: 'Segment' },
  ];

  const formattedCustomers = customers.map((c) => ({
    ...c,
    code: c.code || '-',
    email: c.email || '-',
    city: c.city || '-',
    region: c.region || '-',
    segment: c.segment || '-',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <Table columns={columns} data={formattedCustomers} onRowClick={handleRowClick} />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {customers.length} of {pagination.total} customers
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

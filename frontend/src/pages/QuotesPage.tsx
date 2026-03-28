import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteApi, Quote } from '../api/quoteApi';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';

export const QuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotes();
  }, [page]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quoteApi.getQuotes({ page, limit: 10 });
      if (response.success) {
        setQuotes(response.data || []);
        setPagination(response.pagination || { total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (quote: Quote) => {
    // Could navigate to quote detail page if needed
    console.log('Quote clicked:', quote);
  };

  const columns = [
    { key: 'quoteNumber', header: 'Quote Number' },
    { key: 'customerName', header: 'Customer' },
    { key: 'status', header: 'Status' },
    { key: 'total', header: 'Total' },
    { key: 'createdAt', header: 'Created' },
  ];

  const formattedQuotes = quotes.map((q) => ({
    ...q,
    customerName: q.customer?.name || '-',
    total: `$${q.total?.toFixed(2) || '0.00'}`,
    createdAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button onClick={() => navigate('/quotes/new')}>New Quote</Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <Table columns={columns} data={formattedQuotes} onRowClick={handleRowClick} />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {quotes.length} of {pagination.total} quotes
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

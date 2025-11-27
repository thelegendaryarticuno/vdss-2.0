import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteApi, QuoteItem } from '../api/quoteApi';
import { customerApi, Customer } from '../api/customerApi';
import { productApi, Product } from '../api/productApi';
import { aiApi } from '../api/aiApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const NewQuotePage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<Array<QuoteItem & { id: string; product?: Product }>>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadRecommendations();
    }
  }, [selectedCustomerId]);

  const loadCustomers = async () => {
    try {
      const response = await customerApi.getCustomers({ limit: 100 });
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productApi.getProducts({ limit: 100, isActive: true });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await aiApi.getProductRecommendations({ customerId: selectedCustomerId });
      if (response.success) {
        setRecommendations(response.data);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const addItem = (productId?: string) => {
    const product = productId
      ? products.find((p) => p.id === productId)
      : undefined;

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productId: product?.id || '',
        quantity: 1,
        unitPrice: product?.unitPrice || 0,
        discountPercent: 0,
        product,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'productId') {
            const product = products.find((p) => p.id === value);
            updated.product = product;
            updated.unitPrice = product?.unitPrice || 0;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addRecommendedProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product && !items.find((i) => i.productId === productId)) {
      addItem(productId);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const discountMultiplier = 1 - (item.discountPercent || 0) / 100;
      return sum + item.quantity * item.unitPrice * discountMultiplier;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    try {
      setLoading(true);
      const response = await quoteApi.createQuote({
        customerId: selectedCustomerId,
        items: items.map(({ id, product, ...item }) => item),
      });

      if (response.success) {
        navigate('/quotes');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/quotes')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">New Quote</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Quote Details">
              <Select
                label="Customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={[
                  { value: '', label: 'Select a customer...' },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                required
              />
            </Card>

            <Card title="Items">
              {items.map((item) => (
                <div key={item.id} className="border rounded p-4 mb-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Select
                      value={item.productId}
                      onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                      options={[
                        { value: '', label: 'Select product...' },
                        ...products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` })),
                      ]}
                    />
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                      min="1"
                    />
                    <Input
                      type="number"
                      label="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        label="Discount %"
                        value={item.discountPercent}
                        onChange={(e) => updateItem(item.id, 'discountPercent', parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <Button variant="danger" onClick={() => removeItem(item.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Line Total: $
                    {(
                      item.quantity *
                      item.unitPrice *
                      (1 - (item.discountPercent || 0) / 100)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={() => addItem()} className="w-full">
                Add Item
              </Button>
            </Card>

            <Card>
              <div className="text-right">
                <p className="text-2xl font-bold">Total: ${calculateTotal().toFixed(2)}</p>
              </div>
            </Card>

            <Button type="submit" isLoading={loading} className="w-full">
              Create Quote
            </Button>
          </div>

          <div>
            {recommendations.length > 0 && (
              <Card title="Recommended Products">
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <div key={rec.productId} className="border rounded p-2">
                      <p className="font-medium">{rec.name}</p>
                      <p className="text-sm text-gray-600">{rec.sku} - ${rec.unitPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                      <Button
                        variant="secondary"
                        onClick={() => addRecommendedProduct(rec.productId)}
                        className="w-full mt-2"
                      >
                        Add to Quote
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

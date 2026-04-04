import React from 'react';
import { useParams } from 'react-router-dom';
import { useTrackOrder } from '../hooks/useTrackOrder';
import { OrderDetail } from '../components/OrderDetail';
import { OrderTracker } from '../components/OrderTracker';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { order, loading } = useTrackOrder(id);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <OrderDetail order={order} loading={loading} />
        <OrderTracker order={order} />
      </div>
    </div>
  );
};

export default OrderDetailPage;
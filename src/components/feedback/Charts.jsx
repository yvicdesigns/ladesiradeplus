import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

export const RatingDistributionChart = ({ data }) => {
  // data should be [{ rating: 1, count: 5 }, ...]
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="rating" tickLine={false} axisLine={false} />
        <Tooltip cursor={{fill: 'transparent'}} />
        <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const SatisfactionTrendChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const FeedbackCategoryChart = ({ data }) => {
  const COLORS = ['#3b82f6', '#FCD34D', '#f59e0b', '#ef4444', '#8b5cf6'];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
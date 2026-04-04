import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#FCD34D', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export const NotificationsByTypeChart = ({ data }) => {
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

export const NotificationsTrendChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const AlertsBySeverityChart = ({ data }) => {
  const severityColors = { info: '#3b82f6', warning: '#f59e0b', error: '#F59E0B', critical: '#ef4444' };
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
         <XAxis type="number" hide />
         <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
         <Tooltip />
         <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={severityColors[entry.name.toLowerCase()] || '#8884d8'} />
            ))}
         </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const AlertStatusChart = ({ data }) => {
  const statusColors = { active: '#ef4444', acknowledged: '#f59e0b', resolved: '#FCD34D' };
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value">
           {data.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={statusColors[entry.name.toLowerCase()] || '#8884d8'} />
           ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
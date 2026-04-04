import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const ActiveUsersChart = ({ data }) => (
  <Card>
    <CardHeader><CardTitle className="text-sm font-medium">Active Users (Last 30 Days)</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={d => d.split('-').slice(1).join('/')} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="active_users" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const PlatformDistributionChart = ({ data }) => (
  <Card>
    <CardHeader><CardTitle className="text-sm font-medium">Platform Distribution</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === 'iOS' ? '#000000' : '#3DDC84'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const AppVersionsChart = ({ data }) => (
  <Card>
    <CardHeader><CardTitle className="text-sm font-medium">Users per Version</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" width={60} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="users" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const CrashesChart = ({ data }) => (
  <Card>
    <CardHeader><CardTitle className="text-sm font-medium">Crashes Trend</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={d => d.split('-').slice(1).join('/')} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="crashes" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const PushPerformanceChart = ({ data }) => (
  <Card>
    <CardHeader><CardTitle className="text-sm font-medium">Push Notification Performance</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} unit="%" />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Legend />
          <Bar dataKey="openRate" name="Open Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="clickRate" name="Click Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
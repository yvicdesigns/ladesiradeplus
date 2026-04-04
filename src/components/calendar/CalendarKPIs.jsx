import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Ban, Users, MapPin, Clock, Bell, BarChart2, CheckCircle } from 'lucide-react';

const KPI = ({ title, value, icon: Icon, color, subtext }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </CardContent>
    </Card>
);

export const CalendarKPIs = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      <KPI title="Events this Month" value={metrics.eventsThisMonth} icon={Calendar} color="text-blue-600" />
      <KPI title="Upcoming (7 Days)" value={metrics.upcomingEvents} icon={MapPin} color="text-purple-600" />
      <KPI title="Participants" value={metrics.totalParticipants} icon={Users} color="text-amber-600" />
      <KPI title="Completed Events" value={metrics.completedEvents} icon={CheckCircle} color="text-gray-600" />
      <KPI title="Closed Days" value={metrics.closedDays} icon={Ban} color="text-red-600" />
      <KPI title="Special Hours" value={metrics.specialHoursCount} icon={Clock} color="text-amber-600" />
      <KPI title="Reminders Pending" value={metrics.pendingReminders} icon={Bell} color="text-yellow-600" />
      <KPI title="Avg Participation" value={`${metrics.participationRate}%`} icon={BarChart2} color="text-cyan-600" />
    </div>
  );
};
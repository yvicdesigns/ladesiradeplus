import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Lock, Plus } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const CalendarGrid = ({ events, closures, specialHours, onDateClick, onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    return (
        <Card className="p-4 bg-white/50 backdrop-blur-sm shadow-xl border-none">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">{format(currentDate, "MMMM yyyy")}</h2>
                    <Button variant="outline" size="sm" onClick={goToToday} className="ml-4">Today</Button>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-sm font-semibold text-gray-500 py-2 uppercase tracking-wider">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                <AnimatePresence mode="popLayout">
                    {days.map((day, idx) => {
                        const dayEvents = events.filter(e => isSameDay(new Date(e.start_date), day));
                        const dayClosures = closures.filter(c => {
                             const start = new Date(c.start_date);
                             const end = new Date(c.end_date);
                             return day >= start && day <= end;
                        });
                        const daySpecial = specialHours.find(s => isSameDay(new Date(s.date), day));
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isCurrentDay = isToday(day);

                        return (
                            <motion.div
                                key={day.toString()}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: idx * 0.01 }}
                                onClick={() => onDateClick(day)}
                                className={`
                                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-blue-300 relative group
                                    ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}
                                    ${isCurrentDay ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'border-gray-100'}
                                    ${dayClosures.length > 0 ? 'bg-red-50/50' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isCurrentDay ? 'bg-blue-600 text-white' : ''}`}>{format(day, dateFormat)}</span>
                                    <div className="flex gap-1">
                                         {dayClosures.length > 0 && <Lock className="w-3 h-3 text-red-500" />}
                                         {daySpecial && <Clock className="w-3 h-3 text-amber-500" />}
                                    </div>
                                </div>
                                
                                <div className="mt-1 space-y-1">
                                    {dayEvents.slice(0, 3).map(e => (
                                        <div 
                                            key={e.id} 
                                            onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                                            className="text-xs truncate px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors border-l-2 border-blue-500"
                                        >
                                            {e.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-gray-400 font-medium pl-1">+{dayEvents.length - 3} more</div>
                                    )}
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-blue-100 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onDateClick(day); }}><Plus className="w-3 h-3" /></Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </Card>
    );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCalendar } from '@/hooks/useCalendar';
import { BusinessHoursTab, ClosuresTab } from '@/components/calendar/CalendarTabs';
import { Loader2 } from 'lucide-react';

export const AdminHoursTab = () => {
    const {
        businessHours, updateBusinessHours,
        closures, createClosure, updateClosure, deleteClosure,
        loadingEvents
    } = useCalendar();

    if (loadingEvents) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Horaires d'ouverture</CardTitle>
                    <CardDescription>Gérez les horaires d'ouverture de la semaine.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BusinessHoursTab hours={businessHours} updateHours={updateBusinessHours} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Fermetures exceptionnelles</CardTitle>
                    <CardDescription>Gérez les jours de fermeture (jours fériés, vacances, etc.).</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClosuresTab 
                        closures={closures} 
                        createClosure={createClosure} 
                        updateClosure={updateClosure} 
                        deleteClosure={deleteClosure} 
                    />
                </CardContent>
            </Card>
        </div>
    );
};
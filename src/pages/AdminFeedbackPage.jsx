import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useFeedback } from '@/hooks/useFeedback';
import { useFeedbackAnalytics } from '@/hooks/useFeedbackAnalytics';
import { SurveysTab } from '@/components/feedback/SurveysTab';
import { ReviewsTab } from '@/components/feedback/ReviewsTab';
import { FeedbackTab } from '@/components/feedback/FeedbackTab';
import { SurveyModal } from '@/components/feedback/SurveyModal';
import { ConfirmationDeleteModal } from '@/components/ConfirmationDeleteModal';
import { RatingDistributionChart, SatisfactionTrendChart, FeedbackCategoryChart } from '@/components/feedback/Charts';
import { MessageSquare, ThumbsUp, ThumbsDown, Star, Activity, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FeedbackKPI = ({ title, value, icon: Icon, color = "text-blue-600", subtext }) => (
  <Card className="rounded-xl overflow-hidden border-0 shadow-md bg-white">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AdminFeedbackPage = () => {
  const { 
    surveys, responses, feedbacks, reviews, categories,
    createSurvey, updateSurvey, deleteSurvey,
    updateReview, deleteReview,
    updateFeedback, deleteFeedback,
    isLoading, error
  } = useFeedback();

  const analytics = useFeedbackAnalytics(reviews, surveys, feedbacks, responses);
  const [activeTab, setActiveTab] = useState('overview');
  const [modals, setModals] = useState({
    createSurvey: false,
    deleteConfirm: null // { type, id }
  });

  const handleDelete = async () => {
    if (!modals.deleteConfirm) return;
    const { type, id } = modals.deleteConfirm;
    if (type === 'survey') await deleteSurvey(id);
    if (type === 'review') await deleteReview(id);
    if (type === 'feedback') await deleteFeedback(id);
    setModals(prev => ({ ...prev, deleteConfirm: null }));
  };

  // Mock data for charts
  const ratingDistData = [
    { rating: '5 ★', count: reviews?.filter(r => r.rating === 5).length || 0 },
    { rating: '4 ★', count: reviews?.filter(r => r.rating === 4).length || 0 },
    { rating: '3 ★', count: reviews?.filter(r => r.rating === 3).length || 0 },
    { rating: '2 ★', count: reviews?.filter(r => r.rating === 2).length || 0 },
    { rating: '1 ★', count: reviews?.filter(r => r.rating === 1).length || 0 },
  ];

  if (error) {
    return (
      <AdminLayout title="Retours Clients" subtitle="Gérez vos sondages, avis et retours.">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les retours : {error.message || "Une erreur inconnue s'est produite"}
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout title="Retours Clients" subtitle="Gérez vos sondages, avis et retours.">
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Retours Clients" subtitle="Gérez vos sondages, avis et retours clients.">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Centre des Retours</h1>
          <p className="text-muted-foreground mt-1">Gérez vos sondages, avis et retours clients en un seul endroit.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeedbackKPI title="Note Moyenne" value={analytics.averageRating} icon={Star} color="text-yellow-500" subtext={`${analytics.totalReviews} avis total`} />
          <FeedbackKPI title="Avis Positifs" value={`${analytics.positiveReviewsPercent}%`} icon={ThumbsUp} color="text-amber-600" />
          <FeedbackKPI title="Sondages Actifs" value={analytics.activeSurveysCount} icon={ClipboardList} color="text-indigo-600" />
          <FeedbackKPI title="Feedback En Attente" value={analytics.pendingFeedbackCount} icon={MessageSquare} color="text-amber-600" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent p-0 border-b rounded-none mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="surveys" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Sondages</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Avis Clients</TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="rounded-xl shadow-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Distribution des Notes</h3>
                    <RatingDistributionChart data={ratingDistData} />
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tendance Satisfaction</h3>
                    <SatisfactionTrendChart data={analytics.satisfactionTrend} />
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Catégories Feedback</h3>
                    <FeedbackCategoryChart data={analytics.feedbackByCategory} />
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="surveys">
            <SurveysTab 
              surveys={surveys} 
              onCreate={() => setModals({ ...modals, createSurvey: true })}
              onStatusChange={(id, status) => updateSurvey(id, { status })}
              onDelete={(id) => setModals({ ...modals, deleteConfirm: { type: 'survey', id } })}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab 
              reviews={reviews} 
              onApprove={(id) => updateReview(id, { status: 'approved' })}
              onReject={(id) => updateReview(id, { status: 'rejected' })}
              onDelete={(id) => setModals({ ...modals, deleteConfirm: { type: 'review', id } })}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab 
              feedbacks={feedbacks} 
              onResolve={(id) => updateFeedback(id, { status: 'resolved' })}
              onDelete={(id) => setModals({ ...modals, deleteConfirm: { type: 'feedback', id } })}
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <SurveyModal 
          open={modals.createSurvey} 
          onClose={() => setModals({ ...modals, createSurvey: false })}
          onSave={createSurvey}
        />
        <ConfirmationDeleteModal 
          open={!!modals.deleteConfirm} 
          onClose={() => setModals({ ...modals, deleteConfirm: null })}
          onConfirm={handleDelete}
          title="Confirmer la suppression"
          description="Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?"
        />
      </div>
    </AdminLayout>
  );
};

export default AdminFeedbackPage;
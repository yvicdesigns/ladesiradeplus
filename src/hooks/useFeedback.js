import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useFeedback = () => {
  const { toast } = useToast();

  const { data: surveys, loading: loadingSurveys, refetch: refetchSurveys, error: errorSurveys } = useRealtimeSubscription('surveys');
  const { data: responses, loading: loadingResponses, refetch: refetchResponses, error: errorResponses } = useRealtimeSubscription('survey_responses');
  const { data: feedbacks, loading: loadingFeedbacks, refetch: refetchFeedbacks, error: errorFeedbacks } = useRealtimeSubscription('customer_feedback', null, '*, customers(name, email), feedback_categories(name)');
  const { data: categories, loading: loadingCategories, refetch: refetchCategories, error: errorCategories } = useRealtimeSubscription('feedback_categories');
  const { data: reviews, loading: loadingReviews, refetch: refetchReviews, error: errorReviews } = useRealtimeSubscription('reviews');

  const genericAction = useCallback(async (action, successMessage) => {
    if (!supabase) {
      toast({ title: "Error", description: "Database connection not available", variant: "destructive" });
      return false;
    }
    try {
      await action();
      toast({ title: "Success", description: successMessage });
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Operation failed", variant: "destructive" });
      return false;
    }
  }, [toast]);

  // Surveys
  const createSurvey = async (surveyData, questions) => {
    return genericAction(async () => {
      const { data: survey, error: surveyError } = await supabase.from('surveys').insert([surveyData]).select().single();
      if (surveyError) throw surveyError;

      if (questions && questions.length > 0) {
        const questionsWithId = questions.map((q, idx) => ({ ...q, survey_id: survey.id, order: idx }));
        const { error: qError } = await supabase.from('survey_questions').insert(questionsWithId);
        if (qError) throw qError;
      }
    }, "Survey created successfully");
  };

  const updateSurvey = async (id, surveyData) => genericAction(() => supabase.from('surveys').update(surveyData).eq('id', id), "Survey updated");
  const deleteSurvey = async (id) => genericAction(() => supabase.from('surveys').delete().eq('id', id), "Survey deleted");

  // Feedback
  const updateFeedback = async (id, data) => genericAction(() => supabase.from('customer_feedback').update(data).eq('id', id), "Feedback updated");
  const deleteFeedback = async (id) => genericAction(() => supabase.from('customer_feedback').delete().eq('id', id), "Feedback deleted");

  // Reviews
  const updateReview = async (id, data) => genericAction(() => supabase.from('reviews').update(data).eq('id', id), "Review updated");
  const deleteReview = async (id) => genericAction(() => supabase.from('reviews').delete().eq('id', id), "Review deleted");

  // Categories
  const createCategory = async (data) => genericAction(() => supabase.from('feedback_categories').insert([data]), "Category created");
  const updateCategory = async (id, data) => genericAction(() => supabase.from('feedback_categories').update(data).eq('id', id), "Category updated");
  const deleteCategory = async (id) => genericAction(() => supabase.from('feedback_categories').delete().eq('id', id), "Category deleted");

  // Aggregate loading and error states
  const isLoading = loadingSurveys || loadingResponses || loadingFeedbacks || loadingCategories || loadingReviews;
  const error = errorSurveys || errorResponses || errorFeedbacks || errorCategories || errorReviews;

  return {
    surveys, loadingSurveys, createSurvey, updateSurvey, deleteSurvey,
    responses, loadingResponses,
    feedbacks, loadingFeedbacks, updateFeedback, deleteFeedback,
    categories, loadingCategories, createCategory, updateCategory, deleteCategory,
    reviews, loadingReviews, updateReview, deleteReview,
    isLoading, error
  };
};
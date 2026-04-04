import { useMemo } from 'react';

export const useFeedbackAnalytics = (reviews = [], surveys = [], feedbacks = [], responses = []) => {
  return useMemo(() => {
    // Review Metrics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews 
      : 0;

    const positiveReviews = reviews.filter(r => (r.rating || 0) >= 4).length;
    const negativeReviews = reviews.filter(r => (r.rating || 0) <= 2).length;
    const neutralReviews = reviews.filter(r => (r.rating || 0) === 3).length;

    const positivePercent = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;
    const negativePercent = totalReviews > 0 ? (negativeReviews / totalReviews) * 100 : 0;
    const neutralPercent = totalReviews > 0 ? (neutralReviews / totalReviews) * 100 : 0;

    const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;
    const approvedReviewsCount = reviews.filter(r => r.status === 'approved').length;
    const rejectedReviewsCount = reviews.filter(r => r.status === 'rejected').length;

    // Survey Metrics
    const activeSurveysCount = surveys.filter(s => s.status === 'active').length;
    // Mock response rate logic as we need distinct sent counts to be accurate, 
    // assuming response_count is stored on survey
    const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count || 0), 0);
    const averageResponseRate = 45; // Placeholder/Mock if we don't track 'sent'

    // NPS Calculation (Mock logic or requires specific survey type filtering)
    // Assuming we extract NPS from specific survey answers or feedback ratings
    const promoters = reviews.filter(r => (r.rating || 0) === 5).length;
    const detractors = reviews.filter(r => (r.rating || 0) <= 3).length;
    const npsScore = totalReviews > 0 ? ((promoters - detractors) / totalReviews) * 100 : 0;

    // Feedback Metrics
    const pendingFeedbackCount = feedbacks.filter(f => f.status === 'new' || f.status === 'in_review').length;
    
    // Category Breakdown
    const feedbackByCategory = feedbacks.reduce((acc, curr) => {
      const catName = curr.feedback_categories?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = 0;
      acc[catName]++;
      return acc;
    }, {});

    const satisfactionTrend = [
       { name: 'Week 1', score: 4.2 },
       { name: 'Week 2', score: 4.5 },
       { name: 'Week 3', score: 4.1 },
       { name: 'Week 4', score: 4.6 },
    ];

    return {
      averageRating: averageRating.toFixed(1),
      totalReviews,
      positiveReviewsPercent: Math.round(positivePercent),
      negativeReviewsPercent: Math.round(negativePercent),
      neutralReviewsPercent: Math.round(neutralPercent),
      activeSurveysCount,
      averageResponseRate,
      pendingFeedbackCount,
      npsScore: Math.round(npsScore),
      pendingReviewsCount,
      approvedReviewsCount,
      rejectedReviewsCount,
      feedbackByCategory: Object.entries(feedbackByCategory).map(([name, value]) => ({ name, value })),
      satisfactionTrend
    };
  }, [reviews, surveys, feedbacks, responses]);
};
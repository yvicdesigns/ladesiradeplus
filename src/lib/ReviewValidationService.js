import { RESTAURANT_ID } from '@/lib/adminSettingsUtils';
/**
 * Utility service for validating review data before database insertion.
 */

export const validateReviewData = (reviewData) => {
  const errors = [];
  const VALID_RESTAURANT_ID = "7eedf081-0268-4867-af38-61fa5932420a";

  // 1. Check restaurant_id presence and exact match
  if (!reviewData.restaurant_id) {
    errors.push("restaurant_id is missing");
  } else if (reviewData.restaurant_id !== VALID_RESTAURANT_ID) {
    errors.push(`restaurant_id must be strictly equal to ${VALID_RESTAURANT_ID}`);
  }

  // 2. Check required fields
  if (reviewData.rating === undefined || reviewData.rating === null) {
    errors.push("rating is required");
  } else if (isNaN(reviewData.rating) || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push("rating must be a number between 1 and 5");
  }

  if (!reviewData.content || reviewData.content.trim() === '') {
    errors.push("content is required and cannot be empty");
  }

  if (!reviewData.customer_name || reviewData.customer_name.trim() === '') {
    errors.push("customer_name is required");
  }

  // Check presence of fields (even if null/empty string) to satisfy strict schema requirements
  if (!('customer_email' in reviewData)) {
    errors.push("customer_email field must be present in the payload");
  }

  if (!('menu_item_id' in reviewData)) {
    errors.push("menu_item_id field must be present in the payload");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
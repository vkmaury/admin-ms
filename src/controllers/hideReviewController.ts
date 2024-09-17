import { Request, Response } from 'express';
import Review from '../models/reviewSchema';

export const hideReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.query;

    // Validate input
    if (!reviewId) {
      return res.status(400).json({ message: 'Review ID is required' });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Hide the review
    review.isVisible = false;
    await review.save();

    res.status(200).json({ message: 'Review hidden successfully' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

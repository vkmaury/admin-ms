import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation rules for creating a discount
export const createDiscountValidation = [
  body('code').isString().withMessage('Code must be a string'),
  body('percentage').isFloat({ min: 0, max: 100 }).withMessage('Percentage must be a number between 0 and 100'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('startDate').isISO8601().withMessage('Start date must be a valid ISO8601 date'),
  body('endDate').isISO8601().withMessage('End date must be a valid ISO8601 date'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for updating a discount
export const updateDiscountValidation = [
  param('id').isMongoId().withMessage('Invalid discount ID'),
  body('code').optional().isString().withMessage('Code must be a string'),
  body('percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Percentage must be a number between 0 and 100'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO8601 date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid ISO8601 date'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

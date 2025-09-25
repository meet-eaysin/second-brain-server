import { Request, Response } from 'express';
import {
  getFAQs,
  getFAQById,
  getGuides,
  getGuideById,
  searchHelp,
  submitContactRequest,
  getHelpCategories,
  incrementViewCount
} from '../services/help-center.service';
import { IContactRequest, IHelpSearchQuery } from '../types/help-center.types';
import { createAppError } from '@/utils/error.utils';

/**
 * Get all FAQs
 */
export const getFAQsController = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const faqs = await getFAQs(category as string);

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    throw createAppError('Failed to get FAQs', 500);
  }
};

/**
 * Get a specific FAQ by ID
 */
export const getFAQByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const faq = await getFAQById(id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Increment view count
    await incrementViewCount('faq', id);

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    throw createAppError('Failed to get FAQ', 500);
  }
};

/**
 * Get all guides
 */
export const getGuidesController = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const guides = await getGuides(category as string);

    res.json({
      success: true,
      data: guides
    });
  } catch (error) {
    throw createAppError('Failed to get guides', 500);
  }
};

/**
 * Get a specific guide by ID
 */
export const getGuideByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guide = await getGuideById(id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    // Increment view count
    await incrementViewCount('guide', id);

    res.json({
      success: true,
      data: guide
    });
  } catch (error) {
    throw createAppError('Failed to get guide', 500);
  }
};

/**
 * Search FAQs and guides
 */
export const searchHelpController = async (req: Request, res: Response) => {
  try {
    const searchQuery: IHelpSearchQuery = {
      query: (req.query.q as string) || '',
      category: req.query.category as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0
    };

    if (!searchQuery.query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await searchHelp(searchQuery);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    throw createAppError('Failed to search help', 500);
  }
};

/**
 * Submit a contact/support request
 */
export const submitContactRequestController = async (req: Request, res: Response) => {
  try {
    const contactRequest: IContactRequest = req.body;

    // Basic validation
    if (
      !contactRequest.name ||
      !contactRequest.email ||
      !contactRequest.subject ||
      !contactRequest.message
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const result = await submitContactRequest(contactRequest);

    res.json({
      success: true,
      data: result,
      message: 'Contact request submitted successfully'
    });
  } catch (error) {
    throw createAppError('Failed to submit contact request', 500);
  }
};

/**
 * Get help categories with counts
 */
export const getHelpCategoriesController = async (req: Request, res: Response) => {
  try {
    const categories = await getHelpCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    throw createAppError('Failed to get help categories', 500);
  }
};

/**
 * Get help center overview/stats
 */
export const getHelpOverviewController = async (req: Request, res: Response) => {
  try {
    const [faqs, guides, categories] = await Promise.all([
      getFAQs(),
      getGuides(),
      getHelpCategories()
    ]);

    const stats = {
      totalFAQs: faqs.length,
      totalGuides: guides.length,
      totalCategories: categories.length,
      popularTopics: categories.slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    throw createAppError('Failed to get help overview', 500);
  }
};

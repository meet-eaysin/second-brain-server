import {
  IFAQ,
  IGuide,
  IContactRequest,
  IHelpSearchQuery,
  IHelpSearchResult
} from '../types/help-center.types';

// Mock data for demonstration - in a real app, this would come from a database
const mockFAQs: IFAQ[] = [
  {
    id: '1',
    question: 'How do I create my first database?',
    answer:
      'To create your first database, navigate to the Databases section from the sidebar, click "New Database", choose your database type, and follow the setup wizard.',
    category: 'getting-started',
    tags: ['database', 'setup'],
    isPublished: true,
    viewCount: 1250,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    question: 'How do I invite team members to my workspace?',
    answer:
      'Go to Settings > Workspace, then use the "Invite Members" section to send invitations via email. Team members will receive an email with instructions to join.',
    category: 'account',
    tags: ['team', 'collaboration'],
    isPublished: true,
    viewCount: 890,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    question: 'Can I import data from other tools?',
    answer:
      'Yes! We support importing from various formats including CSV, JSON, and direct connections to popular tools like Notion, Airtable, and Google Sheets.',
    category: 'features',
    tags: ['import', 'migration'],
    isPublished: true,
    viewCount: 675,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

const mockGuides: IGuide[] = [
  {
    id: '1',
    title: 'Getting Started Guide',
    description: 'Complete walkthrough for new users',
    content: 'This guide covers everything you need to know to get started...',
    category: 'getting-started',
    readTime: '5 min read',
    difficulty: 'Beginner',
    isPublished: true,
    viewCount: 2100,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    title: 'Database Design Best Practices',
    description: 'Learn how to structure your data effectively',
    content: 'Effective database design is crucial for performance and maintainability...',
    category: 'features',
    readTime: '8 min read',
    difficulty: 'Intermediate',
    isPublished: true,
    viewCount: 1450,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  }
];

/**
 * Get all published FAQs
 */
export const getFAQs = async (category?: string): Promise<IFAQ[]> => {
  let faqs = mockFAQs.filter(faq => faq.isPublished);

  if (category && category !== 'all') {
    faqs = faqs.filter(faq => faq.category === category);
  }

  return faqs;
};

/**
 * Get a specific FAQ by ID
 */
export const getFAQById = async (id: string): Promise<IFAQ | null> => {
  const faq = mockFAQs.find(f => f.id === id && f.isPublished);
  return faq || null;
};

/**
 * Get all published guides
 */
export const getGuides = async (category?: string): Promise<IGuide[]> => {
  let guides = mockGuides.filter(guide => guide.isPublished);

  if (category && category !== 'all') {
    guides = guides.filter(guide => guide.category === category);
  }

  return guides;
};

/**
 * Get a specific guide by ID
 */
export const getGuideById = async (id: string): Promise<IGuide | null> => {
  const guide = mockGuides.find(g => g.id === id && g.isPublished);
  return guide || null;
};

/**
 * Search FAQs and guides
 */
export const searchHelp = async (query: IHelpSearchQuery): Promise<IHelpSearchResult> => {
  const { query: searchQuery, category, limit = 20, offset = 0 } = query;

  // Search FAQs
  let faqs = mockFAQs.filter(
    faq =>
      faq.isPublished &&
      (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Search guides
  let guides = mockGuides.filter(
    guide =>
      guide.isPublished &&
      (guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter by category if specified
  if (category && category !== 'all') {
    faqs = faqs.filter(faq => faq.category === category);
    guides = guides.filter(guide => guide.category === category);
  }

  // Apply pagination
  const allResults = [...faqs, ...guides];
  const paginatedResults = allResults.slice(offset, offset + limit);

  return {
    faqs: paginatedResults.filter(r => 'question' in r) as IFAQ[],
    guides: paginatedResults.filter(r => 'title' in r) as IGuide[],
    total: allResults.length
  };
};

/**
 * Submit a contact/support request
 */
export const submitContactRequest = async (
  request: IContactRequest
): Promise<{ success: boolean; ticketId?: string }> => {
  // In a real implementation, this would:
  // 1. Validate the request
  // 2. Create a support ticket in the database
  // 3. Send confirmation email
  // 4. Notify support team

  console.log('Contact request submitted:', request);

  // Simulate ticket creation
  const ticketId = `TICKET-${Date.now()}`;

  return {
    success: true,
    ticketId
  };
};

/**
 * Get help categories with counts
 */
export const getHelpCategories = async () => {
  const faqs = await getFAQs();
  const guides = await getGuides();

  const categoryCounts: Record<string, number> = {};

  // Count FAQs by category
  faqs.forEach(faq => {
    categoryCounts[faq.category] = (categoryCounts[faq.category] || 0) + 1;
  });

  // Count guides by category
  guides.forEach(guide => {
    categoryCounts[guide.category] = (categoryCounts[guide.category] || 0) + 1;
  });

  return Object.entries(categoryCounts).map(([id, count]) => ({
    id,
    name: id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    count
  }));
};

/**
 * Increment view count for FAQ or guide
 */
export const incrementViewCount = async (type: 'faq' | 'guide', id: string): Promise<void> => {
  if (type === 'faq') {
    const faq = mockFAQs.find(f => f.id === id);
    if (faq) {
      faq.viewCount += 1;
    }
  } else {
    const guide = mockGuides.find(g => g.id === id);
    if (guide) {
      guide.viewCount += 1;
    }
  }
};

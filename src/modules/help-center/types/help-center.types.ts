export interface IFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuide {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  readTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface IHelpSearchQuery {
  query: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface IHelpSearchResult {
  faqs: IFAQ[];
  guides: IGuide[];
  total: number;
}

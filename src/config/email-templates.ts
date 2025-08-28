import Handlebars from 'handlebars';
import { ENotificationType } from '@/modules/system/types/notifications.types';

// Email template interface
export interface IEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Template variables interface
export interface ITemplateVariables {
  userName?: string;
  userEmail?: string;
  taskName?: string;
  taskDueDate?: string;
  taskPriority?: string;
  projectName?: string;
  mentionedBy?: string;
  entityName?: string;
  entityType?: string;
  dueDate?: string;
  overdueDays?: number;
  workspaceName?: string;
  actionUrl?: string;
  unsubscribeUrl?: string;
  appName?: string;
  appUrl?: string;
  currentYear?: number;
  [key: string]: unknown;
}

// Base template layout
const BASE_LAYOUT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .alert { padding: 15px; border-radius: 6px; margin: 20px 0; }
        .alert-info { background-color: #d1ecf1; border-left: 4px solid #bee5eb; color: #0c5460; }
        .alert-warning { background-color: #fff3cd; border-left: 4px solid #ffeaa7; color: #856404; }
        .alert-danger { background-color: #f8d7da; border-left: 4px solid #f5c6cb; color: #721c24; }
        .task-details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .priority-high { color: #dc3545; font-weight: bold; }
        .priority-medium { color: #ffc107; font-weight: bold; }
        .priority-low { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{appName}}</h1>
            <p>Your Second Brain Notification</p>
        </div>
        <div class="content">
            {{{content}}}
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
            <p>
                <a href="{{appUrl}}">Visit App</a> | 
                <a href="{{unsubscribeUrl}}">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

// Email templates for each notification type
const EMAIL_TEMPLATES: Record<ENotificationType, IEmailTemplate> = {
  [ENotificationType.TASK_DUE]: {
    subject: '⏰ Task Due Soon: {{taskName}}',
    html: `
      <h2>Task Due Soon</h2>
      <div class="alert alert-warning">
        <strong>{{taskName}}</strong> is due soon!
      </div>
      <div class="task-details">
        <p><strong>Task:</strong> {{taskName}}</p>
        <p><strong>Due Date:</strong> {{taskDueDate}}</p>
        <p><strong>Priority:</strong> <span class="priority-{{taskPriority}}">{{taskPriority}}</span></p>
        {{#if projectName}}<p><strong>Project:</strong> {{projectName}}</p>{{/if}}
      </div>
      <p>Don't forget to complete this task before the deadline!</p>
      <a href="{{actionUrl}}" class="button">View Task</a>
    `,
    text: 'Task Due Soon: {{taskName}}\n\nDue Date: {{taskDueDate}}\nPriority: {{taskPriority}}\n{{#if projectName}}Project: {{projectName}}\n{{/if}}\nView Task: {{actionUrl}}'
  },

  [ENotificationType.TASK_OVERDUE]: {
    subject: '🚨 Overdue Task: {{taskName}}',
    html: `
      <h2>Task Overdue</h2>
      <div class="alert alert-danger">
        <strong>{{taskName}}</strong> is {{overdueDays}} day(s) overdue!
      </div>
      <div class="task-details">
        <p><strong>Task:</strong> {{taskName}}</p>
        <p><strong>Due Date:</strong> {{taskDueDate}}</p>
        <p><strong>Priority:</strong> <span class="priority-{{taskPriority}}">{{taskPriority}}</span></p>
        {{#if projectName}}<p><strong>Project:</strong> {{projectName}}</p>{{/if}}
        <p><strong>Overdue by:</strong> {{overdueDays}} day(s)</p>
      </div>
      <p>This task requires immediate attention. Please complete it as soon as possible.</p>
      <a href="{{actionUrl}}" class="button">Complete Task</a>
    `,
    text: 'Task Overdue: {{taskName}}\n\nDue Date: {{taskDueDate}}\nPriority: {{taskPriority}}\n{{#if projectName}}Project: {{projectName}}\n{{/if}}Overdue by: {{overdueDays}} day(s)\n\nComplete Task: {{actionUrl}}'
  },

  [ENotificationType.TASK_ASSIGNED]: {
    subject: '📋 New Task Assigned: {{taskName}}',
    html: `
      <h2>New Task Assigned</h2>
      <div class="alert alert-info">
        You have been assigned a new task: <strong>{{taskName}}</strong>
      </div>
      <div class="task-details">
        <p><strong>Task:</strong> {{taskName}}</p>
        {{#if taskDueDate}}<p><strong>Due Date:</strong> {{taskDueDate}}</p>{{/if}}
        <p><strong>Priority:</strong> <span class="priority-{{taskPriority}}">{{taskPriority}}</span></p>
        {{#if projectName}}<p><strong>Project:</strong> {{projectName}}</p>{{/if}}
      </div>
      <p>Please review the task details and start working on it.</p>
      <a href="{{actionUrl}}" class="button">View Task</a>
    `,
    text: 'New Task Assigned: {{taskName}}\n\n{{#if taskDueDate}}Due Date: {{taskDueDate}}\n{{/if}}Priority: {{taskPriority}}\n{{#if projectName}}Project: {{projectName}}\n{{/if}}\nView Task: {{actionUrl}}'
  },

  [ENotificationType.TASK_COMPLETED]: {
    subject: '✅ Task Completed: {{taskName}}',
    html: `
      <h2>Task Completed</h2>
      <div class="alert alert-info">
        Great job! <strong>{{taskName}}</strong> has been completed.
      </div>
      <div class="task-details">
        <p><strong>Task:</strong> {{taskName}}</p>
        {{#if projectName}}<p><strong>Project:</strong> {{projectName}}</p>{{/if}}
        <p><strong>Completed by:</strong> {{userName}}</p>
      </div>
      <p>Keep up the excellent work!</p>
      <a href="{{actionUrl}}" class="button">View Task</a>
    `,
    text: 'Task Completed: {{taskName}}\n\n{{#if projectName}}Project: {{projectName}}\n{{/if}}Completed by: {{userName}}\n\nView Task: {{actionUrl}}'
  },

  [ENotificationType.MENTION]: {
    subject: '💬 You were mentioned by {{mentionedBy}}',
    html: `
      <h2>You Were Mentioned</h2>
      <div class="alert alert-info">
        <strong>{{mentionedBy}}</strong> mentioned you in {{entityType}}: <strong>{{entityName}}</strong>
      </div>
      <p>Click below to see the context and respond if needed.</p>
      <a href="{{actionUrl}}" class="button">View Mention</a>
    `,
    text: 'You were mentioned by {{mentionedBy}} in {{entityType}}: {{entityName}}\n\nView Mention: {{actionUrl}}'
  },

  [ENotificationType.COMMENT]: {
    subject: '💬 New Comment on {{entityName}}',
    html: `
      <h2>New Comment</h2>
      <div class="alert alert-info">
        There's a new comment on <strong>{{entityName}}</strong>
      </div>
      <p>Click below to view the comment and respond if needed.</p>
      <a href="{{actionUrl}}" class="button">View Comment</a>
    `,
    text: 'New comment on {{entityName}}\n\nView Comment: {{actionUrl}}'
  },

  [ENotificationType.GOAL_DEADLINE]: {
    subject: '🎯 Goal Deadline Approaching: {{entityName}}',
    html: `
      <h2>Goal Deadline Approaching</h2>
      <div class="alert alert-warning">
        Your goal <strong>{{entityName}}</strong> deadline is approaching!
      </div>
      <p><strong>Deadline:</strong> {{dueDate}}</p>
      <p>Make sure you're on track to achieve your goal.</p>
      <a href="{{actionUrl}}" class="button">View Goal</a>
    `,
    text: 'Goal Deadline Approaching: {{entityName}}\n\nDeadline: {{dueDate}}\n\nView Goal: {{actionUrl}}'
  },

  [ENotificationType.HABIT_REMINDER]: {
    subject: '🔄 Habit Reminder: {{entityName}}',
    html: `
      <h2>Habit Reminder</h2>
      <div class="alert alert-info">
        Time for your habit: <strong>{{entityName}}</strong>
      </div>
      <p>Consistency is key to building strong habits. Don't break the chain!</p>
      <a href="{{actionUrl}}" class="button">Mark as Done</a>
    `,
    text: 'Habit Reminder: {{entityName}}\n\nMark as Done: {{actionUrl}}'
  },

  [ENotificationType.PROJECT_UPDATE]: {
    subject: '📊 Project Update: {{entityName}}',
    html: `
      <h2>Project Update</h2>
      <div class="alert alert-info">
        There's an update on project <strong>{{entityName}}</strong>
      </div>
      <p>Check out the latest changes and progress.</p>
      <a href="{{actionUrl}}" class="button">View Project</a>
    `,
    text: 'Project Update: {{entityName}}\n\nView Project: {{actionUrl}}'
  },

  [ENotificationType.FINANCE_BUDGET]: {
    subject: '💰 Budget Alert: {{entityName}}',
    html: `
      <h2>Budget Alert</h2>
      <div class="alert alert-warning">
        Budget alert for <strong>{{entityName}}</strong>
      </div>
      <p>Please review your budget and spending.</p>
      <a href="{{actionUrl}}" class="button">View Budget</a>
    `,
    text: 'Budget Alert: {{entityName}}\n\nView Budget: {{actionUrl}}'
  },

  [ENotificationType.SYSTEM_UPDATE]: {
    subject: '🔄 System Update Available',
    html: `
      <h2>System Update</h2>
      <div class="alert alert-info">
        A new system update is available with exciting features and improvements!
      </div>
      <p>Update now to get the latest features and security improvements.</p>
      <a href="{{actionUrl}}" class="button">Learn More</a>
    `,
    text: 'System Update Available\n\nLearn More: {{actionUrl}}'
  },

  [ENotificationType.COLLABORATION]: {
    subject: '🤝 Collaboration Invitation',
    html: `
      <h2>Collaboration Invitation</h2>
      <div class="alert alert-info">
        You've been invited to collaborate on <strong>{{entityName}}</strong>
      </div>
      <p>Join the collaboration and start working together!</p>
      <a href="{{actionUrl}}" class="button">Accept Invitation</a>
    `,
    text: 'Collaboration Invitation: {{entityName}}\n\nAccept Invitation: {{actionUrl}}'
  }
};

/**
 * Compile email template with variables
 */
export const compileEmailTemplate = (
  type: ENotificationType,
  variables: ITemplateVariables
): { subject: string; html: string; text: string } => {
  const template = EMAIL_TEMPLATES[type];

  if (!template) {
    throw new Error(`Email template not found for type: ${type}`);
  }

  // Add default variables
  const templateVars: ITemplateVariables = {
    appName: 'Second Brain',
    appUrl: process.env.APP_URL || 'https://app.secondbrain.com',
    currentYear: new Date().getFullYear(),
    unsubscribeUrl: `${process.env.APP_URL}/unsubscribe`,
    ...variables
  };

  // Compile templates
  const subjectTemplate = Handlebars.compile(template.subject);
  const htmlContentTemplate = Handlebars.compile(template.html);
  const textTemplate = Handlebars.compile(template.text);
  const layoutTemplate = Handlebars.compile(BASE_LAYOUT);

  const subject = subjectTemplate(templateVars);
  const htmlContent = htmlContentTemplate(templateVars);
  const text = textTemplate(templateVars);

  const html = layoutTemplate({
    ...templateVars,
    subject,
    content: htmlContent
  });

  return { subject, html, text };
};

/**
 * Register Handlebars helpers
 */
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('ne', (a, b) => a !== b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('lt', (a, b) => a < b);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('capitalize', (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
);
Handlebars.registerHelper('formatDate', (date: Date) =>
  date ? new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date)) : ''
);

/**
 * Get available email templates
 */
export const getAvailableTemplates = (): string[] => {
  return Object.keys(EMAIL_TEMPLATES);
};

/**
 * Validate template variables
 */
export const validateTemplateVariables = (
  type: ENotificationType,
  variables: ITemplateVariables
): { isValid: boolean; missingVariables: string[] } => {
  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    return { isValid: false, missingVariables: ['template'] };
  }

  const requiredVars: Record<ENotificationType, string[]> = {
    [ENotificationType.TASK_DUE]: ['taskName', 'taskDueDate'],
    [ENotificationType.TASK_OVERDUE]: ['taskName', 'taskDueDate', 'overdueDays'],
    [ENotificationType.TASK_ASSIGNED]: ['taskName'],
    [ENotificationType.TASK_COMPLETED]: ['taskName', 'userName'],
    [ENotificationType.MENTION]: ['mentionedBy', 'entityType', 'entityName'],
    [ENotificationType.COMMENT]: ['entityName'],
    [ENotificationType.GOAL_DEADLINE]: ['entityName', 'dueDate'],
    [ENotificationType.HABIT_REMINDER]: ['entityName'],
    [ENotificationType.PROJECT_UPDATE]: ['entityName'],
    [ENotificationType.FINANCE_BUDGET]: ['entityName'],
    [ENotificationType.SYSTEM_UPDATE]: [],
    [ENotificationType.COLLABORATION]: ['entityName']
  };

  const required = requiredVars[type] || [];
  const missing = required.filter(key => !variables[key]);

  return {
    isValid: missing.length === 0,
    missingVariables: missing
  };
};

export { EMAIL_TEMPLATES };

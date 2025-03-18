
// Mock service to simulate Zoho Desk API integration
// In a real implementation, this would make actual API calls to Zoho Desk

// Mock ticket data
const mockTickets = [
  {
    id: '12345',
    subject: 'Cannot access cloud storage',
    description: 'I am unable to access my cloud storage account. It shows an error message.',
    status: 'open',
    priority: 'high',
    category: 'Access Issues',
    createdTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    modifiedTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    department: 'IT Support',
    assignee: 'Sarah Johnson',
    comments: [
      {
        id: 'c1',
        content: 'We are looking into this issue. Could you please provide your account details?',
        createdBy: 'Sarah Johnson',
        createdTime: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        isPublic: true
      },
      {
        id: 'c2',
        content: 'I have sent my account details via email.',
        createdBy: 'John Doe',
        createdTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true
      }
    ],
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: '12346',
    subject: 'Request for new software installation',
    description: 'I need the Adobe Creative Suite installed on my workstation.',
    status: 'in-progress',
    priority: 'medium',
    category: 'Software Installation',
    createdTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    modifiedTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    department: 'IT Support',
    assignee: 'Mike Peters',
    comments: [
      {
        id: 'c3',
        content: 'We will need approval from your department head before proceeding.',
        createdBy: 'Mike Peters',
        createdTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true
      }
    ],
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: '12347',
    subject: 'Network connectivity issues',
    description: 'The internet connection in meeting room B is very slow.',
    status: 'resolved',
    priority: 'high',
    category: 'Network',
    createdTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    modifiedTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    resolutionTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    department: 'Network Operations',
    assignee: 'Robert Chen',
    comments: [
      {
        id: 'c4',
        content: 'We found an issue with the router. Our team will replace it today.',
        createdBy: 'Robert Chen',
        createdTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true
      },
      {
        id: 'c5',
        content: 'Router has been replaced and network is now functioning at optimal speed.',
        createdBy: 'Robert Chen',
        createdTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        isPublic: true
      }
    ],
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: '12348',
    subject: 'Email delivery delay',
    description: 'I am experiencing significant delays in receiving emails from external domains.',
    status: 'new',
    priority: 'medium',
    category: 'Email',
    createdTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    modifiedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    department: 'IT Support',
    assignee: null,
    comments: [],
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: '12349',
    subject: 'Password reset request',
    description: 'I need to reset my password for the CRM system.',
    status: 'closed',
    priority: 'low',
    category: 'Access Issues',
    createdTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    modifiedTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    resolutionTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    department: 'IT Support',
    assignee: 'Sarah Johnson',
    comments: [
      {
        id: 'c6',
        content: 'Your password has been reset. Please check your email for the temporary password.',
        createdBy: 'Sarah Johnson',
        createdTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true
      }
    ],
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  }
];

// Mock dashboard stats
const mockDashboardStats = {
  totalTickets: 15,
  openTickets: 5,
  resolvedTickets: 8,
  closedTickets: 2,
  avgResolutionTime: '28 hours',
  slaCompliance: '92%',
  ticketsByPriority: {
    low: 3,
    medium: 7,
    high: 4,
    urgent: 1
  },
  ticketsByCategory: {
    'Access Issues': 5,
    'Software Installation': 3,
    'Network': 2,
    'Hardware': 3,
    'Email': 2
  },
  recentActivity: [
    {
      id: 'act1',
      type: 'comment',
      ticketId: '12345',
      subject: 'Cannot access cloud storage',
      content: 'We are looking into this issue.',
      performedBy: 'Sarah Johnson',
      performedTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act2',
      type: 'status_change',
      ticketId: '12347',
      subject: 'Network connectivity issues',
      content: 'Status changed from In Progress to Resolved',
      performedBy: 'Robert Chen',
      performedTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'act3',
      type: 'new_ticket',
      ticketId: '12348',
      subject: 'Email delivery delay',
      content: 'New ticket created',
      performedBy: 'John Doe',
      performedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// Mock ticket categories
const mockCategories = [
  "Access Issues",
  "Software Installation",
  "Network",
  "Hardware",
  "Email",
  "Printer Issues",
  "VPN Connection",
  "Account Management",
  "Database",
  "Security"
];

// Mock service functions
export const zohoService = {
  // Authentication
  login: async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would validate credentials with Zoho
    if (email && password) {
      return {
        success: true,
        user: {
          id: 'usr123',
          name: 'John Doe',
          email: email,
          role: 'client'
        }
      };
    }
    throw new Error('Invalid credentials');
  },
  
  // Ticket operations
  getTickets: async (filters: any = {}) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let results = [...mockTickets];
    
    // Apply filters
    if (filters.status) {
      results = results.filter(ticket => ticket.status === filters.status);
    }
    
    if (filters.priority) {
      results = results.filter(ticket => ticket.priority === filters.priority);
    }
    
    if (filters.category) {
      results = results.filter(ticket => ticket.category === filters.category);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    if (filters.sortBy) {
      results.sort((a, b) => {
        if (filters.sortOrder === 'desc') {
          return a[filters.sortBy] > b[filters.sortBy] ? -1 : 1;
        }
        return a[filters.sortBy] > b[filters.sortBy] ? 1 : -1;
      });
    } else {
      // Default sort by modification time, newest first
      results.sort((a, b) => 
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      );
    }
    
    return {
      tickets: results,
      total: results.length
    };
  },
  
  getTicketById: async (id: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const ticket = mockTickets.find(t => t.id === id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    return ticket;
  },
  
  createTicket: async (ticketData: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Generate a new ticket with the provided data
    const newTicket = {
      id: `123${Math.floor(Math.random() * 1000)}`,
      subject: ticketData.subject,
      description: ticketData.description,
      status: 'new',
      priority: ticketData.priority || 'medium',
      category: ticketData.category,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      department: 'IT Support',
      assignee: null,
      comments: [],
      contact: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      }
    };
    
    // In a real implementation, this would create a ticket in Zoho
    return newTicket;
  },
  
  addComment: async (ticketId: string, commentData: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    const newComment = {
      id: `c${Math.floor(Math.random() * 1000)}`,
      content: commentData.content,
      createdBy: 'John Doe',
      createdTime: new Date().toISOString(),
      isPublic: true
    };
    
    ticket.comments.push(newComment);
    ticket.modifiedTime = new Date().toISOString();
    
    return newComment;
  },
  
  // Dashboard and reports
  getDashboardStats: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockDashboardStats;
  },
  
  // Categories
  getCategories: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockCategories;
  }
};

export default zohoService;

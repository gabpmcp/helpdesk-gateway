
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Book, 
  FileText, 
  ChevronRight,
  Folder,
  FolderOpen,
  MessageSquareText,
  LifeBuoy,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';

// Type definitions
interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  lastUpdated: string;
  views: number;
}

interface Category {
  id: string;
  name: string;
  articleCount: number;
  icon?: React.ReactNode;
}

const KnowledgeBase: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTab, setCurrentTab] = useState('all');

  useEffect(() => {
    const fetchKnowledgeBaseData = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would fetch data from the Zoho API
        // For now, we'll use mock data
        const categoriesData = await zohoService.getCategories();
        
        // Transform categories data to match our interface
        const formattedCategories: Category[] = categoriesData.map((name, index) => ({
          id: `cat-${index + 1}`,
          name,
          articleCount: Math.floor(Math.random() * 20) + 1,
          icon: getCategoryIcon(name)
        }));
        
        setCategories(formattedCategories);
        
        // Mock featured articles
        const mockArticles: Article[] = [
          {
            id: 'art-1',
            title: 'Getting Started with Your Support Portal',
            category: 'Getting Started',
            excerpt: 'Learn how to navigate and use the support portal effectively.',
            content: 'Full article content here...',
            lastUpdated: '2023-08-15',
            views: 1245
          },
          {
            id: 'art-2',
            title: 'How to Reset Your Password',
            category: 'Access Issues',
            excerpt: 'Step-by-step guide to reset your account password.',
            content: 'Full article content here...',
            lastUpdated: '2023-09-03',
            views: 987
          },
          {
            id: 'art-3',
            title: 'Troubleshooting Network Connectivity',
            category: 'Network',
            excerpt: 'Common solutions for network-related problems.',
            content: 'Full article content here...',
            lastUpdated: '2023-07-22',
            views: 756
          },
          {
            id: 'art-4',
            title: 'Setting Up Email Notifications',
            category: 'Email',
            excerpt: 'Configure your email notification preferences.',
            content: 'Full article content here...',
            lastUpdated: '2023-08-30',
            views: 543
          }
        ];
        
        setFeaturedArticles(mockArticles);
      } catch (error) {
        toast({
          title: "Error loading knowledge base",
          description: "Could not load knowledge base content. Please try again later.",
          variant: "destructive",
        });
        console.error("Knowledge base loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeBaseData();
  }, [toast]);

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Access Issues': <LifeBuoy size={20} />,
      'Software Installation': <FileText size={20} />,
      'Network': <FolderOpen size={20} />,
      'Hardware': <Folder size={20} />,
      'Email': <MessageSquareText size={20} />,
      'Printer Issues': <FileText size={20} />,
      'VPN Connection': <LifeBuoy size={20} />,
      'Account Management': <FileText size={20} />,
      'Database': <Folder size={20} />,
      'Security': <FileText size={20} />
    };
    
    return iconMap[category] || <HelpCircle size={20} />;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would trigger a search in the Zoho API
    toast({
      title: "Search initiated",
      description: `Searching for: ${searchQuery}`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Find answers to common questions and troubleshooting guides
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">How can we help you today?</h2>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search for articles, guides, and FAQs..." 
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit" 
                  className="absolute right-1 top-1 h-10"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Browse Knowledge Base</CardTitle>
              <CardDescription>
                Find information organized by categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Categories</TabsTrigger>
                  <TabsTrigger value="popular">Popular Articles</TabsTrigger>
                  <TabsTrigger value="recent">Recently Updated</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map((category) => (
                      <Button 
                        key={category.id} 
                        variant="outline" 
                        className="justify-between h-auto py-4 px-4"
                      >
                        <div className="flex items-center">
                          <div className="mr-3 text-primary">
                            {category.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.articleCount} articles
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="popular" className="space-y-4">
                  {featuredArticles
                    .sort((a, b) => b.views - a.views)
                    .map((article) => (
                      <div key={article.id} className="group">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-auto py-3 px-4 group-hover:bg-secondary"
                        >
                          <div className="flex items-start">
                            <Book className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                            <div className="text-left">
                              <div className="font-medium">{article.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-md">
                                {article.excerpt}
                              </div>
                              <div className="text-xs mt-1">
                                <span className="bg-secondary px-2 py-0.5 rounded">
                                  {article.category}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                  {article.views} views
                                </span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        <Separator className="mt-1" />
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="recent" className="space-y-4">
                  {featuredArticles
                    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                    .map((article) => (
                      <div key={article.id} className="group">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-auto py-3 px-4 group-hover:bg-secondary"
                        >
                          <div className="flex items-start">
                            <FileText className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                            <div className="text-left">
                              <div className="font-medium">{article.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-md">
                                {article.excerpt}
                              </div>
                              <div className="text-xs mt-1">
                                <span className="bg-secondary px-2 py-0.5 rounded">
                                  {article.category}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                  Updated: {article.lastUpdated}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        <Separator className="mt-1" />
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Featured Articles</CardTitle>
              <CardDescription>
                Most helpful resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredArticles.slice(0, 3).map((article) => (
                <div key={article.id} className="space-y-1">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-medium text-left"
                  >
                    {article.title}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <Separator className="mt-2" />
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                View All Articles
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Can't find what you're looking for?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => window.location.href = '/tickets/new'}>
                <MessageSquareText className="mr-2 h-4 w-4" />
                Create a Support Ticket
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/chat'}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Live Chat Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;

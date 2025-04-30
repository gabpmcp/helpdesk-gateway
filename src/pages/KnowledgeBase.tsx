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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKnowledgeBaseData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Obtener categorías reales de Zoho
        const categoriesData = await zohoService.getCategories();
        
        if (!categoriesData || !Array.isArray(categoriesData)) {
          throw new Error('No se recibieron datos de categorías válidos');
        }
        
        // Transform categories data to match our interface
        const formattedCategories: Category[] = categoriesData.map((category, index) => ({
          id: category.id || `cat-${index + 1}`,
          name: category.name,
          articleCount: category.articleCount || 0, // Usar dato real o 0 si no está disponible
          icon: getCategoryIcon(category.name)
        }));
        
        setCategories(formattedCategories);
        
        // Obtener artículos reales desde Zoho
        // Esto dependerá de la implementación real de la API
        // Por ahora, lanzaremos un error para que se propague correctamente
        // hasta que se implemente la función real
        
        // En una implementación completa, esto debería ser:
        // const articlesData = await zohoService.getKnowledgeArticles();
        throw new Error('Función de obtención de artículos no implementada');
        
      } catch (error) {
        console.error("Knowledge base loading error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMessage);
        
        // Propagar el error al usuario
        toast({
          title: "Error al cargar la base de conocimientos",
          description: errorMessage,
          variant: "destructive",
        });
        
        // No establecemos datos fallback/simulados
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
      'Network': <Folder size={20} />,
      'Hardware': <FolderOpen size={20} />,
      'Email': <MessageSquareText size={20} />,
      'General': <HelpCircle size={20} />
    };
    
    return iconMap[category] || <FileText size={20} />;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    toast({
      title: "Búsqueda no implementada",
      description: `La función de búsqueda para "${searchQuery}" no está implementada.`,
      variant: "destructive",
    });
  };

  return (
    <div className="container max-w-screen-xl mx-auto py-6 space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Find answers to common questions and learn how to use our platform effectively
        </p>
        
        <form onSubmit={handleSearch} className="max-w-md mx-auto mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for articles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="absolute right-1 top-1 h-8">
              Search
            </Button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading knowledge base...</span>
        </div>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 border-destructive">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Error al cargar la base de conocimientos</h2>
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Browse Articles</CardTitle>
                <Tabs defaultValue="all" onValueChange={setCurrentTab}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={currentTab}>
                  <TabsContent value="all" className="space-y-6">
                    {categories.length === 0 ? (
                      <div className="text-center py-6">
                        <p>No se encontraron categorías disponibles.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categories.map((category) => (
                          <Button
                            key={category.id}
                            variant="outline"
                            className="h-auto p-4 justify-start"
                          >
                            <div className="flex items-center w-full">
                              <div className="flex-shrink-0 mr-3">
                                {category.icon}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {category.articleCount} articles
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="recent" className="space-y-4">
                    {featuredArticles.length === 0 ? (
                      <div className="text-center py-6">
                        <p>No hay artículos recientes disponibles.</p>
                      </div>
                    ) : (
                      featuredArticles
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
                        ))
                    )}
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
                {featuredArticles.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No hay artículos destacados disponibles.</p>
                  </div>
                ) : (
                  featuredArticles.slice(0, 3).map((article) => (
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
                  ))
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  disabled={featuredArticles.length === 0}
                >
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
      )}
    </div>
  );
};

export default KnowledgeBase;

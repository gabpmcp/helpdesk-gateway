import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as FormLabel } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { ArrowLeft, Loader2, Paperclip } from 'lucide-react';
import zohoService from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { ZohoCategory, ZohoTicketInput } from '@/core/models/zoho.types';

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ZohoCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ticket, setTicket] = useState<ZohoTicketInput>({
    subject: '',
    description: '',
    priority: 'medium',
    category: '',
    status: 'new', 
    dueDate: '' 
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await zohoService.getCategories();
        console.log('Categorías obtenidas en CreateTicket:', categoriesData);
        
        // Filtrar categorías válidas
        const validCategories = categoriesData.filter(cat => cat && cat.id && cat.name);
        setCategories(validCategories);
        
        // Set the first category as default if available
        if (validCategories.length > 0) {
          const firstCategoryId = String(validCategories[0].id);
          console.log('Estableciendo categoría por defecto:', firstCategoryId, validCategories[0].name);
          setTicket(prev => ({ ...prev, category: firstCategoryId }));
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast({
          title: "Error loading categories",
          description: "Could not load ticket categories. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTicket(prev => ({ ...prev, [name]: value }));
  };

  // Function to handle select field changes
  const handleSelectChange = (field: string, value: string) => {
    // Convertir "_empty_" a cadena vacía si es necesario
    const normalizedValue = value === "_empty_" ? "" : value;
    
    setTicket({
      ...ticket,
      [field]: normalizedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket.subject.trim() || !ticket.description.trim() || !ticket.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const ticketInput: ZohoTicketInput = {
        ...ticket,
        dueDate: ticket.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const newTicket = await zohoService.createTicket(ticketInput);
      
      toast({
        title: "Ticket created",
        description: `Your ticket #${newTicket.id} has been created successfully.`,
      });
      
      navigate(`/tickets/${newTicket.id}`);
    } catch (error) {
      toast({
        title: "Error creating ticket",
        description: "Could not create your ticket. Please try again later.",
        variant: "destructive",
      });
      console.error("Ticket creation error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">Create New Ticket</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Request</CardTitle>
          <CardDescription>
            Provide details about your issue to help our support team assist you quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <FormLabel htmlFor="subject">Subject <span className="text-destructive">*</span></FormLabel>
              <Input 
                id="subject" 
                name="subject"
                placeholder="Brief summary of your issue" 
                value={ticket.subject}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormLabel htmlFor="category">Category <span className="text-destructive">*</span></FormLabel>
                {isLoading ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading categories...</span>
                  </div>
                ) : (
                  <Select 
                    value={ticket.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No categories available
                        </div>
                      ) : (
                        categories.map(category => (
                          <SafeSelectItem 
                            key={`category-${category.id}`} 
                            value={String(category.id)}
                          >
                            {category.name}
                          </SafeSelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="priority">Priority</FormLabel>
                <Select 
                  value={ticket.priority} 
                  onValueChange={(value) => handleSelectChange('priority', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SafeSelectItem key="empty" value="_empty_">Select Priority</SafeSelectItem>
                    <SafeSelectItem key="low" value="low">Low</SafeSelectItem>
                    <SafeSelectItem key="medium" value="medium">Medium</SafeSelectItem>
                    <SafeSelectItem key="high" value="high">High</SafeSelectItem>
                    <SafeSelectItem key="urgent" value="urgent">Urgent</SafeSelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="description">Description <span className="text-destructive">*</span></FormLabel>
              <Textarea 
                id="description" 
                name="description"
                placeholder="Provide as much detail as possible about your issue" 
                className="min-h-[200px]"
                value={ticket.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Button type="button" variant="outline" className="mr-2" disabled={isSubmitting}>
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
              <span className="text-sm text-muted-foreground">
                Attach screenshots or documents that might help explain the issue
              </span>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate('/tickets')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTicket;

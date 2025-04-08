import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { ArrowLeft, Loader2, Paperclip } from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { ZohoCategory, ZohoContact, ZohoAccount, ZohoTicketInput } from '@/core/models/zoho.types';
import { useDispatch } from 'react-redux';
import { createTicket } from '@/store/slices/zohoSlice';
import { AppDispatch } from '@/store/store';

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>(); // Mover aquí el hook
  const [categories, setCategories] = useState<ZohoCategory[]>([]);
  const [contacts, setContacts] = useState<ZohoContact[]>([]);
  const [accounts, setAccounts] = useState<ZohoAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [ticket, setTicket] = useState<ZohoTicketInput>({
    subject: '',
    description: '',
    priority: 'medium',
    category: '',
    departmentId: '',
    contactId: '',
    accountId: '',
    status: 'new', 
    dueDate: '' 
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await zohoService.getCategories();
        console.log('Departamentos obtenidos en CreateTicket:', categoriesData);
        
        // Filtrar categorías válidas
        const validCategories = categoriesData.filter(cat => cat && cat.id && cat.name);
        setCategories(validCategories);
        
        // Set the first category as default if available
        if (validCategories.length > 0) {
          const firstCategoryId = String(validCategories[0].id);
          console.log('Estableciendo departamento por defecto:', firstCategoryId, validCategories[0].name);
          setTicket(prev => ({ 
            ...prev, 
            category: firstCategoryId,
            departmentId: firstCategoryId // Aseguramos que departmentId también se establezca
          }));
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        toast({
          title: "Error loading departments",
          description: "Could not load ticket departments. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoadingContacts(true);
        const contactsData = await zohoService.getContacts();
        console.log('Contactos obtenidos en CreateTicket:', contactsData);
        
        // Filtrar contactos válidos
        const validContacts = contactsData.filter(contact => contact && contact.id && contact.name);
        setContacts(validContacts);
        
        // Set the first contact as default if available
        if (validContacts.length > 0) {
          const firstContactId = String(validContacts[0].id);
          console.log('Estableciendo contacto por defecto:', firstContactId, validContacts[0].name);
          setTicket(prev => ({ 
            ...prev, 
            contactId: firstContactId
          }));
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        toast({
          title: "Error loading contacts",
          description: "Could not load Zoho contacts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [toast]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const accountsData = await zohoService.getAccounts();
        console.log('Cuentas obtenidas en CreateTicket:', accountsData);
        
        // Filtrar cuentas válidas
        const validAccounts = accountsData.filter(account => account && account.id && account.name);
        setAccounts(validAccounts);
        
        // Set the first account as default if available
        if (validAccounts.length > 0) {
          const firstAccountId = String(validAccounts[0].id);
          console.log('Estableciendo cuenta por defecto:', firstAccountId, validAccounts[0].name);
          setTicket(prev => ({ 
            ...prev, 
            accountId: firstAccountId
          }));
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        toast({
          title: "Error loading accounts",
          description: "Could not load Zoho accounts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    // Convertir "_empty_" a cadena vacía si es necesario
    const normalizedValue = value === "_empty_" ? "" : value;
    
    setTicket({
      ...ticket,
      [field]: normalizedValue
    });
  };

  const handleCategoryChange = (value: string) => {
    console.log('Categoría seleccionada:', value);
    // Cuando cambia la categoría, también actualizamos el departmentId
    setTicket(prev => ({ 
      ...prev, 
      category: value,
      departmentId: value // El ID de la categoría es también el departmentId 
    }));
  };

  const handleContactChange = (value: string) => {
    console.log('Contacto seleccionado:', value);
    setTicket(prev => ({ 
      ...prev, 
      contactId: value
    }));
  };

  const handleAccountChange = (value: string) => {
    console.log('Cuenta seleccionada:', value);
    setTicket(prev => ({ 
      ...prev, 
      accountId: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket.subject.trim() || !ticket.description.trim() || !ticket.category || !ticket.contactId || !ticket.accountId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validar que los campos requeridos estén presentes
      if (!ticket.subject) {
        throw new Error("El asunto del ticket es obligatorio");
      }
      
      // Asegurar que departmentId tiene un valor válido
      if (!ticket.departmentId && ticket.category) {
        ticket.departmentId = ticket.category; // En caso de que no se haya asignado
      }
      
      // Asegurar que contactId está presente
      if (!ticket.contactId) {
        throw new Error("Es necesario seleccionar un contacto");
      }

      // Asegurar que accountId está presente
      if (!ticket.accountId) {
        throw new Error("Es necesario seleccionar una cuenta");
      }
      
      const ticketInput: ZohoTicketInput = {
        ...ticket,
        dueDate: ticket.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      console.log("Enviando solicitud de creación de ticket:", ticketInput);
      
      // Usar el dispatch ya inicializado en el nivel superior
      const result = await dispatch(createTicket(ticketInput)).unwrap();
      
      // Verificar que el ticket se haya creado correctamente
      if (!result || !result.id) {
        throw new Error("No se pudo obtener la información del ticket creado");
      }
      
      console.log("Ticket creado exitosamente:", result);
      
      toast({
        title: "Ticket creado",
        description: `Tu ticket #${result.ticketNumber || result.id} ha sido creado exitosamente.`,
        variant: "default",
      });
      
      // Redirigir al detalle del ticket recién creado
      navigate(`/tickets/${result.id}`);
    } catch (error: any) {
      // Manejo detallado de errores
      const errorMessage = error?.message || "No se pudo crear tu ticket. Por favor intenta más tarde.";
      
      console.error("Error al crear el ticket:", error);
      
      toast({
        title: "Error al crear ticket",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
      
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
              <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
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

            <div className="grid gap-6 md:grid-cols-2">
              {/* Category selector */}
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                <div>
                  {isLoading ? (
                    <div className="flex items-center space-x-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading categories...</span>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      No categories available
                    </div>
                  ) : (
                    <Select 
                      value={ticket.category} 
                      onValueChange={(value) => handleCategoryChange(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SafeSelectItem 
                            key={category.id} 
                            value={category.id}
                          >
                            {category.name}
                          </SafeSelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Contact selector */}
              <div className="space-y-2">
                <Label htmlFor="contact">Contact <span className="text-destructive">*</span></Label>
                <div>
                  {isLoadingContacts ? (
                    <div className="flex items-center space-x-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading contacts...</span>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      No contacts available
                    </div>
                  ) : (
                    <Select 
                      value={ticket.contactId} 
                      onValueChange={(value) => handleContactChange(value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="contact" className="w-full">
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map(contact => (
                          <SafeSelectItem 
                            key={contact.id} 
                            value={contact.id}
                          >
                            {contact.name} {contact.email ? `(${contact.email})` : ''}
                          </SafeSelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* Account selector */}
            <div className="space-y-2">
              <Label htmlFor="account">Account <span className="text-destructive">*</span></Label>
              <div>
                {isLoadingAccounts ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading accounts...</span>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    No accounts available
                  </div>
                ) : (
                  <Select 
                    value={ticket.accountId} 
                    onValueChange={(value) => handleAccountChange(value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="account" className="w-full">
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SafeSelectItem 
                          key={account.id} 
                          value={account.id}
                        >
                          {account.name} {account.domain ? `(${account.domain})` : ''}
                        </SafeSelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
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
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
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

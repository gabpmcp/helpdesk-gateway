
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Ticket, MessageSquare, User, Settings, LogOut, 
  HelpCircle, Search, PieChart
} from 'lucide-react';
import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, 
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, 
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const AppSidebar: React.FC = () => {
  const { toast } = useToast();

  const handleLogout = () => {
    // Will implement actual logout functionality later
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-5">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-helpdesk-700 flex items-center justify-center">
            <span className="text-white font-bold">HD</span>
          </div>
          <span className="text-lg font-bold">Helpdesk Portal</span>
        </div>
        <SidebarTrigger className="absolute right-2 top-5 lg:hidden" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" 
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/tickets"
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <Ticket className="h-5 w-5" />
                    <span>Tickets</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/chat"
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Live Chat</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/knowledge-base"
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <Search className="h-5 w-5" />
                    <span>Knowledge Base</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/profile"
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/analytics"
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <PieChart className="h-5 w-5" />
                    <span>Analytics</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings"
                    className={({isActive}) => isActive ? "text-helpdesk-700 font-medium" : ""}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="px-4 py-3">
        <div className="flex flex-col gap-3">
          <NavLink to="/support" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-4 w-4 mr-2" />
            <span>Help & Support</span>
          </NavLink>
          
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

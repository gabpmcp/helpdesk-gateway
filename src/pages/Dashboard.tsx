import React, { useEffect } from 'react';
import { Map, List, fromJS } from 'immutable';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, AlertCircle, CheckCircle, Clock, Inbox, Plus, RefreshCw, Loader2,
  ThumbsUp, Clock8
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAppDispatch, useAppSelector } from '@/store';

// Importamos los selectores y thunks del nuevo dashboardSlice
import { 
  fetchDashboard,
  selectDashboardStats,
  selectDashboardLoading,
  selectDashboardError,
  selectTicketCount,
  selectOpenTicketCount,
  selectUrgentTicketCount,
  selectResponseTimeAvg,
  selectSatisfactionScore,
  selectTicketsByPriorityData,
  selectTicketsByStatusData
} from '@/store/slices/dashboardSlice';

import { ImmutableDashboardStats } from '@/core/models/zoho.types';

// Define types for immutable structures
type ImmutableActivity = Map<string, any>;

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Use properly typed selectors from our new dashboardSlice
  const stats = useAppSelector(selectDashboardStats);
  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  
  // Use derived selectors for specific data
  const ticketCount = useAppSelector(selectTicketCount);
  const openTicketCount = useAppSelector(selectOpenTicketCount);
  const urgentTicketCount = useAppSelector(selectUrgentTicketCount);
  const responseTimeAvg = useAppSelector(selectResponseTimeAvg);
  const satisfactionScore = useAppSelector(selectSatisfactionScore);
  
  // Get chart data using selectors
  const ticketsByPriorityData = useAppSelector(selectTicketsByPriorityData) || [];
  const ticketsByStatusData = useAppSelector(selectTicketsByStatusData) || [];
  
  const { toast } = useToast();

  // Fetch dashboard stats on component mount using our new thunk
  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading dashboard data',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Handle refresh button click with the new thunk
  const handleRefresh = () => {
    dispatch(fetchDashboard());
  };

  // Colors for priority pie chart
  const PRIORITY_COLORS = {
    'Low': '#10B981',
    'Medium': '#F59E0B',
    'High': '#EF4444',
    'Urgent': '#7C3AED'
  };

  // Get color for priority
  const getPriorityColor = (priority: unknown) => {
    const priorityStr = String(priority);
    return PRIORITY_COLORS[priorityStr as keyof typeof PRIORITY_COLORS] || '#CBD5E1';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Inbox className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{ticketCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{openTicketCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{urgentTicketCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock8 className="mr-2 h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{responseTimeAvg} min</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Satisfaction Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ThumbsUp className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{satisfactionScore}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tickets by Priority */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ticketsByPriorityData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketsByPriorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {ticketsByPriorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getPriorityColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No priority data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets by Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ticketsByStatusData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticketsByStatusData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

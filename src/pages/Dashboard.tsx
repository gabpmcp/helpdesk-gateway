import React, { useEffect } from 'react';
import { Map, List } from 'immutable';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, AlertCircle, CheckCircle, Clock, Inbox, Plus, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchDashboardStats } from '@/store/slices/dashboardSlice';
import { configuredFetchDashboardStats } from '@/shell/config/services.config';
import { ImmutableDashboardStats } from '@/core/models/zoho.types';

// Define types for immutable structures
type ImmutableActivity = Map<string, any>;

// Define the expected dashboard state shape
interface DashboardReduxState {
  dashboard: {
    stats: ImmutableDashboardStats | null;
    loading: boolean;
    error: string | null;
  }
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Use type assertions to handle the Redux state
  const stats = useAppSelector((state: any) => state.dashboard.stats);
  const loading = useAppSelector((state: any) => state.dashboard.loading);
  const error = useAppSelector((state: any) => state.dashboard.error);
  
  const { toast } = useToast();

  useEffect(() => {
    // Dispatch the async thunk with the configured service function
    dispatch(fetchDashboardStats(configuredFetchDashboardStats))
      .unwrap()
      .catch(error => {
        toast({
          title: "Error loading dashboard",
          description: "Could not load dashboard data. Please try again later.",
          variant: "destructive",
        });
        console.error("Dashboard data error:", error);
      });
  }, [dispatch, toast]);

  // Pure function to format data for priority pie chart
  const getPriorityChartData = (statsData: ImmutableDashboardStats | null): List<Map<string, any>> => {
    if (!statsData) return List();
    
    const ticketsByPriority = statsData.get('ticketsByPriority', Map<string, number>());
    return ticketsByPriority.entrySeq()
      .map(([name, value]) => Map({ name, value }))
      .toList();
  };

  const PRIORITY_COLORS = List(['#3B82F6', '#F59E0B', '#F97316', '#EF4444']);

  // Pure function to format data for category bar chart
  const getCategoryChartData = (statsData: ImmutableDashboardStats | null): List<Map<string, any>> => {
    if (!statsData) return List();
    
    const ticketsByCategory = statsData.get('ticketsByCategory', Map<string, number>());
    return ticketsByCategory.entrySeq()
      .map(([name, value]) => Map({ name, value }))
      .toList();
  };

  // Convert immutable data to format required by recharts
  const priorityChartData = getPriorityChartData(stats).toJS();
  const categoryChartData = getCategoryChartData(stats).toJS();

  const handleRefresh = () => {
    dispatch(fetchDashboardStats(configuredFetchDashboardStats));
  };

  // Helper function to safely get activity list
  const getActivityList = (): List<ImmutableActivity> => {
    if (!stats) return List<ImmutableActivity>();
    const activities = stats.getIn(['recentActivity'], List());
    return activities as List<ImmutableActivity>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your support requests.
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse-subtle">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Inbox className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{String(stats?.getIn(['totalTickets'], 0))}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <div className="text-2xl font-bold">{String(stats?.getIn(['openTickets'], 0))}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{String(stats?.getIn(['avgResolutionTime'], 'N/A'))}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">{String(stats?.getIn(['slaCompliance'], 'N/A'))}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PRIORITY_COLORS.get(index % PRIORITY_COLORS.size, '#8884d8')} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getActivityList().size > 0 ? (
                    getActivityList().map((activity: ImmutableActivity, index: number) => (
                      <div key={index} className="flex items-start">
                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium">{String(activity.get('description', ''))}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>{String(activity.get('time', ''))}</span>
                            <span className="mx-2">•</span>
                            <Badge variant="outline">{String(activity.get('type', ''))}</Badge>
                          </div>
                        </div>
                      </div>
                    )).toJS()
                  ) : (
                    <p className="text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

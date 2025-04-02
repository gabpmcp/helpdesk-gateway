import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Loader2,
  MessageSquareText
} from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Ticket status summary card
const StatusSummaryCard = ({ 
  title, 
  count, 
  icon, 
  trend, 
  trendValue 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  trend: 'up' | 'down' | 'none'; 
  trendValue?: string;
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{count}</h3>
            
            {trend !== 'none' && trendValue && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendValue} from last period
                </span>
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Analytics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState<any>(null);
  
  const fetchAnalyticsData = async (range = timeRange) => {
    try {
      setLoading(true);
      // getDashboardStats no acepta parámetros
      const dashboardStats = await zohoService.getDashboardStats();
      setStats(dashboardStats);
      
      // Si en el futuro queremos filtrar por rango, podemos hacerlo aquí
      console.log(`Would filter by range: ${range}`);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Function to handle time range change
  const handleTimeRangeChange = (range: string) => {
    // Convertir "_empty_" a cadena vacía si es necesario
    const normalizedRange = range === "_empty_" ? "" : range;
    setTimeRange(normalizedRange);
    // Fetch new data based on selected range
    fetchAnalyticsData(normalizedRange);
  };

  // Data for the charts
  const generateTicketsByPriorityData = () => {
    if (!stats?.ticketsByPriority) return [];
    
    return [
      { name: 'Low', value: stats.ticketsByPriority.low, color: '#22c55e' },
      { name: 'Medium', value: stats.ticketsByPriority.medium, color: '#eab308' },
      { name: 'High', value: stats.ticketsByPriority.high, color: '#f97316' },
      { name: 'Urgent', value: stats.ticketsByPriority.urgent, color: '#ef4444' }
    ];
  };
  
  const generateTicketsByCategoryData = () => {
    if (!stats?.ticketsByCategory) return [];
    
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#6366f1'];
    return Object.entries(stats.ticketsByCategory).map(([category, count], index) => ({
      name: category,
      value: count as number,
      color: colors[index % colors.length]
    }));
  };

  const generateMonthlyTicketsData = () => {
    return [
      { name: 'Jan', closed: 4, opened: 6 },
      { name: 'Feb', closed: 3, opened: 4 },
      { name: 'Mar', closed: 5, opened: 7 },
      { name: 'Apr', closed: 7, opened: 5 },
      { name: 'May', closed: 6, opened: 8 },
      { name: 'Jun', closed: 9, opened: 7 }
    ];
  };

  const generateSLAComplianceData = () => {
    return [
      { name: 'Week 1', compliance: 95 },
      { name: 'Week 2', compliance: 92 },
      { name: 'Week 3', compliance: 96 },
      { name: 'Week 4', compliance: 90 },
      { name: 'Week 5', compliance: 94 },
      { name: 'Week 6', compliance: 98 }
    ];
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Monitor support performance and ticket metrics
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select 
            value={timeRange} 
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SafeSelectItem value="week">Last 7 days</SafeSelectItem>
              <SafeSelectItem value="month">Last 30 days</SafeSelectItem>
              <SafeSelectItem value="quarter">Last 90 days</SafeSelectItem>
              <SafeSelectItem value="year">Last 12 months</SafeSelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusSummaryCard 
          title="Total Tickets" 
          count={stats?.totalTickets || 0}
          icon={<BarChart3 className="h-5 w-5 text-primary" />} 
          trend="up" 
          trendValue="12%"
        />
        <StatusSummaryCard 
          title="Open Tickets" 
          count={stats?.openTickets || 0}
          icon={<AlertCircle className="h-5 w-5 text-amber-500" />} 
          trend="down" 
          trendValue="5%"
        />
        <StatusSummaryCard 
          title="Resolved Tickets" 
          count={stats?.resolvedTickets || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} 
          trend="up" 
          trendValue="8%"
        />
        <StatusSummaryCard 
          title="Average Resolution Time" 
          count={0}
          icon={<Clock className="h-5 w-5 text-primary" />} 
          trend="none" 
          trendValue={stats?.avgResolutionTime}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
            <CardDescription>
              Distribution of tickets across different priority levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={generateTicketsByPriorityData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {generateTicketsByPriorityData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
            <CardDescription>
              Distribution of tickets across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateTicketsByCategoryData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Tickets">
                  {generateTicketsByCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Trends</CardTitle>
          <CardDescription>
            View historical trends of ticket creation and resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="volume">
            <TabsList>
              <TabsTrigger value="volume">Ticket Volume</TabsTrigger>
              <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
            </TabsList>
            <TabsContent value="volume" className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={generateMonthlyTicketsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opened" name="Tickets Opened" fill="#3b82f6" />
                  <Bar dataKey="closed" name="Tickets Closed" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="sla" className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <ReLineChart data={generateSLAComplianceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="compliance" 
                    name="SLA Compliance %" 
                    stroke="#8b5cf6" 
                    activeDot={{ r: 8 }} 
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest ticket updates and status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.map((activity: any, index: number) => (
                <div key={activity.id} className="flex items-start">
                  <div className="mr-4 mt-1">
                    {activity.type === 'comment' && (
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                        <MessageSquareText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    {activity.type === 'status_change' && (
                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    {activity.type === 'new_ticket' && (
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                        <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <p className="font-medium">
                        <span className="text-muted-foreground">#{activity.ticketId}:</span> {activity.subject}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.performedTime).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm mt-1">{activity.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {activity.performedBy}</p>
                    {index < (stats?.recentActivity?.length - 1) && <Separator className="mt-4" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">SLA Compliance</span>
                  <span className="text-sm font-medium">{stats?.slaCompliance}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: stats?.slaCompliance || '0%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">First Response Time</span>
                  <span className="text-sm font-medium">2.5 hours</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Resolution Rate</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm font-medium">4.2/5</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: '84%' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="outline" className="w-full">
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

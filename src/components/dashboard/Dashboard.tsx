import React, { useEffect } from 'react';
import { List, Map as ImmutableMap } from 'immutable';
import { useHelpdeskApi } from '../../hooks/use-helpdesk-api';
import { ImmutableTicket } from '../../core/models/zoho.types';

interface DashboardProps {
  userEmail: string;
  userToken: string;
}

/**
 * Dashboard component that displays user's help desk statistics
 * using immutable data structures and declarative patterns
 */
export const Dashboard: React.FC<DashboardProps> = ({
  userEmail,
  userToken,
}) => {
  // Store token in localStorage with the correct key format
  useEffect(() => {
    if (userEmail && userToken) {
      localStorage.setItem(`token_${userEmail}`, userToken);
    }
  }, [userEmail, userToken]);

  // Initialize API hook with authentication (only pass email)
  const helpdesk = useHelpdeskApi(userEmail);
  
  // Fetch dashboard data using custom hook
  const { 
    data: dashboardData,
    isLoading, 
    error 
  } = helpdesk.useDashboard();

  console.log({dashboardData});
  
  // Safely access dashboard data with fallbacks
  const tickets = dashboardData?.tickets || List();
  const stats = dashboardData?.stats || ImmutableMap();
  
  // Calculate derived values from tickets and stats
  const ticketCount = React.useMemo(() => tickets.size, [tickets]);
  
  const openTicketCount = React.useMemo(() => 
    tickets.filter((ticket: ImmutableTicket) => 
      ticket.get('status') === 'Open' || ticket.get('status') === 'open'
    ).size, 
    [tickets]
  );
  
  const urgentTicketCount = React.useMemo(() => 
    tickets.filter((ticket: ImmutableTicket) => 
      ticket.get('priority') === 'Urgent' || ticket.get('priority') === 'urgent'
    ).size, 
    [tickets]
  );
  
  // Get metrics from stats with fallbacks
  const responseTimeAvg = stats.getIn(['metrics', 'responseTime'], 0);
  const satisfactionScore = stats.getIn(['metrics', 'satisfaction'], 0);
  
  // Calculate priority distribution as percentages with explicit typing
  const priorityDistribution = React.useMemo<ImmutableMap<string, number>>(() => {
    // Define initial map with known keys
    const initialDistribution = ImmutableMap<string, number>({
      Urgent: 0, High: 0, Medium: 0, Low: 0
    });
    
    if (tickets.size === 0) {
      return initialDistribution;
    }
    
    // Count tickets by priority
    const countsByPriority = tickets.reduce(
      (acc, ticket: ImmutableTicket) => {
        const priority = ticket.get('priority') as string || 'Low';
        return acc.update(priority, (count = 0) => count + 1);
      },
      initialDistribution
    );
    
    // Convert counts to percentages
    return countsByPriority.map(
      (count: number) => Math.round((count / tickets.size) * 100)
    );
  }, [tickets]);
  
  // Calculate recent activity
  const recentActivity = React.useMemo(() => 
    tickets
      .filter((ticket: ImmutableTicket) => {
        const updatedTimestamp = ticket.get('lastUpdatedTimestamp') as number || 0;
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return updatedTimestamp > oneDayAgo;
      })
      .sort((a: ImmutableTicket, b: ImmutableTicket) => 
        (b.get('lastUpdatedTimestamp') as number || 0) - (a.get('lastUpdatedTimestamp') as number || 0)
      )
      .take(5),
    [tickets]
  );
  
  // Render loading state
  if (isLoading) return <div>Loading dashboard...</div>;
  
  // Render error state
  if (error) return <div>Error loading dashboard: {error.message}</div>;
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Help Desk Dashboard</h1>
      </header>
      
      <section className="stats-overview">
        <div className="stat-card">
          <h3>Total Tickets</h3>
          <div className="stat-value">{ticketCount}</div>
        </div>
        <div className="stat-card">
          <h3>Open Tickets</h3>
          <div className="stat-value">{openTicketCount}</div>
          <div className="stat-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${ticketCount > 0 ? (openTicketCount / ticketCount) * 100 : 0}%` }} 
            />
          </div>
        </div>
        <div className="stat-card">
          <h3>Urgent Tickets</h3>
          <div className="stat-value">{urgentTicketCount}</div>
        </div>
        <div className="stat-card">
          <h3>Avg. Response Time</h3>
          <div className="stat-value">
            {responseTimeAvg ? `${responseTimeAvg} hrs` : 'N/A'}
          </div>
        </div>
        <div className="stat-card">
          <h3>Satisfaction</h3>
          <div className="stat-value">
            {satisfactionScore ? `${satisfactionScore}/5` : 'N/A'}
          </div>
        </div>
      </section>
      
      <section className="dashboard-content">
        <div className="left-column">
          <div className="priority-chart">
            <h2>Ticket Priorities</h2>
            <div className="chart">
              {/* Render bars for each priority */}
              {List(['Urgent', 'High', 'Medium', 'Low']).map(priority => (
                <div key={priority} className="chart-item">
                  <div className="chart-label">{priority}</div>
                  <div className="chart-bar-container">
                    <div 
                      className={`chart-bar priority-${priority.toLowerCase()}`}
                      style={{ width: `${priorityDistribution.get(priority, 0)}%` }}
                    />
                  </div>
                  <div className="chart-value">{priorityDistribution.get(priority, 0)}%</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="performance-metrics">
            <h2>Performance Metrics</h2>
            <div className="metrics-grid">
              {/* Map all metrics from stats */}
              {stats && stats.entrySeq().map(([key, value]) => (
                <div key={key} className="metric-item">
                  <div className="metric-name">{formatMetricName(key)}</div>
                  <div className="metric-value">{formatMetricValue(key, value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="right-column">
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            {recentActivity.size > 0 ? (
              <ul className="activity-list">
                {recentActivity.map((ticket: ImmutableTicket) => (
                  <li key={ticket.get('id') as string} className="activity-item">
                    <div className="activity-header">
                      <span className="activity-subject">{ticket.get('subject') as string}</span>
                      <span className={`activity-status status-${(ticket.get('status') as string || '').toLowerCase()}`}>
                        {ticket.get('status') as string}
                      </span>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-time">
                        {formatTimestamp(ticket.get('lastUpdatedTimestamp') as number)}
                      </span>
                      <span className={`activity-priority priority-${(ticket.get('priority') as string || '').toLowerCase()}`}>
                        {ticket.get('priority') as string}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-activity">No recent activity</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * Format a metric key into human-readable format
 */
const formatMetricName = (key: string): string => 
  key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/([A-Z][a-z])/g, ' $1') // Add space before camelCase transitions
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove extra spaces

/**
 * Format metric values based on their key/type
 */
const formatMetricValue = (key: string, value: any): string => {
  // Handle different metric types
  if (key.toLowerCase().includes('time')) {
    // Format time values
    return typeof value === 'number' ? `${value} hrs` : String(value || 'N/A');
  } else if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('rate')) {
    // Format percentage values
    return typeof value === 'number' ? `${value}%` : String(value || 'N/A');
  } else if (key.toLowerCase().includes('score') || key.toLowerCase().includes('rating')) {
    // Format rating values
    return typeof value === 'number' ? `${value}/5` : String(value || 'N/A');
  } else if (typeof value === 'boolean') {
    // Format boolean values
    return value ? 'Yes' : 'No';
  } else if (value === null || value === undefined) {
    // Handle missing values
    return 'N/A';
  }
  
  // Default formatting
  return String(value);
};

const formatTimestamp = (timestamp?: number): string => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  }
  
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) {
    return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ago`;
  }
  
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

export default Dashboard;

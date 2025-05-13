import { TrendingUp, Users, Building2, CheckSquare } from "lucide-react";
import { DashboardSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";

interface SummaryCardsProps {
  summary?: DashboardSummary;
}

function PercentChange({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <p className={`text-sm flex items-center ${isPositive ? 'text-success' : 'text-destructive'}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 mr-1 ${!isPositive && 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
      {Math.abs(value)}% from last {isPositive ? 'week' : 'month'}
    </p>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const [_, navigate] = useLocation();
  
  if (!summary) return null;
  
  // Funzioni di navigazione
  const goToDeals = () => navigate('/deals');
  const goToContacts = () => navigate('/contacts');
  const goToCompanies = () => navigate('/companies');
  const goToTasks = () => navigate('/tasks');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Open Deals */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToDeals}>
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-neutral-medium text-sm font-medium">Open Deals</h3>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-semibold">{summary.openDeals}</p>
              <PercentChange value={5} />
            </div>
            <span className="text-neutral-medium text-sm">{formatCurrency(summary.totalDealValue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Contacts */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToContacts}>
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-neutral-medium text-sm font-medium">Active Contacts</h3>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-secondary">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-semibold">{summary.activeContacts}</p>
              <PercentChange value={12} />
            </div>
            <span className="text-neutral-medium text-sm">28 new</span>
          </div>
        </CardContent>
      </Card>

      {/* Companies */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToCompanies}>
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-neutral-medium text-sm font-medium">Companies</h3>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-accent">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-semibold">{summary.totalCompanies}</p>
              <PercentChange value={3} />
            </div>
            <span className="text-neutral-medium text-sm">4 new</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToTasks}>
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-neutral-medium text-sm font-medium">Upcoming Tasks</h3>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-warning">
              <CheckSquare className="h-5 w-5" />
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-semibold">{summary.tasks?.upcomingCount || 0}</p>
              <p className="text-sm text-destructive flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                {summary.tasks?.overdueCount || 0} overdue
              </p>
            </div>
            <span className="text-neutral-medium text-sm">Today: 5</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

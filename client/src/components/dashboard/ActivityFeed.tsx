import { formatDistanceToNow } from "date-fns";
import { Activity } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  User, 
  TrendingUp, 
  Calendar, 
  CheckSquare,
  Building2
} from "lucide-react";

interface ActivityFeedProps {
  activities?: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "contact":
        return <User className="h-4 w-4" />;
      case "deal":
      case "deal_stage_change":
        return <TrendingUp className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "task":
      case "task_completed":
        return <CheckSquare className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-50 text-primary";
      case "contact":
        return "bg-purple-50 text-secondary";
      case "deal":
      case "deal_stage_change":
        return "bg-teal-50 text-accent";
      case "meeting":
        return "bg-amber-50 text-warning";
      case "task":
      case "task_completed":
        return "bg-red-50 text-destructive";
      case "company":
        return "bg-green-50 text-success";
      default:
        return "bg-blue-50 text-primary";
    }
  };

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* Activity Icon */}
              <div 
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconColor(activity.type)}`}
              >
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Activity Content */}
              <div className="flex-1">
                <p className="text-sm text-neutral-dark" dangerouslySetInnerHTML={{ __html: activity.description }} />
                <p className="text-xs text-neutral-medium mt-1">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

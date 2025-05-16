import { format } from "date-fns";
import { Meeting } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface UpcomingMeetingsProps {
  meetings?: Meeting[];
}

const getMeetingColor = (type: string) => {
  switch (type) {
    case "Call":
    case "Chiamata":
      return "border-primary";
    case "In-Person":
    case "Di Persona":
      return "border-secondary";
    case "Virtual":
    case "Virtuale":
      return "border-accent";
    default:
      return "border-primary";
  }
};

const getMeetingBadgeColor = (type: string) => {
  switch (type) {
    case "Call":
    case "Chiamata":
      return "bg-blue-100 text-primary";
    case "In-Person":
    case "Di Persona":
      return "bg-purple-100 text-secondary";
    case "Virtual":
    case "Virtuale":
      return "bg-teal-100 text-accent";
    default:
      return "bg-blue-100 text-primary";
  }
};

export default function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  if (!meetings) return null;

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Riunioni Imminenti</CardTitle>
          <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium">
            Vedi Calendario
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div 
              key={meeting.id} 
              className={`p-3 bg-neutral-lightest rounded-lg border-l-4 ${getMeetingColor(meeting.meetingType)}`}
            >
              <div className="flex justify-between mb-2">
                <h4 className="font-medium text-neutral-dark">{meeting.title}</h4>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${getMeetingBadgeColor(meeting.meetingType)}`}>
                  {meeting.meetingType}
                </span>
              </div>
              <p className="text-sm text-neutral-medium mb-2">{meeting.description}</p>
              <div className="flex items-center text-xs text-neutral-medium">
                <Clock className="h-4 w-4 mr-1" />
                {format(new Date(meeting.startTime), "PPp")} - {format(new Date(meeting.endTime), "p")}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

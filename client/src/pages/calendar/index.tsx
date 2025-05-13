import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { useMeetings } from "@/hooks/useMeetings";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import MeetingModal from "@/components/modals/MeetingModal";
import { Meeting } from "@/types";
import { cn, generateAvatarColor, getInitials } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ViewType = "month" | "week" | "day";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [showModal, setShowModal] = useState(false);
  const { meetings, isLoading } = useMeetings();
  const { contacts } = useContacts();
  const { companies } = useCompanies();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Get contact name from id
  const getContactName = (contactId: number | null): string => {
    if (!contactId) return "-";
    const contact = contacts?.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "-";
  };

  // Get company name from id
  const getCompanyName = (companyId: number | null): string => {
    if (!companyId) return "-";
    const company = companies?.find((c) => c.id === companyId);
    return company ? company.name : "-";
  };

  // Get contact initials from id
  const getContactInitials = (contactId: number | null): string => {
    if (!contactId) return "??";
    const contact = contacts?.find((c) => c.id === contactId);
    return contact ? getInitials(contact.firstName, contact.lastName) : "??";
  };

  // Generate week days for week view
  const generateWeekDays = () => {
    const startDay = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start from Monday
    const endDay = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = [];
    let day = startDay;

    while (day <= endDay) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Filter meetings for selected date
  const getMeetingsForDate = (date: Date) => {
    // Garantisco che meetings sia sempre un Array
    const meetingsList = Array.isArray(meetings) ? meetings : [];
    return meetingsList.filter(meeting => 
      isSameDay(parseISO(meeting.startTime), date)
    ).sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  };

  const handleAddMeeting = () => {
    setSelectedMeeting(null);
    setShowModal(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowModal(true);
  };

  // Get the background and text colors for meeting type
  const getMeetingTypeStyles = (type: string) => {
    switch (type) {
      case "Call":
        return "bg-blue-100 text-blue-800";
      case "In-Person":
        return "bg-purple-100 text-purple-800";
      case "Virtual":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Calendar</h1>
        <Button onClick={handleAddMeeting}>
          <Plus className="mr-2 h-4 w-4" /> Add Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar */}
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
              
              <div className="mt-4 space-y-2">
                <Select value={view} onValueChange={(v) => setView(v as ViewType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button className="w-full" onClick={handleAddMeeting}>
                  <Plus className="mr-2 h-4 w-4" /> Add Meeting
                </Button>
              </div>
              
              {isLoading ? (
                <div className="mt-6 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Upcoming Meetings</h3>
                  {Array.isArray(meetings) && meetings.length > 0 ? (
                    <div className="space-y-2">
                      {/* Garantisco che meetings sia sempre un Array */}
                      {(Array.isArray(meetings) ? meetings : [])
                        .filter(meeting => new Date(meeting.startTime) >= new Date())
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .slice(0, 3)
                        .map(meeting => (
                          <div 
                            key={meeting.id} 
                            className="text-sm p-2 border rounded-md cursor-pointer hover:bg-muted"
                            onClick={() => handleEditMeeting(meeting)}
                          >
                            <div className="font-medium truncate">{meeting.title}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(new Date(meeting.startTime), "MMM d, h:mm a")}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No upcoming meetings.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Main */}
        <div className="col-span-1 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (view === "day") {
                      setSelectedDate(addDays(selectedDate, -1));
                    } else if (view === "week") {
                      setSelectedDate(addDays(selectedDate, -7));
                    } else {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }
                  }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (view === "day") {
                      setSelectedDate(addDays(selectedDate, 1));
                    } else if (view === "week") {
                      setSelectedDate(addDays(selectedDate, 7));
                    } else {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }
                  }}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-lg font-semibold">
                {view === "day" && format(selectedDate, "MMMM d, yyyy")}
                {view === "week" && `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`}
                {view === "month" && format(selectedDate, "MMMM yyyy")}
              </div>
            </CardHeader>
            <CardContent>
              {view === "day" ? (
                <div className="space-y-2">
                  <div className="text-center p-2 bg-muted rounded-md">
                    <div className="font-medium">{format(selectedDate, "EEEE")}</div>
                    <div className="text-2xl font-bold">{format(selectedDate, "d")}</div>
                  </div>
                  {isLoading ? (
                    <div className="space-y-2 mt-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-4">
                      {getMeetingsForDate(selectedDate).length > 0 ? (
                        getMeetingsForDate(selectedDate).map(meeting => (
                          <div 
                            key={meeting.id} 
                            className="border rounded-md p-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleEditMeeting(meeting)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{meeting.title}</div>
                              <span className={cn("text-xs px-2 py-1 rounded", getMeetingTypeStyles(meeting.meetingType))}>
                                {meeting.meetingType}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <Clock className="h-4 w-4 mr-1" />
                              {format(new Date(meeting.startTime), "h:mm a")} - {format(new Date(meeting.endTime), "h:mm a")}
                            </div>
                            {meeting.location && (
                              <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                {meeting.location}
                              </div>
                            )}
                            <div className="flex items-center mt-2">
                              <Avatar className={cn("h-6 w-6", generateAvatarColor(meeting.contactId || 0))}>
                                <AvatarFallback className="text-xs">
                                  {getContactInitials(meeting.contactId)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-2 text-sm">
                                {getContactName(meeting.contactId)}
                                {meeting.companyId && (
                                  <span className="text-muted-foreground"> ({getCompanyName(meeting.companyId)})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No meetings scheduled for this day.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : view === "week" ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 gap-2">
                      {generateWeekDays().map((day, index) => (
                        <div key={index} className="text-center">
                          <div className={cn(
                            "p-2 rounded-md",
                            isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                          )}>
                            <div className="font-medium">{format(day, "EEE")}</div>
                            <div className="text-xl">{format(day, "d")}</div>
                          </div>
                          <div className="mt-2 space-y-1">
                            {isLoading ? (
                              <Skeleton className="h-16 w-full" />
                            ) : (
                              getMeetingsForDate(day).map(meeting => (
                                <div 
                                  key={meeting.id} 
                                  className={cn(
                                    "p-2 text-xs rounded border-l-4",
                                    meeting.meetingType === "Call" && "border-blue-500 bg-blue-50",
                                    meeting.meetingType === "In-Person" && "border-purple-500 bg-purple-50",
                                    meeting.meetingType === "Virtual" && "border-teal-500 bg-teal-50",
                                    "cursor-pointer hover:opacity-80"
                                  )}
                                  onClick={() => handleEditMeeting(meeting)}
                                >
                                  <div className="font-medium truncate">{meeting.title}</div>
                                  <div className="text-muted-foreground">
                                    {format(new Date(meeting.startTime), "h:mm a")}
                                  </div>
                                </div>
                              ))
                            )}
                            {!isLoading && getMeetingsForDate(day).length === 0 && (
                              <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">
                                No meetings
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Month view is coming soon. Please use Week or Day view.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MeetingModal
        open={showModal}
        onOpenChange={setShowModal}
        initialData={selectedMeeting}
      />
    </div>
  );
}

import { ArrowLeft, Bell, Calendar, Pin } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface NoticesProps {
  onBack: () => void;
}

const mockNotices = [
  {
    id: "N001",
    title: "Hostel Maintenance Notice",
    description: "The hostel will undergo routine maintenance on Sunday, March 9th. Water supply will be affected from 9 AM to 2 PM.",
    date: "March 5, 2026",
    priority: "high",
    pinned: true,
  },
  {
    id: "N002",
    title: "New Mess Menu",
    description: "Updated mess menu for the month of March is now available. Special dishes on weekends!",
    date: "March 3, 2026",
    priority: "medium",
    pinned: false,
  },
  {
    id: "N003",
    title: "Electricity Conservation Week",
    description: "As part of our green initiative, please switch off lights and fans when not in use. Let's save energy together!",
    date: "March 1, 2026",
    priority: "low",
    pinned: false,
  },
  {
    id: "N004",
    title: "Payment Reminder",
    description: "Monthly hostel fees payment is due by March 10th. Please clear your dues to avoid late fees.",
    date: "February 28, 2026",
    priority: "high",
    pinned: true,
  },
];

export function Notices({ onBack }: NoticesProps) {
  const priorityColors = {
    high: "bg-[#E53935] text-white",
    medium: "bg-[#FB8C00] text-white",
    low: "bg-[#26A69A] text-white",
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Notices</h1>
        </div>
        <p className="text-sm opacity-90 ml-13">Important announcements</p>
      </div>

      {/* Notices List */}
      <div className="p-6 space-y-4">
        {mockNotices.map((notice) => (
          <Card key={notice.id} className="border-none shadow-md overflow-hidden">
            {notice.pinned && (
              <div className="h-1 bg-gradient-to-r from-[#1E88E5] to-[#26A69A]" />
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {notice.pinned && (
                    <Pin className="w-4 h-4 text-[#1E88E5] flex-shrink-0" />
                  )}
                  <h3 className="font-semibold">{notice.title}</h3>
                </div>
                <Badge className={`${priorityColors[notice.priority as keyof typeof priorityColors]} text-xs`}>
                  {notice.priority.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{notice.description}</p>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{notice.date}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

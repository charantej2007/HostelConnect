import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { SLATimer } from "./SLATimer";
import { User, MapPin } from "lucide-react";

export interface Complaint {
  id: string;
  _id?: string;  // full MongoDB ObjectId for API calls
  type: string;
  description: string;
  status: "pending" | "in-progress" | "resolved" | "completed";
  isOverdue?: boolean;
  assignedWorker?: string;
  roomNumber?: string;
  studentName?: string;
  slaRemaining: number;
  slaTotal: number;
  lastUpdate: string;
  attachments?: string[];
  proof_attachments?: string[];
}

interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void;
  showWorker?: boolean;
  showStudent?: boolean;
}

const statusColors = {
  pending: "bg-[#FB8C00] text-white",
  "in-progress": "bg-[#1E88E5] text-white",
  resolved: "bg-[#9C27B0] text-white", // Purple for resolution verification
  completed: "bg-[#43A047] text-white",
  overdue: "bg-[#E53935] text-white",
};

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved (Pending Approval)",
  completed: "Completed",
  overdue: "Overdue",
};

export function ComplaintCard({ complaint, onClick, showWorker = false, showStudent = false }: ComplaintCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">#{complaint.id}</p>
            <h3 className="font-semibold text-base mt-1">{complaint.type}</h3>
          </div>
          <Badge className={`${complaint.isOverdue ? statusColors.overdue : statusColors[complaint.status]} text-xs px-2 py-1`}>
            {complaint.isOverdue && complaint.status !== "completed" ? "Overdue" : statusLabels[complaint.status]}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {complaint.description}
        </p>
        
        {showWorker && complaint.assignedWorker && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{complaint.assignedWorker}</span>
          </div>
        )}
        
        {showStudent && complaint.studentName && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{complaint.studentName}</span>
          </div>
        )}
        
        {complaint.roomNumber && (
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Room {complaint.roomNumber}</span>
          </div>
        )}
        
        <SLATimer remainingTime={complaint.slaRemaining} totalTime={complaint.slaTotal} />
        
        <p className="text-xs text-gray-400 mt-3">Last update: {complaint.lastUpdate}</p>
      </CardContent>
    </Card>
  );
}

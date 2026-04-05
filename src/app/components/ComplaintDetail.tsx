import { ArrowLeft, User, MapPin, Calendar, CheckCircle } from "lucide-react";
import { auth } from "../config/firebase.config";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { SLATimer } from "./SLATimer";
import { Complaint } from "./ComplaintCard";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { toast } from "sonner";

interface ComplaintDetailProps {
  complaint: Complaint;
  onBack: () => void;
  userRole: "student" | "worker" | "admin";
}

const statusColors = {
  pending: "bg-[#FB8C00] text-white",
  "in-progress": "bg-[#1E88E5] text-white",
  completed: "bg-[#43A047] text-white",
  overdue: "bg-[#E53935] text-white",
};

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export function ComplaintDetail({ complaint, onBack, userRole }: ComplaintDetailProps) {
  const [currentStatus, setCurrentStatus] = useState(complaint.status);
  const [isLoading, setIsLoading] = useState(false);

  // Extract the full MongoDB ID from the complaint object if available
  const fullId = (complaint as any)._id || complaint.id;

  const handleStartWork = async () => {
    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const res = await fetch(`http://localhost:5000/api/complaints/${fullId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker_uid: uid })
      });
      if (res.ok) {
        setCurrentStatus("in-progress");
        toast.success("Work started! Complaint marked as In Progress.");
      } else {
        toast.error("Failed to start work");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${fullId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setCurrentStatus("completed");
        toast.success("Complaint marked as Completed!");
      } else {
        toast.error("Failed to mark as completed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Build dynamic timeline based on status
  const timeline = [];
  if (currentStatus === "completed") {
    timeline.push({ label: "Work Completed", sub: "Issue resolved", color: "bg-[#43A047]", time: complaint.lastUpdate });
  }
  if (currentStatus === "in-progress" || currentStatus === "completed") {
    timeline.push({ label: "Work In Progress", sub: complaint.assignedWorker ? `Assigned to ${complaint.assignedWorker}` : "Worker accepted task", color: "bg-[#1E88E5]", time: "" });
  }
  timeline.push({ label: "Complaint Raised", sub: `By ${complaint.studentName || "Student"}`, color: "bg-[#FB8C00]", time: complaint.lastUpdate });

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm opacity-90">Complaint #{complaint.id}</p>
            <h1 className="text-xl">{complaint.type}</h1>
          </div>
          <Badge className={`${statusColors[currentStatus]}`}>
            {statusLabels[currentStatus]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* SLA Timer */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">SLA Status</h3>
            <SLATimer remainingTime={complaint.slaRemaining} totalTime={complaint.slaTotal} />
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold mb-2">Complaint Details</h3>

            {complaint.studentName && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Student</p>
                  <p className="text-sm font-medium">{complaint.studentName}</p>
                </div>
              </div>
            )}

            {complaint.roomNumber && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Room</p>
                  <p className="text-sm font-medium">{complaint.roomNumber}</p>
                </div>
              </div>
            )}

            {complaint.assignedWorker && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Assigned Worker</p>
                  <p className="text-sm font-medium">{complaint.assignedWorker}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Raised On</p>
                <p className="text-sm font-medium">{complaint.lastUpdate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-700">{complaint.description}</p>
          </CardContent>
        </Card>

        {/* Worker Actions */}
        {userRole === "worker" && (
          <>
            {currentStatus === "pending" && (
              <Button
                onClick={handleStartWork}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white"
              >
                {isLoading ? "Starting..." : "▶ Start Work"}
              </Button>
            )}

            {currentStatus === "in-progress" && (
              <Button
                onClick={handleMarkCompleted}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#43A047] to-[#388E3C] text-white"
              >
                {isLoading ? "Saving..." : "✓ Mark as Completed"}
              </Button>
            )}

            {currentStatus === "completed" && (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-[#43A047]" />
                <span className="text-[#43A047] font-semibold">Work Completed</span>
              </div>
            )}
          </>
        )}

        {/* Activity Timeline */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center`}>
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                    {idx < timeline.length - 1 && <div className="w-0.5 h-10 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                    {item.time && <p className="text-xs text-gray-400 mt-1">{item.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

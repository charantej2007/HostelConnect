import { API_URL } from "../config/api.config";
import { useState, useEffect } from "react";
import { ArrowLeft, Filter } from "lucide-react";
import { ComplaintCard, Complaint } from "./ComplaintCard";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { auth } from "../config/firebase.config";

interface TrackComplaintsProps {
  onBack: () => void;
  onComplaintClick: (complaint: Complaint) => void;
  userRole?: "student" | "worker" | "admin";
}

export function TrackComplaints({ onBack, onComplaintClick, userRole = "student" }: TrackComplaintsProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  useEffect(() => {
    const fetchComplaints = async () => {
        try {
            const uid = auth.currentUser?.uid;
            if(!uid) return;

            let hId = "";
            let uId = "";
            let roomNumber = "Unknown";

            if (userRole === "student") {
                const roomRes = await fetch(`${API_URL}/api/rooms/student/${uid}`);
                if (roomRes.ok) {
                    const data = await roomRes.json();
                    hId = data.hostel._id;
                    uId = data.user._id;
                    roomNumber = data.room.room_number;
                }
            } else {
                const userRes = await fetch(`${API_URL}/api/auth/user/${uid}`);
                if (userRes.ok) {
                    const data = await userRes.json();
                    hId = data.hostel?._id || data.user?.hostel_id || data.hostel;
                    uId = data.user?._id;
                }
            }

            if (!hId) return;

            const cmpRes = await fetch(`${API_URL}/api/complaints/${hId}${uId ? `?student_id=${uId}` : ""}`);
            console.log(`TrackComplaints: Fetching complaints for hostel ${hId}, student ${uId}`);
            if (cmpRes.ok) {
                const cmpData = await cmpRes.json();
                const mapped: Complaint[] = cmpData.map((c: any) => {
                    const slaRemaining = Math.max(0, new Date(c.sla_deadline).getTime() - Date.now()) / (1000 * 60);
                    const isOverdue = slaRemaining <= 0 && c.status !== "Completed";

                    return {
                        id: c._id.substring(c._id.length - 6),
                        _id: c._id,
                        type: c.complaint_type,
                        description: c.description,
                        status: c.status === "Pending" ? "pending" : (c.status === "In Progress" ? "in-progress" : (c.status === "Resolved" ? "resolved" : "completed")),
                        isOverdue,
                        assignedWorker: c.worker_id?.name,
                        roomNumber: roomNumber,
                        slaRemaining,
                        slaTotal: 24 * 60, // Default 24h
                        lastUpdate: new Date(c.created_time).toLocaleDateString()
                    };
                });
                setComplaints(mapped);
            }
        } catch (e) {
            console.error(e);
        }
    };
    fetchComplaints();
  }, []);
  
  const filteredComplaints = filter === "all" 
    ? complaints 
    : filter === "in-progress"
      ? complaints.filter(c => c.status === "in-progress" || c.status === "resolved")
      : complaints.filter(c => c.status === filter);
  
  const statusCounts = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    "in-progress": complaints.filter(c => c.status === "in-progress" || c.status === "resolved").length,
    completed: complaints.filter(c => c.status === "completed").length,
  };
  
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Track Complaints</h1>
        </div>
        <p className="text-sm opacity-90 ml-13">View all your complaints</p>
      </div>
      
      {/* Stats */}
      <div className="px-6 -mt-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-2xl text-[#1E88E5]">{statusCounts.all}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl text-[#FB8C00]">{statusCounts.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl text-[#1E88E5]">{statusCounts["in-progress"]}</p>
            <p className="text-xs text-gray-600">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl text-[#43A047]">{statusCounts.completed}</p>
            <p className="text-xs text-gray-600">Done</p>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="px-6 mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-11 bg-white">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Complaints List */}
      <div className="px-6 space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onClick={() => onComplaintClick(complaint)}
              showWorker={true}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No complaints found</p>
          </div>
        )}
      </div>
    </div>
  );
}

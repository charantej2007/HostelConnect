import { useState, useEffect } from "react";
import { ArrowLeft, Filter } from "lucide-react";
import { ComplaintCard, Complaint } from "./ComplaintCard";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { auth } from "../config/firebase.config";

interface AllComplaintsProps {
  onBack: () => void;
  onComplaintClick: (complaint: Complaint) => void;
  userRole: "worker" | "admin";
}

export function AllComplaints({ onBack, onComplaintClick, userRole }: AllComplaintsProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const userRes = await fetch(`http://localhost:5000/api/auth/user/${uid}`);
        if (!userRes.ok) return;
        const data = await userRes.json();
        const hostelId = data.hostel?._id || data.user?.hostel_id;
        if (!hostelId) return;

        const cmpRes = await fetch(`http://localhost:5000/api/complaints/${hostelId}`);
        if (!cmpRes.ok) return;

        const cmpData = await cmpRes.json();

        // Workers see all complaints; could be filtered to assigned ones if needed
        const mapped: Complaint[] = cmpData.map((c: any) => ({
          id: c._id.substring(c._id.length - 6),
          _id: c._id,
          type: c.complaint_type,
          description: c.description,
          status: c.status === "Pending" ? "pending"
            : c.status === "In Progress" ? "in-progress"
            : c.status === "Completed" ? "completed"
            : "overdue",
          assignedWorker: c.worker_id?.name || undefined,
          studentName: c.student_id?.name || "Unknown Student",
          roomNumber: c.student_id?.room_id?.room_number || undefined,
          slaRemaining: Math.max(0, new Date(c.sla_deadline).getTime() - Date.now()) / (1000 * 60),
          slaTotal: 24 * 60,
          lastUpdate: new Date(c.created_time).toLocaleDateString(),
        }));

        setComplaints(mapped);
      } catch (e) {
        console.error("Failed to load complaints", e);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const filtered = filter === "all" ? complaints : complaints.filter(c => c.status === filter);

  const counts = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    "in-progress": complaints.filter(c => c.status === "in-progress").length,
    completed: complaints.filter(c => c.status === "completed").length,
  };

  const gradientColor = userRole === "worker"
    ? "from-[#26A69A] to-[#00897B]"
    : "from-[#1E88E5] to-[#26A69A]";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientColor} text-white p-6 pb-8`}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl">All Complaints</h1>
            <p className="text-sm opacity-90">{complaints.length} total complaints</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 -mt-4 mb-4">
        <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-xl font-bold text-[#1E88E5]">{counts.all}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#FB8C00]">{counts.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#26A69A]">{counts["in-progress"]}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#43A047]">{counts.completed}</p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-4 h-11 bg-white">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <div className="px-6 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">No complaints found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === "all" ? "No complaints have been raised yet." : `No ${filter} complaints.`}
            </p>
          </div>
        ) : (
          filtered.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onClick={() => onComplaintClick(complaint)}
              showStudent={true}
              showWorker={!!complaint.assignedWorker}
            />
          ))
        )}
      </div>
    </div>
  );
}

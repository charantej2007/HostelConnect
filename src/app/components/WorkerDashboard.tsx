import { motion } from "motion/react";
import { AlertCircle, CheckCircle, Clock, Building2, LogOut, Bell } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { ComplaintCard, Complaint } from "./ComplaintCard";
import { Button } from "./ui/button";
import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";

interface WorkerDashboardProps {
  onComplaintClick: (complaint: Complaint) => void;
  onNavigate?: (screen: string) => void;
  onLogout: () => void;
  onNotifications: () => void;
}
export function WorkerDashboard({ onComplaintClick, onNavigate, onLogout, onNotifications }: WorkerDashboardProps) {
  const [userData, setUserData] = useState<any>(null);
  const [hostelData, setHostelData] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const userRes = await fetch(`http://localhost:5000/api/auth/user/${uid}`);
        if (!userRes.ok) return;
        const data = await userRes.json();
        setUserData(data.user);
        setHostelData(data.hostel);
        
        // Fetch queue
        const cmpRes = await fetch(`http://localhost:5000/api/complaints/${data.hostel._id}`);
        if (cmpRes.ok) {
           const cmpData = await cmpRes.json();
           // Filter for pending universally or assigned to this worker specifically
           const filtered = cmpData.filter((c: any) => 
               c.status === "Pending" || (c.worker_id && c.worker_id._id === data.user._id)
           );
           
           const mapped: Complaint[] = filtered.map((c: any) => ({
                id: c._id.substring(c._id.length - 6),
                _id: c._id,
                type: c.complaint_type,
                description: c.description,
                status: c.status === "Pending" ? "pending" : (c.status === "In Progress" ? "in-progress" : "completed"),
                assignedWorker: c.worker_id?.name || undefined,
                studentName: c.student_id?.name || "Unknown Student",
                roomNumber: c.student_id?.room_id?.room_number || undefined,
                slaRemaining: Math.max(0, new Date(c.sla_deadline).getTime() - Date.now()) / (1000 * 60),
                slaTotal: 24 * 60,
                lastUpdate: new Date(c.created_time).toLocaleDateString()
           }));
           setComplaints(mapped);
        }
      } catch (e) {
        console.error("Failed to load worker board");
      }
    };
    fetchWorkerData();
  }, []);
  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const activeCount = complaints.filter(c => c.status === "in-progress").length;
  const completedCount = complaints.filter(c => c.status === "completed").length;
  const overdueCount = complaints.filter(c => c.status === "overdue").length;
  
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#26A69A] to-[#00897B] text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90">Good morning,</p>
            <h1 className="text-2xl">{userData?.name || "Loading worker..."}</h1>
            <p className="text-sm opacity-90 mt-1">{hostelData?.institution_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onNotifications} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <p className="text-xs opacity-90">Pending</p>
            </div>
            <p className="text-2xl">{pendingCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" />
              <p className="text-xs opacity-90">Active</p>
            </div>
            <p className="text-2xl">{activeCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs opacity-90">Overdue</p>
            </div>
            <p className="text-2xl">{overdueCount}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6 -mt-4">
        {/* Quick Access */}
        {onNavigate && (
          <div className="mb-6">
            <Button
              onClick={() => onNavigate("hostel-info")}
              className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white"
            >
              <Building2 className="w-5 h-5 mr-2" />
              View Hostel Info
            </Button>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-4">Assigned Tasks</h2>
        
        <div className="space-y-4">
          {complaints.length > 0 ? (
            complaints.map((complaint, index) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ComplaintCard
                  complaint={complaint}
                  onClick={() => onComplaintClick(complaint)}
                  showStudent={true}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6">
               <p className="text-gray-500">No pending tasks found</p>
            </div>
          )}
        </div>
        
        {/* Today's Summary */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          
          <Card className="border-none shadow-md">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="font-semibold text-[#1E88E5]">{complaints.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-semibold text-[#43A047]">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-semibold text-[#FB8C00]">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-gray-600">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

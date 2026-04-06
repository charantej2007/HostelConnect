import { API_URL } from "../config/api.config";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle, Clock, Building2, LogOut, Bell } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { ComplaintCard, Complaint } from "./ComplaintCard";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";

interface WorkerDashboardProps {
  onComplaintClick: (complaint: Complaint) => void;
  onNavigate?: (screen: string) => void;
  onLogout: () => void;
  onNotifications: () => void;
  defaultTab?: "queue" | "active" | "history";
}
export function WorkerDashboard({ onComplaintClick, onNavigate, onLogout, onNotifications, defaultTab = "queue" }: WorkerDashboardProps) {
  const [userData, setUserData] = useState<any>(null);
  const [hostelData, setHostelData] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const userRes = await fetch(`${API_URL}/api/auth/user/${uid}`);
        if (!userRes.ok) return;
        const data = await userRes.json();
        setUserData(data.user);
        setHostelData(data.hostel);
        
        // Fetch queue
        const cmpRes = await fetch(`${API_URL}/api/complaints/${data.hostel._id}`);
        if (cmpRes.ok) {
           const cmpData = await cmpRes.json();
           const workerMongoId = String(data.user._id);

           // Filter for pending (Queue) OR assigned to THIS worker specifically
           const filtered = cmpData.filter((c: any) => {
               const status = c.status?.toLowerCase();
               if (status === "pending") return true; // Queue
               
               // If assigned, compare IDs
               if (c.worker_id) {
                   const assignedId = typeof c.worker_id === "string" ? c.worker_id : String(c.worker_id?._id);
                   return assignedId === workerMongoId;
               }
               return false;
           });
           
           const mapped: Complaint[] = filtered.map((c: any) => {
                const slaRemaining = Math.max(0, new Date(c.sla_deadline).getTime() - Date.now()) / (1000 * 60);
                const isOverdue = slaRemaining <= 0 && c.status !== "Completed";

                return {
                    id: c._id.substring(c._id.length - 6),
                    _id: c._id,
                    type: c.complaint_type,
                    description: c.description,
                    status: isOverdue ? "overdue" : (c.status === "Pending" ? "pending" : (c.status === "In Progress" ? "in-progress" : "completed")),
                    assignedWorker: c.worker_id?.name || undefined,
                    studentName: c.student_id?.name || "Unknown Student",
                    roomNumber: c.student_id?.room_id?.room_number || undefined,
                    slaRemaining,
                    slaTotal: 24 * 60,
                    lastUpdate: new Date(c.created_time).toLocaleDateString()
                };
           });
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

  const queueTasks = complaints.filter(c => c.status === "pending");
  const activeTasks = complaints.filter(c => c.status === "in-progress" || c.status === "overdue");
  const historyTasks = complaints.filter(c => c.status === "completed");
  
  const pendingStats = queueTasks.length;
  const activeStats = activeTasks.filter(c => c.status === "in-progress").length;
  const overdueStats = activeTasks.filter(c => c.status === "overdue").length;
  
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
              <p className="text-xs opacity-90">Queue</p>
            </div>
            <p className="text-2xl">{pendingStats}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" />
              <p className="text-xs opacity-90">Active</p>
            </div>
            <p className="text-2xl">{activeStats}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs opacity-90">Overdue</p>
            </div>
            <p className="text-2xl">{overdueStats}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6 -mt-4">
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

        <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full mb-6 bg-gray-100 p-1 h-12 rounded-xl grid grid-cols-3">
                <TabsTrigger value="queue" className="py-2">
                    Queue ({queueTasks.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="py-2">
                    Active ({activeTasks.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="py-2">
                    History ({historyTasks.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="space-y-4">
                <h2 className="text-lg font-semibold mb-2">Queue</h2>
                {queueTasks.length > 0 ? (
                    queueTasks.map((complaint, index) => (
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
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-500">
                        No new complaints in the queue
                    </div>
                )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
                <h2 className="text-lg font-semibold mb-2">Active Tasks</h2>
                {activeTasks.length > 0 ? (
                    activeTasks.map((complaint, index) => (
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
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-500">
                        No active tasks found
                    </div>
                )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
                <h2 className="text-lg font-semibold mb-2">Resolution History</h2>
                {historyTasks.length > 0 ? (
                    historyTasks.map((complaint, index) => (
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
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-500">
                        You haven't resolved any tasks yet
                    </div>
                )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

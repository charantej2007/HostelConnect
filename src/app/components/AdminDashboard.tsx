import { API_URL } from "../config/api.config";
import { motion } from "motion/react";
import { FileText, AlertCircle, Users, TrendingUp, Clock, CheckCircle, Building2, Settings, LogOut, Bell } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { ComplaintCard, Complaint } from "./ComplaintCard";
import { Button } from "./ui/button";
import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { AnnouncementModal } from "./AnnouncementModal";

interface AdminDashboardProps {
  onNavigate: (screen: string) => void;
  onComplaintClick: (complaint: Complaint) => void;
  onLogout: () => void;
  onNotifications: () => void;
}

export function AdminDashboard({ onNavigate, onComplaintClick, onLogout, onNotifications }: AdminDashboardProps) {
  const [statsData, setStatsData] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [hostelId, setHostelId] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const infoRes = await fetch(`${API_URL}/api/hostels/admin-info/${uid}`);
        if (!infoRes.ok) return;
        const info = await infoRes.json();
        setHostelId(info.hostel._id);
        
        const statsRes = await fetch(`${API_URL}/api/hostels/${info.hostel._id}/stats`);
        if (statsRes.ok) setStatsData(await statsRes.json());
        
        const cmpRes = await fetch(`${API_URL}/api/complaints/${info.hostel._id}`);
        if (cmpRes.ok) {
            const cmpData = await cmpRes.json();
            const mapped: Complaint[] = cmpData.slice(0, 5).map((c: any) => ({
                id: c._id.substring(c._id.length - 6),
                _id: c._id,
                type: c.complaint_type,
                description: c.description,
                status: c.status === "Pending" ? "pending" : (c.status === "In Progress" ? "in-progress" : c.status === "Completed" ? "completed" : "overdue"),
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
        console.error("Failed to load admin stats");
      }
    };
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  // Stats map removed - moved to AdminAnalytics
  
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90">Welcome,</p>
            <h1 className="text-2xl">Admin Panel</h1>
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
        
        {/* Quick Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-90">All Complaints</p>
              <p className="text-2xl">{statsData?.complaints?.total || 0}</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Resolution Rate</p>
              <p className="text-2xl">
                 {statsData?.complaints?.total ? Math.round((statsData.complaints.resolved / statsData.complaints.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6 -mt-4">
        {/* Management Actions */}
        <div className="mb-6">
          <Button
            onClick={() => onNavigate("manage-hostel-info")}
            className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white"
          >
            <Building2 className="w-5 h-5 mr-2" />
            Manage Hostel Info
          </Button>
          <Button
            onClick={() => setIsAnnouncementOpen(true)}
            className="w-full h-12 mt-3 bg-gradient-to-r from-[#26A69A] to-[#1E88E5] text-white"
          >
            <Bell className="w-5 h-5 mr-2" />
            Announcement
          </Button>
          
          <AnnouncementModal 
            isOpen={isAnnouncementOpen} 
            onClose={() => setIsAnnouncementOpen(false)}
            hostelId={hostelId}
          />
        </div>


        
        {/* Recent Complaints */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Complaints</h2>
          <button
            onClick={() => onNavigate("all-complaints")}
            className="text-sm text-[#1E88E5]"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {complaints.length > 0 ? complaints.map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ComplaintCard
                complaint={complaint}
                onClick={() => onComplaintClick(complaint)}
                showWorker={true}
                showStudent={true}
              />
            </motion.div>
          )) : (
            <div className="text-center py-6">
                <p className="text-gray-500">No recent complaints</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

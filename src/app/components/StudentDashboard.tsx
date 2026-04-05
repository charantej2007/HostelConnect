import { API_URL } from "../config/api.config";
import { motion } from "motion/react";
import { FileText, Search, Home, Building2, Bell, User, LogOut } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";

interface StudentDashboardProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  onNotifications: () => void;
}

export function StudentDashboard({ onNavigate, onLogout, onNotifications }: StudentDashboardProps) {
  const [userData, setUserData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [activeComplaintsCount, setActiveComplaintsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const roomRes = await fetch(`${API_URL}/api/rooms/student/${uid}`);
        if (!roomRes.ok) return;
        const data = await roomRes.json();
        setUserData(data.user);
        setRoomData(data.room);
        
        // Fetch complaints
        const cmpRes = await fetch(`${API_URL}/api/complaints/${data.hostel._id}?student_id=${data.user._id}`);
        if (cmpRes.ok) {
           const complaints = await cmpRes.json();
           setActiveComplaintsCount(complaints.filter((c:any) => c.status !== 'Completed').length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  const dashboardCards = [
    {
      id: "raise-complaint",
      title: "Raise Complaint",
      description: "Report an issue",
      icon: FileText,
      color: "from-[#1E88E5] to-[#1976D2]",
      iconBg: "bg-[#1E88E5]/10",
      iconColor: "text-[#1E88E5]",
    },
    {
      id: "track-complaints",
      title: "Track Complaints",
      description: "View complaint status",
      icon: Search,
      color: "from-[#26A69A] to-[#00897B]",
      iconBg: "bg-[#26A69A]/10",
      iconColor: "text-[#26A69A]",
    },
    {
      id: "room-details",
      title: "Room Details",
      description: "View room information",
      icon: Home,
      color: "from-[#43A047] to-[#388E3C]",
      iconBg: "bg-[#43A047]/10",
      iconColor: "text-[#43A047]",
    },
    {
      id: "hostel-info",
      title: "Hostel Info",
      description: "View block & facilities",
      icon: Building2,
      color: "from-[#FB8C00] to-[#F57C00]",
      iconBg: "bg-[#FB8C00]/10",
      iconColor: "text-[#FB8C00]",
    },
  ];
  
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90">Welcome back,</p>
            <h1 className="text-2xl">{userData?.name || "Loading..."}</h1>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sm opacity-90">Room Number</p>
            <p className="text-2xl">{roomData?.room_number || "Unassigned"}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sm opacity-90">Active Complaints</p>
            <p className="text-2xl">{activeComplaintsCount}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6 -mt-4">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all border-none overflow-hidden h-full"
                  onClick={() => onNavigate(card.id)}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-base mb-1">{card.title}</h3>
                    <p className="text-xs text-gray-600">{card.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#FB8C00]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-[#FB8C00]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Welcome to HostelConnect</h3>
                  <p className="text-xs text-gray-600 mb-1">Your profile has been created.</p>
                  <p className="text-xs text-gray-400">Just now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

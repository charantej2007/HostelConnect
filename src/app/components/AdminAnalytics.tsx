import { API_URL } from "../config/api.config";
import { motion } from "motion/react";
import { FileText, AlertCircle, Users, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useState, useEffect } from "react";
import { auth } from "../config/firebase.config";

interface AdminAnalyticsProps {
  onBack: () => void;
}

export function AdminAnalytics({ onBack }: AdminAnalyticsProps) {
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const infoRes = await fetch(`${API_URL}/api/hostels/admin-info/${uid}`);
        if (!infoRes.ok) return;
        const info = await infoRes.json();
        
        const statsRes = await fetch(`${API_URL}/api/hostels/${info.hostel._id}/stats`);
        if (statsRes.ok) setStatsData(await statsRes.json());
      } catch (e) {
        console.error("Failed to load admin stats");
      }
    };
    fetchAdminData();
  }, []);

  const stats = [
    {
      id: "total",
      title: "Total Complaints",
      value: statsData?.complaints?.total || 0,
      change: "--",
      icon: FileText,
      color: "from-[#1E88E5] to-[#1976D2]",
      iconBg: "bg-[#1E88E5]/10",
      iconColor: "text-[#1E88E5]",
    },
    {
      id: "pending",
      title: "Pending",
      value: statsData?.complaints?.pending || 0,
      change: "--",
      icon: Clock,
      color: "from-[#FB8C00] to-[#F57C00]",
      iconBg: "bg-[#FB8C00]/10",
      iconColor: "text-[#FB8C00]",
    },
    {
      id: "workers",
      title: "Active Workers",
      value: statsData?.totalWorkers || 0,
      change: "--",
      icon: Users,
      color: "from-[#26A69A] to-[#00897B]",
      iconBg: "bg-[#26A69A]/10",
      iconColor: "text-[#26A69A]",
    },
    {
      id: "students",
      title: "Total Students",
      value: statsData?.totalStudents || 0,
      change: "--",
      icon: Users,
      color: "from-[#E53935] to-[#C62828]",
      iconBg: "bg-[#E53935]/10",
      iconColor: "text-[#E53935]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Analytics</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-md">
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-2xl mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-xs ${stat.change.startsWith('+') ? 'text-[#43A047]' : 'text-[#E53935]'}`}>
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        <h2 className="text-lg font-semibold mb-4">Department Performance</h2>
        <Card className="border-none shadow-md mb-6">
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Electrical</span>
                <span className="text-sm text-[#43A047]">92%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#43A047]" style={{ width: "92%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Water & Plumbing</span>
                <span className="text-sm text-[#43A047]">88%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#43A047]" style={{ width: "88%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Cleaning</span>
                <span className="text-sm text-[#43A047]">95%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#43A047]" style={{ width: "95%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Furniture</span>
                <span className="text-sm text-[#FB8C00]">75%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#FB8C00]" style={{ width: "75%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

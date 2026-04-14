import { ArrowLeft, Bell, Calendar, Pin, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";
import { auth } from "../config/firebase.config";
import { apiClient } from "../utils/apiClient";

interface NoticesProps {
  onBack: () => void;
}

interface Announcement {
  _id: string;
  title: string;
  description: string;
  priority: string;
  pinned: boolean;
  date: string;
  attachments?: string[];
}

export function Notices({ onBack }: NoticesProps) {
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const priorityColors = {
    high: "bg-[#E53935] text-white",
    medium: "bg-[#FB8C00] text-white",
    low: "bg-[#26A69A] text-white",
  };

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        // 1. Get user/hostel info from session
        const userRes = await apiClient.get('/api/auth/me');
        if (!userRes.ok) return;
        const userData = await userRes.json();
        const hostelId = userData.user?.hostel_id?._id || userData.user?.hostel_id;
        if (!hostelId) return;

        // 2. Fetch announcements
        const res = await apiClient.get(`/api/announcements/hostel/${hostelId}`);
        if (res.ok) {
          const data = await res.json();
          setNotices(data);
        }
      } catch (error) {
        console.error("Failed to fetch notices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

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
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading notices...</div>
        ) : notices.length > 0 ? (
          notices.map((notice) => (
            <Card key={notice._id} className="border-none shadow-md overflow-hidden">
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
                
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{notice.description}</p>
                
                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {notice.attachments.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border rounded-full px-3 py-1 text-xs text-blue-600 font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Document {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(notice.date).toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric" 
                  })}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notices at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}

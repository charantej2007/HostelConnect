import { API_URL } from "../config/api.config";
import { useState, useEffect } from "react";
import { ArrowLeft, Bell, CheckCircle, Clock, AlertCircle, Wrench, FileText } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { auth } from "../config/firebase.config";

interface NotificationsProps {
  onBack: () => void;
  userRole: "student" | "worker" | "admin";
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "pending" | "in-progress" | "completed" | "raised";
  read: boolean;
}

const typeConfig = {
  raised: {
    icon: FileText,
    color: "bg-[#1E88E5]/10",
    iconColor: "text-[#1E88E5]",
    badge: "bg-[#1E88E5]",
  },
  pending: {
    icon: Clock,
    color: "bg-[#FB8C00]/10",
    iconColor: "text-[#FB8C00]",
    badge: "bg-[#FB8C00]",
  },
  "in-progress": {
    icon: Wrench,
    color: "bg-[#26A69A]/10",
    iconColor: "text-[#26A69A]",
    badge: "bg-[#26A69A]",
  },
  completed: {
    icon: CheckCircle,
    color: "bg-[#43A047]/10",
    iconColor: "text-[#43A047]",
    badge: "bg-[#43A047]",
  },
};

const statusLabel: Record<string, string> = {
  Pending: "pending",
  "In Progress": "in-progress",
  Completed: "completed",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Notifications({ onBack, userRole }: NotificationsProps) {
  const LOCAL_STORAGE_KEY = `hostelconnect_read_notifications_${auth.currentUser?.uid || 'guest'}`;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save readIds whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  }, [readIds, LOCAL_STORAGE_KEY]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        let hostelId: string | null = null;
        let userId: string | null = null;
        let studentId: string | null = null;

        // Get user data
        const userRes = await fetch(`${API_URL}/api/auth/user/${uid}`);
        if (userRes.ok) {
          const data = await userRes.json();
          userId = data.user?._id;
          hostelId = data.hostel?._id || data.user?.hostel_id;
        }

        if (userRole === "student") {
          const roomRes = await fetch(`${API_URL}/api/rooms/student/${uid}`);
          if (roomRes.ok) {
            const rd = await roomRes.json();
            hostelId = rd.hostel?._id || hostelId;
            studentId = rd.user?._id || userId;
          }
        }

        if (!hostelId) { setLoading(false); return; }

        // Fetch complaints
        const url = userRole === "student" && studentId
          ? `${API_URL}/api/complaints/${hostelId}?student_id=${studentId}`
          : `${API_URL}/api/complaints/${hostelId}`;

        const cmpRes = await fetch(url);
        if (!cmpRes.ok) { setLoading(false); return; }
        const complaints = await cmpRes.json();

        // Build notifications from complaint history
        const notifs: NotificationItem[] = [];

        complaints.forEach((c: any) => {
          const shortId = c._id.substring(c._id.length - 6).toUpperCase();
          const cType = c.complaint_type;

          // Complaint raised notification
          notifs.push({
            id: `${c._id}-raised`,
            title: `Complaint Raised — ${cType}`,
            message: `Complaint #${shortId} has been successfully submitted${userRole !== "student" ? ` by ${c.student_id?.name || "a student"}` : ""}.`,
            time: timeAgo(c.created_time),
            type: "raised",
            read: false,
          });

          // Status update notifications
          if (c.status === "In Progress") {
            notifs.push({
              id: `${c._id}-inprogress`,
              title: `Work Started — ${cType}`,
              message: `Complaint #${shortId} is now In Progress${c.worker_id?.name ? ` — assigned to ${c.worker_id.name}` : ""}.`,
              time: timeAgo(c.created_time),
              type: "in-progress",
              read: false,
            });
          }

          if (c.status === "Resolved") {
            notifs.push({
              id: `${c._id}-resolved`,
              title: `✨ Resolved — ${cType}`,
              message: `Complaint #${shortId} has been addressed by ${c.worker_id?.name || "a worker"}. Please verify the work to complete it.`,
              time: timeAgo(c.created_time),
              type: "raised", // Changed to raised for better visual contrast
              read: false,
            });
          }

          if (c.status === "Completed") {
            notifs.push({
              id: `${c._id}-completed`,
              title: `✅ Verified — ${cType}`,
              message: `Complaint #${shortId} has been verified and officially closed.`,
              time: c.completed_time ? timeAgo(c.completed_time) : timeAgo(c.created_time),
              type: "completed",
              read: false,
            });
          }

          // SLA breach warning for pending
          const slaDeadline = new Date(c.sla_deadline);
          if (c.status === "Pending" && Date.now() > slaDeadline.getTime()) {
            notifs.push({
              id: `${c._id}-overdue`,
              title: `⚠️ SLA Breached — ${cType}`,
              message: `Complaint #${shortId} has exceeded its resolution deadline.`,
              time: timeAgo(c.sla_deadline),
              type: "pending",
              read: false,
            });
          }
        });

        // Most recent first
        const sorted = notifs.reverse();
        setNotifications(sorted);

        // Auto-mark all as read when opened, as requested
        setReadIds(prev => {
          const newSet = new Set(prev);
          sorted.forEach(n => newSet.add(n.id));
          return newSet;
        });
      } catch (e) {
        console.error("Notifications fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userRole]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const handleRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  const roleGradient = {
    student: "from-[#1E88E5] to-[#26A69A]",
    worker: "from-[#26A69A] to-[#00897B]",
    admin: "from-[#43A047] to-[#388E3C]",
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${roleGradient[userRole]} text-white p-6`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl">Notifications</h1>
              <p className="text-sm opacity-80">Complaint status updates</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="px-6 py-3 bg-white border-b border-gray-100">
          <span className="text-sm text-gray-500">
            <span className="font-bold text-[#1E88E5]">{unreadCount}</span> unread notifications
          </span>
        </div>
      )}

      <div className="p-6 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">Complaint updates will appear here</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = typeConfig[notif.type];
            const Icon = cfg.icon;
            const isRead = readIds.has(notif.id);
            return (
              <Card
                key={notif.id}
                className={`border-none shadow-sm cursor-pointer transition-all ${isRead ? "opacity-60" : "shadow-md"}`}
                onClick={() => handleRead(notif.id)}
              >
                <CardContent className="p-4 flex gap-3">
                  <div className={`w-11 h-11 ${cfg.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-tight ${isRead ? "text-gray-500" : "text-gray-800"}`}>
                        {notif.title}
                      </p>
                      {!isRead && (
                        <span className={`w-2 h-2 rounded-full ${cfg.badge} flex-shrink-0 mt-1.5`} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{notif.time}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

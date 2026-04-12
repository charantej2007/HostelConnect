import { API_URL } from "../config/api.config";
import { User, Mail, Phone, MapPin, Building2, Calendar, LogOut, Key, Pencil, Save, X, Copy } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";

interface ProfileProps {
  onBack: () => void;
  onLogout?: () => void;
  userRole: "student" | "worker" | "admin";
}

export function Profile({ onBack, onLogout, userRole }: ProfileProps) {
  const [userData, setUserData] = useState<any>(null);
  const [hostelData, setHostelData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [complaintStats, setComplaintStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const res = await fetch(`${API_URL}/api/auth/user/${uid}`);
        if (!res.ok) return;
        const data = await res.json();
        setUserData(data.user);
        setHostelData(data.hostel);
        setEditName(data.user?.name || "");
        setEditPhone(data.user?.phone_number || "");

        // For students, fetch room info
        if (userRole === "student") {
          const roomRes = await fetch(`${API_URL}/api/rooms/student/${uid}`);
          if (roomRes.ok) {
            const roomInfo = await roomRes.json();
            setRoomData(roomInfo.room);
            // Fetch complaint stats
            if (roomInfo.hostel?._id && data.user?._id) {
              const cmpRes = await fetch(`${API_URL}/api/complaints/${roomInfo.hostel._id}?student_id=${data.user._id}`);
              if (cmpRes.ok) {
                const cmps = await cmpRes.json();
                setComplaintStats({
                  total: cmps.length,
                  pending: cmps.filter((c: any) => c.status === "Pending").length,
                  resolved: cmps.filter((c: any) => c.status === "Completed" || c.status === "Resolved").length,
                });
              }
            }
          }
        }

        // For workers, fetch their complaint task stats
        if (userRole === "worker" && data.hostel?._id) {
          const cmpRes = await fetch(`${API_URL}/api/complaints/${data.hostel._id}`);
          if (cmpRes.ok) {
            const cmps = await cmpRes.json();
            const mine = cmps.filter((c: any) => c.worker_id?._id === data.user._id || c.worker_id === data.user._id);
            setComplaintStats({
              total: mine.length,
              pending: mine.filter((c: any) => c.status === "Pending").length,
              resolved: mine.filter((c: any) => c.status === "Completed" || c.status === "Resolved").length,
            });
          }
        }
      } catch (e) {
        console.error("Profile fetch error", e);
      }
    };
    fetchProfile();
  }, [userRole]);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/user/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone_number: editPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setIsEditMode(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onLogout?.();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const displayName = userData?.name || auth.currentUser?.email?.split("@")[0] || "User";
  const displayEmail = userData?.email || auth.currentUser?.email || "—";
  const displayPhone = userData?.phone_number || "—";

  const roleColor: Record<string, string> = {
    student: "from-[#1E88E5] to-[#1976D2]",
    worker: "from-[#26A69A] to-[#00897B]",
    admin: "from-[#43A047] to-[#388E3C]",
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${roleColor[userRole]} text-white p-6 pb-24`}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl">Profile</h1>
          <button
            onClick={() => { setIsEditMode(!isEditMode); setEditName(userData?.name || ""); setEditPhone(userData?.phone_number || ""); }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
          >
            {isEditMode ? <X className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-sm opacity-80 capitalize">{userRole} Account</p>
      </div>

      <div className="px-6 -mt-16 space-y-4">
        {/* Profile Card */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-5">
              <div className={`w-24 h-24 bg-gradient-to-br ${roleColor[userRole]} rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              {!isEditMode && <h2 className="text-xl font-semibold">{displayName}</h2>}
              <Badge className="mt-1 capitalize bg-gray-100 text-gray-600">{userRole}</Badge>
            </div>

            {/* Edit Form */}
            {isEditMode ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={displayEmail} disabled className="h-11 bg-gray-50 text-gray-400" />
                  <p className="text-xs text-gray-400">Email cannot be changed</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className={`w-full h-11 bg-gradient-to-r ${roleColor[userRole]} text-white`}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-700">{displayEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium text-gray-700">{displayPhone}</p>
                  </div>
                </div>

                {userRole === "student" && roomData && (
                  <>
                    <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Block</p>
                        <p className="font-medium text-gray-700">{roomData.block || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Room</p>
                        <p className="font-medium text-gray-700">{roomData.room_number || "—"}</p>
                      </div>
                    </div>
                  </>
                )}

                {userRole === "admin" && hostelData && (
                  <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Institution</p>
                      <p className="font-medium text-gray-700">{hostelData.institution_name || "—"}</p>
                    </div>
                  </div>
                )}

                {userData?.registration_number && (
                  <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Registration No.</p>
                      <p className="font-medium text-gray-700">{userData.registration_number}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Stats */}
        {userRole === "student" && (
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Your Complaints</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[#1E88E5]">{complaintStats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#FB8C00]">{complaintStats.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#43A047]">{complaintStats.resolved}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Worker Stats */}
        {userRole === "worker" && (
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Task Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[#1E88E5]">{complaintStats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#FB8C00]">{complaintStats.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#43A047]">{complaintStats.resolved}</p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Access Codes */}
        {userRole === "admin" && hostelData && (
          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#1E88E5] to-[#26A69A]" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-[#1E88E5]" />
                <h3 className="font-semibold">Access Codes</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Share these codes with students and workers to grant access.</p>

              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1E88E5] flex items-center gap-1">
                    <User className="w-4 h-4" /> Student Code
                  </span>
                  <Badge className="bg-[#1E88E5] text-white text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-base font-mono font-bold text-gray-800">{hostelData.student_code}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(hostelData.student_code, "Student code")} className="h-8">
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#26A69A] flex items-center gap-1">
                    <User className="w-4 h-4" /> Worker Code
                  </span>
                  <Badge className="bg-[#26A69A] text-white text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-base font-mono font-bold text-gray-800">{hostelData.worker_code}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(hostelData.worker_code, "Worker code")} className="h-8">
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout} className="w-full h-12 border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white">
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

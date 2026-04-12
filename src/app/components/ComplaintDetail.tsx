import { API_URL } from "../config/api.config";
import { auth } from "../config/firebase.config";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { SLATimer } from "./SLATimer";
import { Complaint } from "./ComplaintCard";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, User, MapPin, Calendar, CheckCircle, X, Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";

/**
 * Utility to compress Base64 images for storage optimization
 */
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7)); // 70% quality JPEG
    };
  });
};

interface ComplaintDetailProps {
  complaint: Complaint;
  onBack: () => void;
  userRole: "student" | "worker" | "admin";
}

const statusColors = {
  pending: "bg-[#FB8C00] text-white",
  "in-progress": "bg-[#1E88E5] text-white",
  resolved: "bg-[#9C27B0] text-white",
  completed: "bg-[#43A047] text-white",
  overdue: "bg-[#E53935] text-white",
};

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Pending Verification",
  completed: "Completed",
  overdue: "Overdue",
};

export function ComplaintDetail({ complaint, onBack, userRole }: ComplaintDetailProps) {
  const [currentStatus, setCurrentStatus] = useState(complaint.status);
  const [isLoading, setIsLoading] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Extract the full MongoDB ID from the complaint object if available
  const fullId = (complaint as any)._id || complaint.id;

  const handleAcceptJob = async () => {
    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const res = await fetch(`${API_URL}/api/complaints/${fullId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker_uid: uid })
      });
      if (res.ok) {
        setCurrentStatus("in-progress");
        toast.success("Task accepted! Move to In Progress.");
      } else {
        toast.error("Failed to accept task");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!proofPreview) {
        toast.error("Please upload proof of work first");
        return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/complaints/${fullId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_image: proofPreview })
      });
      if (res.ok) {
        setCurrentStatus("resolved");
        toast.success("Proof submitted! Waiting for student approval.");
      } else {
        toast.error("Failed to submit resolution");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/complaints/${fullId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setCurrentStatus("completed");
        toast.success("Resolved! You've marked this as completed.");
      } else {
        toast.error("Failed to verify completion");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          toast.error("Image too large. Please select a photo under 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setProofPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const timeline = [];
  if (currentStatus === "completed") {
    timeline.push({ label: "Verified & Completed", sub: "By student", color: "bg-[#43A047]", time: complaint.lastUpdate });
  }
  if (currentStatus === "resolved" || currentStatus === "completed") {
    timeline.push({ label: "Resolved with Proof", sub: "By worker", color: "bg-[#9C27B0]", time: "" });
  }
  if (currentStatus === "in-progress" || currentStatus === "resolved" || currentStatus === "completed") {
    timeline.push({ label: "Work Accepted", sub: complaint.assignedWorker ? `By ${complaint.assignedWorker}` : "Assigned", color: "bg-[#1E88E5]", time: "" });
  }
  timeline.push({ label: "Complaint Raised", sub: `By ${complaint.studentName || "Student"}`, color: "bg-[#FB8C00]", time: complaint.lastUpdate });

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm opacity-90">Complaint #{complaint.id}</p>
            <h1 className="text-xl">{complaint.type}</h1>
          </div>
          <Badge className={`${complaint.isOverdue && currentStatus !== "completed" ? statusColors.overdue : statusColors[currentStatus]}`}>
            {complaint.isOverdue && currentStatus !== "completed" ? "Overdue" : statusLabels[currentStatus]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* SLA Timer */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">SLA Status</h3>
            <SLATimer remainingTime={complaint.slaRemaining} totalTime={complaint.slaTotal} />
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold mb-2">Complaint Details</h3>

            {complaint.studentName && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Student</p>
                  <p className="text-sm font-medium">{complaint.studentName}</p>
                </div>
              </div>
            )}

            {complaint.roomNumber && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Room</p>
                  <p className="text-sm font-medium">{complaint.roomNumber}</p>
                </div>
              </div>
            )}

            {complaint.assignedWorker && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Assigned Worker</p>
                  <p className="text-sm font-medium">{complaint.assignedWorker}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Raised On</p>
                <p className="text-sm font-medium">{complaint.lastUpdate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Images */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4 space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700">{complaint.description}</p>
            </div>
            
            {complaint.attachments && complaint.attachments.length > 0 && (
                <div>
                     <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Initial Evidence
                     </p>
                     <div className="grid grid-cols-2 gap-2">
                        {complaint.attachments.map((url, i) => (
                            <img key={i} src={url} alt="Initial" className="w-full h-32 object-cover rounded-lg border border-gray-100" />
                        ))}
                     </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Proof of Work */}
        {(complaint.proof_attachments?.length || 0) > 0 || currentStatus === "resolved" || currentStatus === "completed" ? (
             <Card className="border-none shadow-md bg-purple-50/30">
                <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                        <CheckCircle2 className="w-5 h-5" /> Proof of Resolution
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {complaint.proof_attachments?.map((url, i) => (
                            <img key={i} src={url} alt="Proof" className="w-full h-32 object-cover rounded-lg border-2 border-purple-200" />
                        ))}
                        {currentStatus === "resolved" && !complaint.proof_attachments?.length && proofPreview && (
                            <img src={proofPreview} alt="Recent Proof" className="w-full h-32 object-cover rounded-lg border-2 border-purple-200" />
                        )}
                    </div>
                </CardContent>
             </Card>
        ) : null}

        {/* User Actions */}
        <div className="mt-2">
            {/* Worker Actions */}
            {userRole === "worker" && (
                <div className="space-y-3">
                    {currentStatus === "pending" && (
                        <Button
                            onClick={handleAcceptJob}
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white"
                        >
                            {isLoading ? "Processing..." : "▶ Accept Job from Queue"}
                        </Button>
                    )}

                    {currentStatus === "in-progress" && (
                        <div className="space-y-3">
                            {!proofPreview ? (
                                <label className="block">
                                    <input type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer bg-white hover:border-purple-400 transition-colors">
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-medium">Upload Completion Proof</p>
                                    </div>
                                </label>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <img src={proofPreview} alt="Proof" className="w-full h-40 object-cover rounded-xl" />
                                        <button onClick={() => setProofPreview(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <Button
                                        onClick={handleResolve}
                                        disabled={isLoading}
                                        className="w-full h-12 bg-gradient-to-r from-[#9C27B0] to-[#7B1FA2] text-white"
                                    >
                                        {isLoading ? "Submitting..." : "✓ Submit Resolution Proof"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStatus === "resolved" && (
                        <div className="p-4 bg-purple-50 text-purple-700 text-center rounded-xl font-medium border border-purple-100">
                             Resolution submitted. Waiting for student approval.
                        </div>
                    )}
                </div>
            )}

            {/* Student Actions */}
            {userRole === "student" && currentStatus === "resolved" && (
                <div className="space-y-3">
                     <p className="text-sm text-gray-600 px-1 font-medium italic">Please verify the resolution proof above before approving.</p>
                     <Button
                        onClick={handleVerify}
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-[#43A047] to-[#388E3C] text-white"
                    >
                        {isLoading ? "Verifying..." : "🌟 Approve & Complete Work"}
                    </Button>
                </div>
            )}

            {currentStatus === "completed" && (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-[#43A047]" />
                    <span className="text-[#43A047] font-semibold">Work Verified & Closed</span>
                </div>
            )}
        </div>

        {/* Activity Timeline */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center`}>
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                    {idx < timeline.length - 1 && <div className="w-0.5 h-10 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                    {item.time && <p className="text-xs text-gray-400 mt-1">{item.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

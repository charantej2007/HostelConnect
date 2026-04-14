import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Phone, MessageCircle, User, Wifi, Utensils, Dumbbell, BookOpen, Shield, Camera } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { auth } from "../config/firebase.config";
import { apiClient } from "../utils/apiClient";

interface HostelInfoProps {
  onBack: () => void;
}

const facilityIcons: Record<string, any> = {
  "Wi-Fi": Wifi, "Mess": Utensils, "Gym": Dumbbell, "Library": BookOpen,
  "24/7 Security": Shield, "CCTV": Camera, "Common Room": Building2, "Study Room": BookOpen,
};

export function HostelInfo({ onBack }: HostelInfoProps) {
  const [hostel, setHostel] = useState<any>(null);
  const [userBlock, setUserBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostelInfo = async () => {
      try {
        let hostelId: string | null = null;

        // Try student room lookup first via session
        const roomRes = await apiClient.get('/api/rooms/student/current');
        if (roomRes.ok) {
          const data = await roomRes.json();
          hostelId = data.hostel?._id || null;
          if (data.room?.block) {
            setUserBlock(data.room.block);
          }
        }

        // If not a student or not assigned, get via session user record
        if (!hostelId) {
          const meRes = await apiClient.get('/api/auth/me');
          if (meRes.ok) {
            const data = await meRes.json();
            hostelId = data.user?.hostel_id?._id || data.user?.hostel_id || null;
            if (data.user?.room_id?.block) {
                setUserBlock(data.user.room_id.block);
            }
          }
        }

        if (!hostelId) { setLoading(false); return; }

        // Fetch full hostel details including blocks
        const hostelRes = await apiClient.get(`/api/hostels/${hostelId}/info`);
        if (hostelRes.ok) {
          const data = await hostelRes.json();
          setHostel(data.hostel);
        }
      } catch (e) {
        console.error("Failed to load hostel info", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHostelInfo();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl">Hostel Info</h1>
            <p className="text-sm opacity-90">{hostel?.institution_name || "Loading..."}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading hostel details...</div>
        ) : !hostel ? (
          <div className="text-center py-16 text-gray-400">No hostel info available.</div>
        ) : (
          <>
            {/* General Hostel Card */}
            <Card className="border-none shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#1E88E5] to-[#26A69A]" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 bg-[#1E88E5]/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#1E88E5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E88E5]">{hostel.institution_name}</h3>
                    <p className="text-xs text-gray-500">Hostel</p>
                  </div>
                </div>

                {hostel.admin_name && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <User className="w-5 h-5 text-[#26A69A]" />
                    <div>
                      <p className="text-xs text-gray-500">Administrator</p>
                      <p className="font-semibold text-sm">{hostel.admin_name}</p>
                    </div>
                  </div>
                )}

                {hostel.admin_phone && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <Phone className="w-5 h-5 text-[#43A047]" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="font-semibold text-sm">{hostel.admin_phone}</p>
                    </div>
                    <a href={`tel:${hostel.admin_phone}`} className="px-3 py-1.5 bg-[#43A047] text-white text-xs rounded-lg">
                      Call
                    </a>
                  </div>
                )}

                {hostel.admin_email && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-[#1E88E5]" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">{hostel.admin_email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blocks */}
            {hostel.blocks && hostel.blocks.length > 0 ? (
              <>
                <h2 className="text-base font-bold text-gray-700 mt-2">Blocks</h2>
                {hostel.blocks
                  .filter((block: any) => {
                    // If student and has an assigned block, show only that block. 
                    // Otherwise show all.
                    if (userBlock) return block.blockName === userBlock;
                    return true;
                  })
                  .map((block: any, i: number) => (
                  <Card key={block.id || i} className="border-none shadow-md overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-[#26A69A] to-[#1E88E5]" />
                    <CardContent className="p-4 space-y-3">

                      {/* Block name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#26A69A]/10 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#26A69A]" />
                        </div>
                        <h3 className="font-bold text-[#26A69A] text-base">{block.blockName}</h3>
                      </div>

                      {/* Warden */}
                      {block.wardenName && (
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                          <User className="w-4 h-4 text-[#26A69A]" />
                          <div>
                            <p className="text-xs text-gray-500">Warden</p>
                            <p className="font-semibold text-sm">{block.wardenName}</p>
                          </div>
                        </div>
                      )}

                      {/* Mobile */}
                      {block.mobile && (
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                          <Phone className="w-4 h-4 text-[#43A047]" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Phone Number</p>
                            <p className="font-semibold text-sm">{block.mobile}</p>
                          </div>
                          <a href={`tel:${block.mobile}`} className="px-3 py-1.5 bg-[#43A047] text-white text-xs rounded-lg">
                            Call
                          </a>
                        </div>
                      )}

                      {/* WhatsApp */}
                      {block.whatsappLink && (
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">WhatsApp Group</p>
                            <p className="text-xs text-gray-600 truncate">{block.whatsappLink}</p>
                          </div>
                          <a
                            href={block.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#25D366] text-white text-xs rounded-lg whitespace-nowrap"
                          >
                            Join
                          </a>
                        </div>
                      )}

                      {/* Facilities */}
                      {block.facilities && block.facilities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Facilities</p>
                          <div className="flex flex-wrap gap-2">
                            {block.facilities.map((f: string, fi: number) => {
                              const Icon = facilityIcons[f] || Building2;
                              return (
                                <div key={fi} className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                                  <Icon className="w-3 h-3 text-[#1E88E5]" />
                                  <span className="text-xs text-[#1E88E5]">{f}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No blocks added yet. Admin can add them via Manage Hostel Info.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

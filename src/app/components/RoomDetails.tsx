import { useState, useEffect } from "react";
import { ArrowLeft, Home, Users, Bed, DoorOpen, Wifi, Fan, Lightbulb, Bell, CheckCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { auth } from "../config/firebase.config";
import { apiClient } from "../utils/apiClient";

interface RoomDetailsProps {
  onBack: () => void;
  onNavigateToComplaints: () => void;
}

export function RoomDetails({ onBack, onNavigateToComplaints }: RoomDetailsProps) {
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        // Fetch current student's room assignment via session
        const res = await apiClient.get('/api/rooms/student/current');
        if (res.ok) {
            const data = await res.json();
            // Fetch the full room detail using the ID from the assignment
            if (data.room?._id) {
                const roomRes = await apiClient.get(`/api/rooms/detail/${data.room._id}`);
                if (roomRes.ok) {
                    const roomData = await roomRes.json();
                    setRoomInfo(roomData);
                }
            }
        }
      } catch (error) {
        toast.error("Failed to load room details");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoomData();
  }, []);

  if (isLoading) {
      return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">Loading Room Info...</div>;
  }

  if (!roomInfo) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl font-bold mb-2">No Room Assigned</h2>
            <p className="text-gray-500 mb-6">You have not been assigned to any room yet.</p>
            <button onClick={onBack} className="text-[#1E88E5]">← Back to Dashboard</button>
        </div>
      );
  }

  const currentUserUid = auth.currentUser?.uid;

  const handleRoomChangeRequest = () => {
    // In a real app this would call an API
    toast.success("Room change request sent to administrator");
  };

  const amenityIcons: Record<string, any> = {
    '2 Beds': Bed,
    '4 Beds': Bed,
    'Ceiling Fan': Fan,
    'LED Lights': Lightbulb,
    'WiFi': Wifi,
    'Attached Bathroom': DoorOpen,
    'Common Bathroom': DoorOpen
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl">Room Details</h1>
            <p className="text-sm opacity-90">Room {roomInfo.room_number}</p>
          </div>
          <Badge className="bg-[#43A047] text-white">
            {roomInfo.current_occupants.length >= roomInfo.max_occupancy ? "Full" : "Available"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Room Info */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-[#1E88E5]" />
              Room Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Block</p>
                <p className="text-sm font-semibold">{roomInfo.block}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Floor</p>
                <p className="text-sm font-semibold">{roomInfo.floor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Room Type</p>
                <p className="text-sm font-semibold">{roomInfo.room_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Occupancy</p>
                <p className="text-sm font-semibold">{roomInfo.current_occupants.length}/{roomInfo.max_occupancy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roommates */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#26A69A]" />
              Roommates
            </h3>
            
            <div className="space-y-3">
              {roomInfo.current_occupants.map((roommate: any, index: number) => {
                  const isYou = auth.currentUser?.email === roommate.email;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1E88E5] to-[#26A69A] rounded-full flex items-center justify-center text-white">
                        {roommate.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{roommate.name}</p>
                        <p className="text-xs text-gray-600">Bed {index + 1}</p>
                    </div>
                    {isYou && (
                        <Badge className="bg-[#1E88E5] text-white text-xs">You</Badge>
                    )}
                    </div>
                  );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Amenities</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {roomInfo.amenities.map((amenity: string, index: number) => {
                const Icon = amenityIcons[amenity] || CheckCircle;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#43A047]/10">
                      <Icon className="w-5 h-5 text-[#43A047]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{amenity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            
            <div className="space-y-2">
              <button 
                onClick={onNavigateToComplaints}
                className="w-full text-left px-4 py-3 bg-blue-50 text-[#1E88E5] rounded-lg hover:bg-blue-100 transition-colors"
               >
                Report Room Issue
              </button>
              <button 
                onClick={handleRoomChangeRequest}
                className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Request Room Change
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

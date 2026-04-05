import { useState, useEffect } from "react";
import { User, Phone, CheckCircle, Hash, Building, DoorOpen } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { auth } from "../config/firebase.config";

interface Room {
  id: string;
  block: string;
  floor: string;
  room_number: string;
  room_type: string;
  max_occupancy: number;
  current_occupancy: number;
  isFull: boolean;
  amenities: string[];
}

interface StudentOnboardingFormProps {
  hostelId: string;
  onComplete: () => void;
}

export function StudentOnboardingForm({ hostelId, onComplete }: StudentOnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRooms, setIsFetchingRooms] = useState(true);
  
  // Data State
  const [blocks, setBlocks] = useState<string[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [typedRoomNumber, setTypedRoomNumber] = useState("");
  
  // Find room locally to display overview (if they typed a matching room)
  const selectedRoom = allRooms.find(r => r.block === selectedBlock && r.room_number.toUpperCase() === typedRoomNumber.toUpperCase());

  useEffect(() => {
    // Attempt to pre-fill name and email from Firebase if available
    const currentUser = auth.currentUser;
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    }
    
    // Fetch available rooms
    const fetchRooms = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${hostelId}`);
        const data = await response.json();
        if (response.ok) {
          setBlocks(data.blocks || []);
          setAllRooms(data.rooms || []);
        } else {
          toast.error("Failed to load rooms");
        }
      } catch (error) {
        toast.error("Network error while loading rooms");
      } finally {
        setIsFetchingRooms(false);
      }
    };
    
    fetchRooms();
  }, [hostelId]);

  const handleNext = () => {
    if (!name.trim() || !regNumber.trim() || !phone.trim()) {
      toast.error("Please fill in all personal details.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedRoomNumber.trim()) {
      toast.error("Please enter a room number to continue.");
      return;
    }

    setIsLoading(true);
    const currentUser = auth.currentUser;
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: currentUser?.email || "",
          phone,
          firebase_uid: currentUser?.uid,
          role: "student",
          hostel_id: hostelId,
          registration_number: regNumber,
          room_id: typedRoomNumber,
          block: selectedBlock
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration complete!");
        onComplete();
      } else {
        toast.error(data.error || "Failed to complete setup.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = allRooms.filter(r => r.block === selectedBlock);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E88E5] to-[#1976D2] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-white text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Student Profile</h1>
        <p className="text-blue-100 opacity-90">Let's setup your hostel profile</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex h-1.5 bg-blue-50">
          <div className={`bg-[#1E88E5] h-full transition-all duration-300 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>
        
        <CardContent className="p-6">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10 h-12 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg" className="text-gray-700">Registration Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="reg"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. 21BCE1234"
                    className="pl-10 h-12 bg-gray-50 border-gray-200 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit number"
                    className="pl-10 h-12 bg-gray-50 border-gray-200"
                    type="tel"
                  />
                </div>
              </div>

              <Button 
                onClick={handleNext} 
                className="w-full h-12 mt-6 bg-[#1E88E5] hover:bg-[#1976D2] text-white"
              >
                Next &rarr;
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {isFetchingRooms ? (
                <div className="text-center py-8 text-gray-500">Loading available rooms...</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="block" className="text-gray-700">Select Block</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select 
                        id="block" 
                        value={selectedBlock} 
                        onChange={(e) => {
                          setSelectedBlock(e.target.value);
                          setTypedRoomNumber(""); // Reset room if block changes
                        }}
                        className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent text-gray-800"
                      >
                        <option value="" disabled>Choose a block</option>
                        {blocks.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedBlock && (
                    <div className="space-y-2">
                      <Label htmlFor="room" className="text-gray-700">Enter Room Number</Label>
                      <div className="relative">
                        <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="room" 
                          value={typedRoomNumber} 
                          onChange={(e) => setTypedRoomNumber(e.target.value)}
                          placeholder="e.g. A-101"
                          className="pl-10 h-12 bg-gray-50 border-gray-200 uppercase"
                        />
                      </div>
                    </div>
                  )}

                  {selectedRoom && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-green-800 mb-1 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Room Overview
                      </h4>
                      <p className="text-sm text-green-700 mb-1">
                        <strong>Type:</strong> {selectedRoom.room_type} ({selectedRoom.current_occupancy}/{selectedRoom.max_occupancy} Occupied)
                      </p>
                      <p className="text-xs text-green-600">
                        {selectedRoom.amenities.join(" • ")}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      className="w-1/3 h-12"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !typedRoomNumber}
                      className="w-2/3 h-12 bg-gradient-to-r from-[#1E88E5] to-[#1976D2] hover:opacity-90 transition-opacity text-white"
                    >
                      {isLoading ? "Saving..." : "Complete Setup"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

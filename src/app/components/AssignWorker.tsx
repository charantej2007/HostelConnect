import { useState } from "react";
import { ArrowLeft, User, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Complaint } from "./ComplaintCard";
import { Badge } from "./ui/badge";

interface AssignWorkerProps {
  complaint: Complaint;
  onBack: () => void;
  onAssign: (workerId: string) => void;
}

interface Worker {
  id: string;
  name: string;
  department: string;
  activeComplaints: number;
  completionRate: number;
  available: boolean;
}

const mockWorkers: Worker[] = [
  {
    id: "W001",
    name: "Rajesh Kumar",
    department: "Electrical",
    activeComplaints: 2,
    completionRate: 94,
    available: true,
  },
  {
    id: "W002",
    name: "Amit Singh",
    department: "Water & Plumbing",
    activeComplaints: 1,
    completionRate: 89,
    available: true,
  },
  {
    id: "W003",
    name: "Suresh Verma",
    department: "Furniture",
    activeComplaints: 4,
    completionRate: 78,
    available: false,
  },
  {
    id: "W004",
    name: "Priya Sharma",
    department: "Cleaning",
    activeComplaints: 1,
    completionRate: 96,
    available: true,
  },
  {
    id: "W005",
    name: "Vikram Reddy",
    department: "Electrical",
    activeComplaints: 3,
    completionRate: 91,
    available: true,
  },
];

export function AssignWorker({ complaint, onBack, onAssign }: AssignWorkerProps) {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  
  const handleAssign = () => {
    if (selectedWorker) {
      onAssign(selectedWorker);
    }
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
            <h1 className="text-2xl">Assign Worker</h1>
            <p className="text-sm opacity-90">Complaint #{complaint.id}</p>
          </div>
        </div>
      </div>
      
      {/* Complaint Info */}
      <div className="p-6">
        <Card className="border-none shadow-md mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">{complaint.type}</h3>
            <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
            <p className="text-xs text-gray-500">Room {complaint.roomNumber}</p>
          </CardContent>
        </Card>
        
        <h2 className="text-lg font-semibold mb-4">Available Workers</h2>
        
        <div className="space-y-3">
          {mockWorkers.map((worker) => (
            <Card
              key={worker.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedWorker === worker.id
                  ? "border-[#1E88E5] bg-blue-50"
                  : worker.available
                  ? "border-transparent"
                  : "border-transparent opacity-50"
              } shadow-md`}
              onClick={() => worker.available && setSelectedWorker(worker.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#26A69A] to-[#00897B] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {worker.name}
                        {selectedWorker === worker.id && (
                          <CheckCircle className="w-4 h-4 text-[#1E88E5]" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{worker.department}</p>
                    </div>
                  </div>
                  {worker.available ? (
                    <Badge className="bg-[#43A047] text-white text-xs">Available</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Busy</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Active Tasks</p>
                    <p className="text-sm font-semibold">{worker.activeComplaints}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-sm font-semibold text-[#43A047]">
                      {worker.completionRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Assign Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Button
            onClick={handleAssign}
            disabled={!selectedWorker}
            className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white disabled:opacity-50"
          >
            Assign Worker
          </Button>
        </div>
      </div>
    </div>
  );
}

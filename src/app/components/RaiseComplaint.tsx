import { API_URL } from "../config/api.config";
import { useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { auth } from "../config/firebase.config";
import { toast } from "sonner";

interface RaiseComplaintProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function RaiseComplaint({ onBack, onSubmit }: RaiseComplaintProps) {
  const [complaintType, setComplaintType] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const complaintTypes = [
    "Electrical",
    "Water",
    "Cleaning",
    "Furniture",
    "Other",
  ];
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const roomRes = await fetch(`${API_URL}/api/rooms/student/${uid}`);
        if (!roomRes.ok) throw new Error("Failed to authenticate student");
        const data = await roomRes.json();
        
        const res = await fetch(`${API_URL}/api/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: data.user._id,
                hostel_id: data.hostel._id,
                type: complaintType.toUpperCase(),
                description: description
            })
        });
        
        if (res.ok) {
            toast.success("Complaint submitted successfully!");
            onSubmit();
        } else {
            toast.error("Failed to submit complaint");
        }
    } catch(err) {
        toast.error("Network error");
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
          <h1 className="text-2xl">Raise Complaint</h1>
        </div>
        <p className="text-sm opacity-90 ml-13">Submit a new complaint</p>
      </div>
      
      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Complaint Type */}
          <div className="space-y-2">
            <Label htmlFor="complaint-type">Complaint Type *</Label>
            <Select value={complaintType} onValueChange={setComplaintType} required>
              <SelectTrigger className="h-12 bg-white border-gray-200">
                <SelectValue placeholder="Select complaint type" />
              </SelectTrigger>
              <SelectContent>
                {complaintTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 bg-white border-gray-200 resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              {description.length}/500 characters
            </p>
          </div>
          
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Attach Image (Optional)</Label>
            
            {imagePreview ? (
              <Card className="relative overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </Card>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#1E88E5] transition-colors bg-white">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Tap to upload an image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </label>
            )}
          </div>
          
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Your complaint will be assigned to a worker based on the complaint type. You'll receive updates via notifications.
            </p>
          </Card>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white hover:opacity-90"
            disabled={!complaintType || !description}
          >
            Submit Complaint
          </Button>
        </form>
      </div>
    </div>
  );
}

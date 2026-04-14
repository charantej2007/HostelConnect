import { useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { auth } from "../config/firebase.config";
import { toast } from "sonner";
import { apiClient } from "../utils/apiClient";

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
    "Plumbing",
    "Wifi",
    "Laundry Service",
    "Mess",
    "AC Complaints",
    "Housekeeping",
    "Facility Management",
    "Caretaker / assistant warden",
    "Furniture",
    "Other",
  ];
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          toast.error("Image too large. Please select a photo under 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImagePreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await apiClient.post("/api/complaints", {
            type: complaintType.toUpperCase(),
            description: description,
            attachments: imagePreview ? [imagePreview] : []
        });
        
        if (res.ok) {
            toast.success("Complaint submitted successfully!");
            onSubmit();
        } else {
            const data = await res.json();
            toast.error(data.error || "Failed to submit complaint");
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

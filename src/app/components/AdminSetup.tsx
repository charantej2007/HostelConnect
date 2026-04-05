import { API_URL } from "../config/api.config";
import { useState } from "react";
import { Building2, User, Phone, ArrowRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { auth } from "../config/firebase.config";

interface AdminSetupProps {
  onComplete: () => void;
}

export function AdminSetup({ onComplete }: AdminSetupProps) {
  const [formData, setFormData] = useState({
    institutionName: "",
    adminName: "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.institutionName || !formData.adminName || !formData.phoneNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/admin-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: formData.institutionName,
          adminName: formData.adminName,
          email: currentUser.email,
          phone: formData.phoneNumber,
          firebase_uid: currentUser.uid,
          maxRooms: 10 // Setup an initial batch of rooms for testing
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Hostel Management created successfully!");
        onComplete();
      } else {
        toast.error(data.error || "Failed to create Hostel Management.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E88E5] to-[#26A69A] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1E88E5] to-[#26A69A] rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Setup Hostel Management
            </h1>
            <p className="text-sm text-gray-600">
              Create your institution profile
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="institutionName" className="text-sm font-semibold text-gray-700">
                Institution Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="institutionName"
                  type="text"
                  placeholder="e.g., XYZ University Hostel"
                  className="pl-11 h-12 border-2 focus:border-[#1E88E5]"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminName" className="text-sm font-semibold text-gray-700">
                Administrator Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="adminName"
                  type="text"
                  placeholder="e.g., Dr. Rajesh Kumar"
                  className="pl-11 h-12 border-2 focus:border-[#1E88E5]"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
                Phone Number *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  className="pl-11 h-12 border-2 focus:border-[#1E88E5]"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Note:</strong> After setup, unique access codes for students and workers will be generated.
                You can find these codes in your Profile section to share with your hostel members.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white text-base font-semibold"
            >
              {isLoading ? "Creating..." : "Create Hostel Management"}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

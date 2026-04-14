import { useState } from "react";
import { KeyRound, Shield, AlertCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { apiClient } from "../utils/apiClient";

interface CodeVerificationProps {
  role: "student" | "worker";
  onVerified: (hostelId: string) => void;
  onBack: () => void;
}

export function CodeVerification({ role, onVerified, onBack }: CodeVerificationProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Please enter the access code");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiClient.post("/api/auth/verify-code", { 
        code: code.trim().toUpperCase(), 
        role 
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Code verified successfully!");
        onVerified(data.hostel_id);
      } else {
        toast.error(data.error || "Invalid access code. Please check with your administrator.");
      }
    } catch (error) {
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E88E5] to-[#26A69A] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1E88E5] to-[#26A69A] rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Verify Access Code
            </h1>
            <p className="text-sm text-gray-600">
              Enter the {role === "student" ? "Student" : "Worker"} code provided by your administrator
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-amber-800 leading-relaxed">
                This is a one-time verification. Contact your hostel administrator to get the access code
                for {role === "student" ? "students" : "workers"}.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-semibold text-gray-700">
                Access Code *
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="code"
                  type="text"
                  placeholder={`Enter ${role === "student" ? "STU-XXXXXXXX" : "WKR-XXXXXXXX"}`}
                  className="pl-11 h-12 border-2 focus:border-[#1E88E5] uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={12}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isVerifying}
                className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white text-base font-semibold"
              >
                {isVerifying ? "Verifying..." : "Verify Code"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full h-12 text-base"
              >
                Back to Login
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't have an access code?
            </p>
            <p className="text-xs text-gray-500">
              Contact your hostel administrator for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

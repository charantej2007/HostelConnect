import { API_URL } from "../config/api.config";
import { useState } from "react";
import { motion } from "motion/react";
import { User, Wrench, Shield, Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { auth, googleProvider } from "../config/firebase.config";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { toast } from "sonner";

interface RoleSelectionLoginProps {
  onLogin: (role: "student" | "worker" | "admin") => void;
  onSignupComplete: (role: "student" | "worker" | "admin", isFirstTime: boolean) => void;
}

type Role = "student" | "worker" | "admin";

export function RoleSelectionLogin({ onLogin, onSignupComplete }: RoleSelectionLoginProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // OTP States
  const [step, setStep] = useState<"credentials" | "otp" | "reset-password">("credentials");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [purpose, setPurpose] = useState<"signup" | "forgot-password">("signup");

  const roles = [
    {
      id: "student" as Role,
      label: "Student",
      icon: User,
      color: "from-[#1E88E5] to-[#1976D2]",
      description: "Raise and track complaints",
    },
    {
      id: "worker" as Role,
      label: "Worker",
      icon: Wrench,
      color: "from-[#26A69A] to-[#00897B]",
      description: "Manage assigned tasks",
    },
    {
      id: "admin" as Role,
      label: "Administrator",
      icon: Shield,
      color: "from-[#43A047] to-[#388E3C]",
      description: "Oversee operations",
    },
  ];
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedRole) return;

    if (firebaseUser) {
      if (isSignupMode) {
        onSignupComplete(selectedRole, true);
      } else {
        onLogin(selectedRole);
      }
      return;
    }

    if (!email || !password) return;
    setIsLoading(true);

    try {
      if (isSignupMode) {
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match!");
          setIsLoading(false);
          return;
        }

        // 1. Send OTP instead of creating user immediately
        const response = await fetch(`${API_URL}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "signup" })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send OTP");
        }

        setPurpose("signup");
        setStep("otp");
        toast.success("OTP sent to your email!");
      } else {
        // --- LOGIN FLOW ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const existingUser = userCredential.user;
        const idToken = await existingUser.getIdToken();
        const response = await fetch(`${API_URL}/api/auth/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, role: selectedRole })
        });

        const data = await response.json();
        if (data.user && data.user.hostel_id) {
          onLogin(data.user.role);
        } else {
          setErrorMsg("Your registration is incomplete. Please use 'Sign Up' to enter your join code.");
          setIsLoading(false);
          return;
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg("Please enter your email address first.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "forgot-password" })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send OTP");
      }

      setPurpose("forgot-password");
      setStep("otp");
      toast.success("Password reset OTP sent to your email!");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTPAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setErrorMsg("");
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose })
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Invalid OTP");
      }

      if (purpose === "signup") {
        // Create user in Firebase now
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        const idToken = await newUser.getIdToken();
        await fetch(`${API_URL}/api/auth/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, role: selectedRole })
        });
        setFirebaseUser(newUser);
        onSignupComplete(selectedRole!, true);
      } else {
        // Forgot password flow
        setStep("reset-password");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }
    
    setErrorMsg("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, otp })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password reset successfully! Please login.");
      setStep("credentials");
      setIsSignupMode(false);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);
      
      // Sync with backend
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${API_URL}/api/auth/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role: selectedRole })
      });

      const data = await response.json();
      
      if (data.user && data.user.hostel_id) {
        // User already exists and is fully onboarded, log them in
        onLogin(data.user.role);
      } else if (data.user && !data.user.hostel_id) {
        // User exists but hasn't completed onboarding
        setIsSignupMode(true);
        onSignupComplete(data.user.role || "student", true);
      } else {
        // Brand new user, stay in signup mode to get role
        setIsSignupMode(true);
      }
    } catch (error: any) {
      alert("Google Login failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setStep("credentials");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };
  
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg overflow-hidden">
             <img src="/logo.jpg" alt="HostelConnect Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl mb-2">HostelConnect</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </motion.div>
        
        <div className="w-full max-w-sm space-y-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow border-none overflow-hidden"
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className={`h-1 bg-gradient-to-r ${role.color}`} />
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{role.label}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>


      </div>
    );
  }
  
  const currentRole = roles.find((r) => r.id === selectedRole)!;
  const Icon = currentRole.icon;
  
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={() => setSelectedRole(null)}
          className="text-[#1E88E5] mb-4 text-sm flex items-center gap-1"
        >
          ← Back to role selection
        </button>
        
        <Card className="border-none shadow-lg">
          <div className={`h-2 bg-gradient-to-r ${currentRole.color}`} />
          <CardHeader className="text-center pb-4">
            <div className={`w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-md overflow-hidden border-2`} style={{ borderColor: currentRole.color.split(' ')[1]?.replace('to-[', '').replace(']', '') }}>
                <img src="/logo.jpg" alt="HostelConnect Logo" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="text-2xl">
              {currentRole.label} {isSignupMode ? "Signup" : "Login"}
            </CardTitle>
            <CardDescription>
              {isSignupMode ? "Create your account to continue" : "Enter your credentials to continue"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === "credentials" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {!firebaseUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {firebaseUser && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-200">
                    <img src={firebaseUser.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">{firebaseUser.displayName}</p>
                    <p className="text-xs text-blue-700">{firebaseUser.email}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFirebaseUser(null)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}


              {isSignupMode && !firebaseUser && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                    />
                  </div>
                </div>
              )}

              {!isSignupMode && !firebaseUser && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#1E88E5] hover:underline"
                >
                  Forgot password?
                </button>
              )}
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {errorMsg}
                </div>
              )}
              
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 bg-gradient-to-r ${currentRole.color} text-white hover:opacity-90 transition-opacity`}
              >
                {isLoading ? "Please wait..." : isSignupMode ? (firebaseUser ? "Complete Signup" : "Send Signup OTP") : (firebaseUser ? "Continue to Dashboard" : "Login")}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-[#1E88E5] hover:underline"
                >
                  {isSignupMode ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                </button>
              </div>

              {!firebaseUser && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full h-12 flex items-center justify-center gap-2 border-gray-200 bg-white hover:bg-gray-50 transition-all rounded-lg text-gray-700 font-medium shadow-sm"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </>
              )}
            </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOTPAndProceed} className="space-y-6 text-center">
                <div>
                  <h3 className="text-lg font-semibold">Verify Email</h3>
                  <p className="text-sm text-gray-600">Enter the 6-digit code sent to {email}</p>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="w-10 h-12" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading || otp.length !== 6}
                    className={`w-full h-12 bg-gradient-to-r ${currentRole.color} text-white`}
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}

            {step === "reset-password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-gray-600">Create a new password for your account</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimal 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full h-12 bg-gradient-to-r ${currentRole.color} text-white`}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User as UserIcon, Wrench, Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";
import { googleProvider, auth } from "../config/firebase.config";
import { toast } from "sonner";
import { apiClient } from "../utils/apiClient";

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

  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        await GoogleAuth.initialize({
          clientId: '467012019057-raant1fk0n1kk06fmm2fiktjcgnffvqm.apps.googleusercontent.com',
          forceCode: false,
        });
      } catch (e) {
        console.warn("GoogleAuth plugin initialization note:", e);
      }
    };
    initGoogleAuth();

    // Handle Redirect Result for Firebase (Important for Capacitor/Mobile Fallback)
    getRedirectResult(auth).then((result) => {
      if (result) {
        handleBackendAuth(result.user);
      }
    }).catch((error) => {
      console.error("Redirect Error:", error);
    });
  }, []);
  
  const roles = [
    {
      id: "student" as Role,
      label: "Student",
      icon: UserIcon,
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
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedRole) {
      setErrorMsg("Please select a role first.");
      return;
    }

    if (!email || !password) return;
    setIsLoading(true);

    try {
      const endpoint = isSignupMode ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignupMode 
        ? { name: email.split('@')[0], email: email.toLowerCase(), password, role: selectedRole }
        : { email: email.toLowerCase(), password };

      if (isSignupMode && password !== confirmPassword) {
        throw new Error("Passwords do not match!");
      }

      const response = await apiClient.post(endpoint, payload);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Authentication failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      if (isSignupMode || !data.user.hostel_id) {
        onSignupComplete(data.user.role, isSignupMode);
      } else {
        onLogin(data.user.role);
      }
    } catch (error: any) {
      console.error("Email Auth error:", error);
      setErrorMsg(error.message || "Authentication failed.");
      toast.error(error.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setErrorMsg("Please select a role first.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // ===== NATIVE ANDROID/iOS: Use Capacitor GoogleAuth plugin only =====
        try {
          const googleUser = await GoogleAuth.signIn();
          
          // Try to get Firebase credential for consistency
          try {
            const idToken = googleUser.authentication.idToken;
            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            await handleBackendAuth(result.user);
          } catch (firebaseErr) {
            // Firebase credential failed — send Google user data directly to backend
            console.log("Firebase credential skipped, syncing directly:", firebaseErr);
            const response = await apiClient.post("/api/auth/google", {
              email: googleUser.email,
              name: googleUser.name || googleUser.givenName || googleUser.email?.split('@')[0],
              firebase_uid: googleUser.id,
              role: selectedRole
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Backend sync failed");
            
            if (data.token) localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
            
            if (data.user?.hostel_id) {
              onLogin(data.user.role);
            } else {
              onSignupComplete(data.user.role, true);
            }
          }
        } catch (nativeError: any) {
          console.error("Native Google Auth failed:", nativeError);
          throw new Error("Google Sign-In failed. Please ensure Google Play Services is available and try again.");
        }
      } else {
        // ===== WEB: Use Firebase popup, fallback to redirect =====
        try {
          const result = await signInWithPopup(auth, googleProvider);
          await handleBackendAuth(result.user);
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked') {
            toast.warning("Popup blocked — trying redirect...");
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error("Google Login error:", error);
      setErrorMsg(error.message || "Google Login failed");
      toast.error(error.message || "Google Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendAuth = async (firebaseUser: any) => {
    try {
      const response = await apiClient.post("/api/auth/google", { 
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebase_uid: firebaseUser.uid,
        role: selectedRole 
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to sync with backend");
      
      if (data.needsOnboarding) {
        // This case handles if the user exists in Firebase but not in Mongo and we need a role
        setFirebaseUser(firebaseUser);
        setIsSignupMode(true);
        toast.info("Please complete your profile registration.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user && data.user.hostel_id) {
        onLogin(data.user.role);
      } else {
        onSignupComplete(data.user.role, true);
      }
    } catch (error: any) {
      console.error("Backend Sync Error:", error);
      setErrorMsg("Failed to synchronize account: " + error.message);
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setErrorMsg("");
  };
  
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-black">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg overflow-hidden">
             <img src="/logo.jpg" alt="HostelConnect Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold mb-2">HostelConnect</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </motion.div>
        
        <div className="w-full max-w-sm space-y-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div key={role.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-none overflow-hidden" onClick={() => setSelectedRole(role.id)}>
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
  
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-black">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <button onClick={() => setSelectedRole(null)} className="text-[#1E88E5] mb-4 text-sm flex items-center gap-1 font-medium hover:underline">
          <span className="text-lg">←</span> Back to selection
        </button>
        
        <Card className="border-none shadow-xl bg-white">
          <div className={`h-2 bg-gradient-to-r ${currentRole.color}`} />
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-2 mx-auto shadow-md overflow-hidden border border-gray-100">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {currentRole.label} {isSignupMode ? "Signup" : "Login"}
            </CardTitle>
            <CardDescription>
              {isSignupMode ? "Create a new account" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 border-gray-200" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 border-gray-200" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {isSignupMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12 border-gray-200" required />
                  </div>
                </div>
              )}
              
              {errorMsg && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg font-medium">{errorMsg}</div>}
              
              <Button type="submit" disabled={isLoading} className={`w-full h-12 bg-gradient-to-r ${currentRole.color} text-white font-bold text-lg hover:shadow-lg transition-all`}>
                {isLoading ? "Processing..." : isSignupMode ? "Sign Up" : "Login"}
              </Button>

              <div className="text-center">
                <button type="button" onClick={toggleMode} className="text-sm text-blue-600 font-semibold hover:underline">
                  {isSignupMode ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                </button>
              </div>

              <div className="relative my-6 text-black">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-medium">Or continue with</span></div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-12 flex items-center justify-center gap-3 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold transition-all shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

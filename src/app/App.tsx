import { API_URL } from "./config/api.config";
import { useState, useEffect } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { RoleSelectionLogin } from "./components/RoleSelectionLogin";
import { AdminSetup } from "./components/AdminSetup";
import { CodeVerification } from "./components/CodeVerification";
import { StudentDashboard } from "./components/StudentDashboard";
import { RaiseComplaint } from "./components/RaiseComplaint";
import { TrackComplaints } from "./components/TrackComplaints";
import { WorkerDashboard } from "./components/WorkerDashboard";
import { ComplaintDetail } from "./components/ComplaintDetail";
import { AdminDashboard } from "./components/AdminDashboard";
import { AssignWorker } from "./components/AssignWorker";
import { Profile } from "./components/Profile";
import { Notices } from "./components/Notices";
import { AllComplaints } from "./components/AllComplaints";
import { RoomDetails } from "./components/RoomDetails";
import { HostelInfo } from "./components/HostelInfo";
import { ManageHostelInfo } from "./components/ManageHostelInfo";
import { BottomNav } from "./components/BottomNav";
import { StudentOnboardingForm } from "./components/StudentOnboardingForm";
import { Complaint } from "./components/ComplaintCard";
import { AdminAnalytics } from "./components/AdminAnalytics";
import { Notifications } from "./components/Notifications";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { auth } from "./config/firebase.config";
import { signOut } from "firebase/auth";

type Screen =
  | "splash"
  | "login"
  | "admin-setup"
  | "code-verification"
  | "dashboard"
  | "raise-complaint"
  | "track-complaints"
  | "complaint-detail"
  | "room-details"
  | "hostel-info"
  | "manage-hostel-info"
  | "all-complaints"
  | "assign-worker"
  | "analytics"
  | "notifications"
  | "notices"
  | "profile"
  | "student-onboarding"
  | "complaints-list"
  | "tasks";

type Role = "student" | "worker" | "admin";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeHostelId, setActiveHostelId] = useState<string | null>(null);

  const handleSplashComplete = () => {
    setCurrentScreen("login");
  };

  const handleLogin = (role: Role) => {
    setUserRole(role);
    setCurrentScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleSignupComplete = (role: Role, isFirstTime: boolean) => {
    setUserRole(role);

    if (role === "admin" && isFirstTime) {
      setCurrentScreen("admin-setup");
    } else if ((role === "student" || role === "worker") && isFirstTime) {
      setCurrentScreen("code-verification");
    } else {
      setCurrentScreen("dashboard");
      setActiveTab("dashboard");
    }
  };

  const handleAdminSetupComplete = () => {
    setCurrentScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleCodeVerified = async (hostelId: string) => {
    setActiveHostelId(hostelId);
    if (userRole === "student") {
      setCurrentScreen("student-onboarding");
    } else {
      // Register worker to MongoDB automatically
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await fetch(`${API_URL}/api/auth/complete-onboarding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: currentUser.displayName || currentUser.email?.split('@')[0] || "Worker",
              email: currentUser.email || "",
              phone: currentUser.phoneNumber || "",
              firebase_uid: currentUser.uid,
              role: "worker",
              hostel_id: hostelId,
            })
          });
        }
      } catch (err) {
        console.error("Worker registration error", err);
      }
      setCurrentScreen("dashboard");
      setActiveTab("dashboard");
    }
  };

  const handleBackToLogin = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore signout errors
    }
    setCurrentScreen("login");
    setUserRole(null);
    setActiveHostelId(null);
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
    if (screen === 'analytics') {
      setActiveTab('analytics');
    }
  };

  const handleComplaintClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setCurrentScreen("complaint-detail");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    if (tab === "dashboard") {
      setCurrentScreen("dashboard");
    } else if (tab === "complaints") {
      if (userRole === "student") {
        setCurrentScreen("track-complaints");
      } else if (userRole === "worker" || userRole === "admin") {
        setCurrentScreen("complaints-list");
        setActiveTab("complaints");
      }
    } else if (tab === "tasks" || tab === "analytics") {
      setCurrentScreen(tab as Screen);
    } else if (tab === "notices") {
      setCurrentScreen("notices");
    } else if (tab === "profile") {
      setCurrentScreen("profile");
    }
  };

  const handleBackToDashboard = () => {
    setCurrentScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleComplaintSubmit = () => {
    toast.success("Complaint submitted successfully!");
    setCurrentScreen("track-complaints");
    setActiveTab("complaints");
  };

  const handleWorkerAssign = (workerId: string) => {
    toast.success("Worker assigned successfully!");
    setCurrentScreen("dashboard");
    setActiveTab("dashboard");
  };

  const showBottomNav = currentScreen !== "splash" && currentScreen !== "login";

  return (
    <div className="relative min-h-screen bg-[#F5F7FA]">
      {/* Mobile container */}
      <div className="max-w-[480px] mx-auto bg-white min-h-screen relative">
        {currentScreen === "splash" && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}

        {currentScreen === "login" && (
          <RoleSelectionLogin
            onLogin={handleLogin}
            onSignupComplete={handleSignupComplete}
          />
        )}

        {currentScreen === "admin-setup" && (
          <AdminSetup onComplete={handleAdminSetupComplete} />
        )}

        {currentScreen === "code-verification" && userRole && (
          <CodeVerification
            role={userRole as "student" | "worker"}
            onVerified={handleCodeVerified}
            onBack={handleBackToLogin}
          />
        )}

        {currentScreen === "student-onboarding" && userRole === "student" && activeHostelId && (
          <StudentOnboardingForm
            hostelId={activeHostelId}
            onComplete={() => {
              setCurrentScreen("dashboard");
              setActiveTab("dashboard");
            }}
          />
        )}

        {currentScreen === "dashboard" && userRole === "student" && (
          <StudentDashboard onNavigate={handleNavigate} onLogout={handleBackToLogin} onNotifications={() => setCurrentScreen("notifications")} />
        )}

        {currentScreen === "dashboard" && userRole === "worker" && (
          <WorkerDashboard
            onComplaintClick={handleComplaintClick}
            onNavigate={handleNavigate}
            onLogout={handleBackToLogin}
            onNotifications={() => setCurrentScreen("notifications")}
            defaultTab="queue"
          />
        )}

        {currentScreen === "tasks" && userRole === "worker" && (
          <WorkerDashboard
            onComplaintClick={handleComplaintClick}
            onNavigate={handleNavigate}
            onLogout={handleBackToLogin}
            onNotifications={() => setCurrentScreen("notifications")}
            defaultTab="active"
          />
        )}

        {currentScreen === "dashboard" && userRole === "admin" && (
          <AdminDashboard
            onNavigate={handleNavigate}
            onComplaintClick={handleComplaintClick}
            onLogout={handleBackToLogin}
            onNotifications={() => setCurrentScreen("notifications")}
          />
        )}

        {currentScreen === "raise-complaint" && (
          <RaiseComplaint
            onBack={handleBackToDashboard}
            onSubmit={handleComplaintSubmit}
          />
        )}

        {currentScreen === "track-complaints" && (
          <TrackComplaints
            onBack={handleBackToDashboard}
            onComplaintClick={handleComplaintClick}
          />
        )}

        {currentScreen === "complaint-detail" && selectedComplaint && userRole && (
          <ComplaintDetail
            complaint={selectedComplaint}
            onBack={() => {
              if (userRole === "admin") {
                setCurrentScreen("dashboard");
              } else {
                setCurrentScreen("track-complaints");
              }
            }}
            userRole={userRole}
          />
        )}

        {currentScreen === "assign-worker" && selectedComplaint && (
          <AssignWorker
            complaint={selectedComplaint}
            onBack={handleBackToDashboard}
            onAssign={handleWorkerAssign}
          />
        )}

        {currentScreen === "profile" && userRole && (
          <Profile onBack={handleBackToDashboard} onLogout={handleBackToLogin} userRole={userRole} />
        )}

        {currentScreen === "room-details" && (
          <RoomDetails
            onBack={handleBackToDashboard}
            onNavigateToComplaints={() => setCurrentScreen("raise-complaint")}
          />
        )}

        {currentScreen === "hostel-info" && (
          <HostelInfo onBack={handleBackToDashboard} />
        )}

        {currentScreen === "manage-hostel-info" && (
          <ManageHostelInfo onBack={handleBackToDashboard} />
        )}

        {currentScreen === "notices" && (
          <Notices onBack={handleBackToDashboard} />
        )}

        {currentScreen === "analytics" && (
          <AdminAnalytics onBack={handleBackToDashboard} />
        )}

        {currentScreen === "notifications" && userRole && (
          <Notifications onBack={handleBackToDashboard} userRole={userRole} />
        )}

        {currentScreen === "complaints-list" && userRole && (userRole === "worker" || userRole === "admin") && (
          <AllComplaints
            onBack={() => { setCurrentScreen("dashboard"); setActiveTab("dashboard"); }}
            onComplaintClick={handleComplaintClick}
            userRole={userRole as "worker" | "admin"}
          />
        )}

        {showBottomNav && userRole && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            role={userRole}
          />
        )}
      </div>

      <Toaster position="top-center" />
    </div>
  );
}

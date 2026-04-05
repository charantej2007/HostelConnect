import { Home, FileText, CheckSquare, Bell, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: "student" | "worker" | "admin";
}

export function BottomNav({ activeTab, onTabChange, role }: BottomNavProps) {
  const getNavItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "complaints", label: "Complaints", icon: FileText },
    ];
    
    if (role === "worker") {
      return [
        ...baseItems,
        { id: "tasks", label: "Tasks", icon: CheckSquare },
        { id: "profile", label: "Profile", icon: User },
      ];
    }
    
    if (role === "admin") {
      return [
        ...baseItems,
        { id: "analytics", label: "Analytics", icon: CheckSquare },
        { id: "profile", label: "Profile", icon: User },
      ];
    }
    
    // Student
    return [
      ...baseItems,
      { id: "notices", label: "Notices", icon: Bell },
      { id: "profile", label: "Profile", icon: User },
    ];
  };
  
  const navItems = getNavItems();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-[#1E88E5]" : "text-gray-500"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-[#1E88E5]" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

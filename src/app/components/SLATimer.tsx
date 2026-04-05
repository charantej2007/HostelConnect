import { Clock } from "lucide-react";
import { Badge } from "./ui/badge";

interface SLATimerProps {
  remainingTime: number; // in minutes
  totalTime: number; // in minutes
}

export function SLATimer({ remainingTime, totalTime }: SLATimerProps) {
  const percentage = (remainingTime / totalTime) * 100;
  
  let statusColor = "bg-[#43A047]"; // Green
  let badgeVariant: "default" | "secondary" | "destructive" = "default";
  let textColor = "text-[#43A047]";
  
  if (percentage <= 0) {
    statusColor = "bg-[#E53935]"; // Red - SLA breach
    badgeVariant = "destructive";
    textColor = "text-[#E53935]";
  } else if (percentage <= 25) {
    statusColor = "bg-[#FB8C00]"; // Orange - nearing deadline
    badgeVariant = "secondary";
    textColor = "text-[#FB8C00]";
  }
  
  const hours = Math.floor(Math.abs(remainingTime) / 60);
  const minutes = Math.abs(remainingTime) % 60;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${textColor}`} />
          <span className={`text-sm ${textColor}`}>
            {remainingTime < 0 ? "Overdue: " : ""}
            {hours}h {minutes}m
          </span>
        </div>
        <Badge variant={badgeVariant} className="text-xs">
          {remainingTime < 0 ? "SLA Breach" : percentage <= 25 ? "Urgent" : "On Track"}
        </Badge>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColor} transition-all duration-300`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

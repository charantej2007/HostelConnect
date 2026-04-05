import { motion } from "motion/react";
import { Building2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1E88E5] to-[#26A69A]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => setTimeout(onComplete, 2000)}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center flex flex-col items-center"
      >
        <div className="w-24 h-24 mb-6 rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
          <img src="/logo.jpg" alt="HostelConnect Logo" className="w-full h-full object-cover" />
        </div>
        
        <h1 className="text-4xl text-white mb-2">HostelConnect</h1>
        <p className="text-lg text-white/90">Smart Hostel Management</p>
        
        <motion.div
          className="mt-12 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

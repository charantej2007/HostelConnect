import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Paperclip, X, Send, Loader2 } from "lucide-react";
import { storage, auth } from "../config/firebase.config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { API_URL } from "../config/api.config";
import { toast } from "sonner";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostelId: string;
}

export function AnnouncementModal({ isOpen, onClose, hostelId }: AnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [pinned, setPinned] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      const adminRes = await fetch(`${API_URL}/api/auth/user/${uid}`);
      const adminData = await adminRes.json();
      const adminId = adminData.user._id;

      // 1. Upload files to Firebase Storage
      const attachmentUrls: string[] = [];
      for (const file of files) {
        const fileRef = ref(storage, `announcements/${hostelId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        attachmentUrls.push(url);
      }

      // 2. Save announcement to MongoDB
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          hostel_id: hostelId,
          title,
          description,
          priority,
          pinned,
          attachments: attachmentUrls
        })
      });

      if (res.ok) {
        toast.success("Announcement sent successfully!");
        setTitle("");
        setDescription("");
        setFiles([]);
        setPriority("medium");
        setPinned(false);
        onClose();
      } else {
        throw new Error("Failed to save announcement");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while sending the announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-[#1E88E5]" />
            New Announcement
          </DialogTitle>
          <DialogDescription>
            Post an update or notice for the students of your hostel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              placeholder="Enter announcement title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              placeholder="What's the message for the students?" 
              className="min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox 
                id="pinned" 
                checked={pinned} 
                onCheckedChange={(checked) => setPinned(checked as boolean)}
              />
              <Label htmlFor="pinned" className="font-normal cursor-pointer">Pin to top</Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Attachments (Documents/Images)</Label>
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm border">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                <Paperclip className="w-4 h-4" />
                Add File
                <input type="file" className="hidden" multiple onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button 
            className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white min-w-[120px]" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post Announcement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

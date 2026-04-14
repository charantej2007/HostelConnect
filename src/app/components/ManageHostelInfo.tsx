import { ArrowLeft, Plus, Building2, Pencil, Trash2, Phone, MessageCircle, User } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { auth } from "../config/firebase.config";
import { apiClient } from "../utils/apiClient";

interface ManageHostelInfoProps {
  onBack: () => void;
}

interface HostelBlock {
  id: string;
  blockName: string;
  wardenName: string;
  mobile: string;
  whatsappLink: string;
  facilities: string[];
}

const availableFacilities = ["Wi-Fi", "Mess", "Gym", "Library", "24/7 Security", "CCTV", "Common Room", "Study Room"];

export function ManageHostelInfo({ onBack }: ManageHostelInfoProps) {
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [institutionName, setInstitutionName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        // Fetch hostel details via session
        const response = await apiClient.get('/api/auth/me');
        if (!response.ok) return;
        const data = await response.json();
        const hostel = data.user?.hostel_id;
        
        if (hostel) {
          setInstitutionName(hostel.institution_name || "");
          setNewName(hostel.institution_name || "");
          setBlocks(hostel.blocks || []);
        }
      } catch (error) {
        toast.error("Network error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHostelData();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<HostelBlock | null>(null);
  const [formData, setFormData] = useState({
    blockName: "",
    wardenName: "",
    mobile: "",
    whatsappLink: "",
    facilities: [] as string[],
  });

  const handleAddNew = () => {
    setEditingBlock(null);
    setFormData({
      blockName: "",
      wardenName: "",
      mobile: "",
      whatsappLink: "",
      facilities: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (block: HostelBlock) => {
    setEditingBlock(block);
    setFormData({
      blockName: block.blockName,
      wardenName: block.wardenName,
      mobile: block.mobile,
      whatsappLink: block.whatsappLink,
      facilities: [...block.facilities],
    });
    setIsDialogOpen(true);
  };

  const saveBlocksToServer = async (updatedBlocks: HostelBlock[]) => {
    try {
      const response = await apiClient.put(`/api/hostels/admin/current/blocks`, { 
        blocks: updatedBlocks 
      });
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to save to database");
        return false;
      }
      return true;
    } catch (error) {
      toast.error("Network error");
      return false;
    }
  };

  const handleDelete = async (blockId: string) => {
    const updatedBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(updatedBlocks); // Optimistic UI update
    const success = await saveBlocksToServer(updatedBlocks);
    if(success) toast.success("Block deleted successfully");
  };

  const handleSave = async () => {
    if (!formData.blockName || !formData.wardenName || !formData.mobile) {
      toast.error("Please fill in all required fields");
      return;
    }

    let updatedBlocks;
    if (editingBlock) {
      updatedBlocks = blocks.map(b =>
        b.id === editingBlock.id
          ? { ...editingBlock, ...formData }
          : b
      );
    } else {
      const newBlock: HostelBlock = {
        id: `block-${Date.now()}`,
        ...formData,
      };
      updatedBlocks = [...blocks, newBlock];
    }

    setBlocks(updatedBlocks); // Optimistic Update
    setIsDialogOpen(false);
    
    const success = await saveBlocksToServer(updatedBlocks);
    if(success) {
      toast.success(editingBlock ? "Block updated successfully" : "Block added successfully");
    }
  };

  const toggleFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error("Institution name cannot be empty");
      return;
    }

    try {
      const response = await apiClient.put(`/api/hostels/admin/current/name`, { 
        institution_name: newName 
      });

      if (response.ok) {
        setInstitutionName(newName);
        setIsEditingName(false);
        toast.success("Institution name updated!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update name");
      }
    } catch (error) {
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
          <h1 className="text-2xl">Manage Hostel Info</h1>
        </div>
        <p className="text-sm opacity-90 ml-13">Add or edit block information</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Institution Name Section */}
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Institution Name</Label>
              {!isEditingName && (
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-[#1E88E5] text-sm flex items-center gap-1 hover:underline"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            
            {isEditingName ? (
              <div className="space-y-3">
                <Input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter institution name"
                  className="h-10"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveName}
                    className="flex-1 h-9 bg-[#1E88E5] text-white text-sm"
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName(institutionName);
                    }}
                    className="flex-1 h-9 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-gray-800">{institutionName || "Loading..."}</h2>
            )}
          </div>
        </Card>

        {/* Add New Button */}
        <Button
          onClick={handleAddNew}
          className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Block
        </Button>

        {/* Blocks List */}
        {blocks.map((block) => (
          <Card key={block.id} className="border-none shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#1E88E5] to-[#26A69A]" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-[#1E88E5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-[#1E88E5]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1E88E5]">{block.blockName}</h3>
                    <p className="text-sm text-gray-600">{block.wardenName}</p>
                    <p className="text-xs text-gray-500">{block.mobile}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(block)}
                    className="w-8 h-8 bg-[#26A69A]/10 rounded-lg flex items-center justify-center"
                  >
                    <Pencil className="w-4 h-4 text-[#26A69A]" />
                  </button>
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="w-8 h-8 bg-[#E53935]/10 rounded-lg flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-[#E53935]" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {block.facilities.map((facility, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-[#1E88E5]/10 text-[#1E88E5] text-xs rounded-full"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? "Edit Block" : "Add New Block"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingBlock ? "Edit the details of the block." : "Enter details for the new block."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockName">Block Name *</Label>
              <Input
                id="blockName"
                placeholder="e.g., Block A"
                value={formData.blockName}
                onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wardenName">Warden Name *</Label>
              <Input
                id="wardenName"
                placeholder="e.g., Dr. Rajesh Kumar"
                value={formData.wardenName}
                onChange={(e) => setFormData({ ...formData, wardenName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                placeholder="e.g., +91 98765 43210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Group Link</Label>
              <Input
                id="whatsapp"
                placeholder="https://chat.whatsapp.com/..."
                value={formData.whatsappLink}
                onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Facilities</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {availableFacilities.map((facility) => (
                  <div key={facility} className="flex items-center space-x-2">
                    <Checkbox
                      id={facility}
                      checked={formData.facilities.includes(facility)}
                      onCheckedChange={() => toggleFacility(facility)}
                    />
                    <label
                      htmlFor={facility}
                      className="text-sm cursor-pointer"
                    >
                      {facility}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white"
            >
              {editingBlock ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

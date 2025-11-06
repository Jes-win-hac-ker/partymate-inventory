import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Search, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageModal } from "@/components/ui/image-modal";

export function UpdateStock() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [quantityChange, setQuantityChange] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; imageUrl: string; title: string }>({
    isOpen: false,
    imageUrl: "",
    title: "",
  });

  const handleSearch = async () => {
    try {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .or(`part_id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(1)
        .single();

      if (error) throw new Error("Part not found");

      setSelectedPart(data);
    } catch (error: any) {
      toast.error(error.message || "Part not found");
      setSelectedPart(null);
    }
  };

  const handleUpdate = async (operation: "add" | "subtract") => {
    if (!selectedPart || !quantityChange) return;

    setLoading(true);
    try {
      const change = parseInt(quantityChange, 10);
      if (!Number.isInteger(change) || change <= 0) {
        toast.error("Please enter a valid positive integer for quantity change");
        return;
      }

      const newQuantity =
        operation === "add"
          ? selectedPart.quantity + change
          : Math.max(0, selectedPart.quantity - change);

      const { error } = await supabase
        .from("spare_parts")
        .update({ quantity: newQuantity })
        .eq("id", selectedPart.id);

      if (error) throw error;

      toast.success(`Stock updated successfully! New quantity: ${newQuantity}`);
      setSelectedPart({ ...selectedPart, quantity: newQuantity });
      setQuantityChange("");
    } catch (error: any) {
      toast.error(error.message || "Error updating stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Stock</CardTitle>
          <CardDescription>Search for a part and update its quantity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by Part ID or Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {selectedPart && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-4">
                {selectedPart.image_url && (
                  <img
                    src={selectedPart.image_url}
                    alt={selectedPart.name}
                    className="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setImageModal({
                      isOpen: true,
                      imageUrl: selectedPart.image_url,
                      title: `${selectedPart.name} (${selectedPart.part_id})`,
                    })}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedPart.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedPart.part_id}</p>
                  <p className="text-sm text-muted-foreground">Price: ₹{selectedPart.price}</p>
                  <p className={`text-sm font-medium mt-2 ${selectedPart.quantity < 5 ? "text-warning" : ""}`}>
                    Current Quantity: {selectedPart.quantity}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Change</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleUpdate("add")}
                  disabled={loading || !quantityChange}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Stock
                </Button>
                <Button
                  onClick={() => handleUpdate("subtract")}
                  disabled={loading || !quantityChange}
                  variant="secondary"
                  className="gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Remove Stock
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({ isOpen: false, imageUrl: "", title: "" })}
        imageUrl={imageModal.imageUrl}
        title={imageModal.title}
      />
    </div>
  );
}

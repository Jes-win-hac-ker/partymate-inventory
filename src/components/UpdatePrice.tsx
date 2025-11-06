import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UpdatePrice() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(false);

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
      setNewPrice(data.price.toString());
    } catch (error: any) {
      toast.error(error.message || "Part not found");
      setSelectedPart(null);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPart || !newPrice) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("spare_parts")
        .update({ price: parseFloat(newPrice) })
        .eq("id", selectedPart.id);

      if (error) throw error;

      toast.success("Price updated successfully!");
      setSelectedPart({ ...selectedPart, price: parseFloat(newPrice) });
    } catch (error: any) {
      toast.error(error.message || "Error updating price");
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
          <CardTitle>Update Price</CardTitle>
          <CardDescription>Search for a part and update its price</CardDescription>
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
                    className="h-20 w-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedPart.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedPart.part_id}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {selectedPart.quantity}</p>
                  <p className="text-sm font-medium mt-2">
                    Current Price: ${selectedPart.price}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">New Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter new price"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>

              <Button
                onClick={handleUpdate}
                disabled={loading || !newPrice}
                className="w-full"
              >
                {loading ? "Updating..." : "Update Price"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

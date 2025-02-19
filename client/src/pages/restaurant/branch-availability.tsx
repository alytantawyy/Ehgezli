import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BranchAvailabilityPage() {
  const { restaurant } = useRestaurantAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string>();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!restaurant) {
      setLocation('/auth');
      return;
    }
  }, [restaurant, setLocation]);

  const { data: restaurantData, isLoading: isRestaurantLoading } = useQuery({
    queryKey: ["/api/restaurants", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) throw new Error("No restaurant ID");
      const response = await fetch(`/api/restaurants/${restaurant.id}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      return response.json();
    },
    enabled: !!restaurant?.id,
  });

  // Fetch existing unavailable dates for the selected branch
  const { data: unavailableDates, isLoading: isLoadingDates } = useQuery({
    queryKey: ["/api/restaurant/branches", selectedBranchId, "unavailable-dates"],
    queryFn: async () => {
      const response = await fetch(`/api/restaurant/branches/${selectedBranchId}/unavailable-dates`);
      if (!response.ok) throw new Error('Failed to fetch unavailable dates');
      const data = await response.json();
      return data.map((date: string) => new Date(date));
    },
    enabled: !!selectedBranchId,
  });

  const saveDatesMutation = useMutation({
    mutationFn: async (dates: { branchId: number, dates: string[] }) => {
      const response = await fetch(`/api/restaurant/branches/${dates.branchId}/unavailable-dates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dates: dates.dates }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save unavailable dates');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/branches", selectedBranchId, "unavailable-dates"] });
      toast({
        title: "Dates Updated",
        description: "The branch availability has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveDates = () => {
    if (!selectedBranchId || selectedDates.length === 0) return;

    saveDatesMutation.mutate({
      branchId: parseInt(selectedBranchId),
      dates: selectedDates.map(date => date.toISOString().split('T')[0])
    });
  };

  if (!restaurant) {
    return null;
  }

  if (isRestaurantLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/restaurant/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Branch Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Branch</label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {restaurantData?.locations?.map((location: any) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Unavailable Dates</label>
              <div className="border rounded-lg p-4">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates as any}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                  defaultMonth={new Date()}
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveDates}
              disabled={!selectedBranchId || selectedDates.length === 0 || saveDatesMutation.isPending || isLoadingDates}
              className="w-full"
            >
              {saveDatesMutation.isPending ? "Saving..." : "Save Unavailable Dates"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
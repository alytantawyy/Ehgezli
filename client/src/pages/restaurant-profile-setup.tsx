import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { restaurantProfileSchema, type InsertRestaurantProfile, Restaurant } from "@shared/schema";
import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const CUISINE_TYPES = [
  "Italian",
  "Chinese",
  "Japanese",
  "Indian",
  "Mexican",
  "French",
  "Thai",
  "Mediterranean",
  "American",
  "Middle Eastern",
];

export default function RestaurantProfileSetup() {
  const { restaurant } = useRestaurantAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch existing restaurant data if we're in edit mode
  const { data: existingRestaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) throw new Error("No restaurant ID");
      const response = await fetch(`/api/restaurants/${restaurant.id}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      const data = await response.json();
      console.log("Fetched restaurant data:", data);
      return data;
    },
    enabled: !!restaurant?.id,
  });

  const form = useForm<InsertRestaurantProfile>({
    resolver: zodResolver(restaurantProfileSchema),
    defaultValues: {
      restaurantId: restaurant?.id,
      about: "",
      cuisine: "",
      priceRange: "$",
      logo: "",
      branches: [
        {
          address: "",
          city: "Alexandria",
          tablesCount: 1,
          seatsCount: 1,
          openingTime: "09:00",
          closingTime: "22:00",
        },
      ],
    },
  });

  // Load existing data into form when available
  useEffect(() => {
    if (existingRestaurant) {
      console.log("Setting form data with:", existingRestaurant);

      // Get the profile data
      const getProfileData = async () => {
        try {
          const response = await fetch(`/api/restaurant/profile/${existingRestaurant.id}`);
          if (!response.ok) {
            console.error("Error fetching profile data:", response.status);
            return null;
          }
          const data = await response.json();
          console.log("Fetched profile data:", data);
          return data;
        } catch (error) {
          console.error("Error fetching profile data:", error);
          return null;
        }
      };

      const loadProfileData = async () => {
        const profile = await getProfileData();

        // Map the locations to branches, ensuring all required data is present
        const branches = existingRestaurant.locations.map(location => {
          console.log("Processing location for form:", {
            address: location.address,
            city: location.city,
            tablesCount: location.tablesCount,
            seatsCount: location.seatsCount
          });

          return {
            address: location.address,
            city: location.city as "Alexandria" | "Cairo",  // Ensure we use the exact city value
            tablesCount: location.tablesCount,
            seatsCount: location.seatsCount,
            openingTime: location.openingTime,
            closingTime: location.closingTime,
          };
        });

        console.log("Mapped branches data:", branches);

        form.reset({
          restaurantId: existingRestaurant.id,
          about: existingRestaurant.about || "",
          cuisine: existingRestaurant.cuisine,
          priceRange: profile?.priceRange || "$",
          logo: existingRestaurant.logo || "",
          branches,
        });

        if (existingRestaurant.logo) {
          setLogoPreview(existingRestaurant.logo);
        }
      };

      loadProfileData();
    }
  }, [existingRestaurant, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue("logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const profileMutation = useMutation({
    mutationFn: async (data: InsertRestaurantProfile) => {
      const res = await apiRequest("PUT", "/api/restaurant/profile", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/profile-status", restaurant?.id] });
      toast({
        title: existingRestaurant ? "Profile Updated!" : "Profile Setup Complete!",
        description: existingRestaurant
          ? "Your restaurant profile has been updated successfully."
          : "Your restaurant profile has been created successfully.",
      });
      setLocation(`/restaurant/dashboard`);
    },
    onError: (error: Error) => {
      toast({
        title: existingRestaurant ? "Update Failed" : "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addBranch = () => {
    const currentBranches = form.getValues("branches");
    form.setValue("branches", [
      ...currentBranches,
      {
        address: "",
        city: "Alexandria",
        tablesCount: 1,
        seatsCount: 1,
        openingTime: "09:00",
        closingTime: "22:00",
      },
    ]);
  };

  const removeBranch = (index: number) => {
    const currentBranches = form.getValues("branches");
    form.setValue(
      "branches",
      currentBranches.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {existingRestaurant ? "Edit Restaurant Profile" : "Complete Your Restaurant Profile"}
          </h1>
          {!existingRestaurant && <Progress value={33} className="w-full" />}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => profileMutation.mutate(data))}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Restaurant Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {logoPreview ? (
                            <div className="relative w-32 h-32">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2"
                                onClick={() => {
                                  setLogoPreview(null);
                                  onChange("");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                              <label
                                htmlFor="logo-upload"
                                className="cursor-pointer text-center p-4"
                              >
                                <Upload className="h-6 w-6 mx-auto mb-2" />
                                <span className="text-sm text-muted-foreground">
                                  Upload Logo
                                </span>
                                <input
                                  id="logo-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleLogoChange}
                                  {...field}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a square logo image (recommended size: 200x200px)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Your Restaurant</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tell us about your restaurant..."
                          className="min-h-[150px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 50 words allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cuisine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuisine Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cuisine type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CUISINE_TYPES.map((cuisine) => (
                            <SelectItem key={cuisine} value={cuisine}>
                              {cuisine}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Range</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select price range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="$">$ (Budget)</SelectItem>
                          <SelectItem value="$$">$$ (Moderate)</SelectItem>
                          <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
                          <SelectItem value="$$$$">$$$$ (Luxury)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Branch Locations</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBranch}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.watch("branches").map((_, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        Branch {index + 1}
                      </h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBranch(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`branches.${index}.address`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Branch address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`branches.${index}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Alexandria">Alexandria</SelectItem>
                              <SelectItem value="Cairo">Cairo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`branches.${index}.tablesCount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Tables</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`branches.${index}.seatsCount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Seats</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`branches.${index}.openingTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`branches.${index}.closingTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Closing Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={profileMutation.isPending}
            >
              {profileMutation.isPending ? "Saving..." : (existingRestaurant ? "Save Changes" : "Save & Continue")}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
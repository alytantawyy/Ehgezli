import { RestaurantGrid } from "@/components/restaurant-grid";
import { SearchBar } from "@/components/SearchBar";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Users, CalendarIcon, Star, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { generateTimeSlots } from "@/utils/time-slots";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const CUISINES = [
  "American",
  "Egyptian",
  "Italian",
  "Japanese",
  "Chinese",
  "Indian",
  "Mexican",
  "French",
  "Thai",
  "Mediterranean",
  "Middle Eastern"
];

const PRICE_RANGES = [
  { value: "$", label: "$" },
  { value: "$$", label: "$$" },
  { value: "$$$", label: "$$$" },
  { value: "$$$$", label: "$$$$" }
];

export default function HomePage() {
  console.log("[HomePage] rendering");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>(""); 
  const [partySize, setPartySize] = useState(2);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const { data: timeSlots } = useQuery({
    queryKey: ["/api/default-time-slots"],
    queryFn: async () => {
      const response = await fetch("/api/default-time-slots");
      if (!response.ok) return ["19:00"]; 
      return response.json();
    },
  });

  // Handle setting the default time when time slots are loaded
  useEffect(() => {
    console.log("[HomePage] timeSlots loaded:", timeSlots);
    console.log("[HomePage] current time value:", time);
    
    if (timeSlots && timeSlots.length > 0) {
      // Always set a default time if time slots are available
      if (!time) {
        const defaultTime = timeSlots.length >= 3 ? timeSlots[1] : timeSlots[0];
        console.log("[HomePage] setting default time to:", defaultTime);
        setTime(defaultTime);
      }
    }
  }, [timeSlots, time]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', {
      city: selectedCity,
      cuisine: selectedCuisine,
      priceRange: selectedPriceRange
    });
    
    queryClient.invalidateQueries({
      queryKey: ['restaurants']
    });
    
    setIsDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCuisine(undefined);
    setSelectedPriceRange(undefined);
    setSelectedCity(undefined);
  };

  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['restaurants', { date, time, partySize, city: selectedCity, cuisine: selectedCuisine, priceRange: selectedPriceRange, showSavedOnly }],
    queryFn: async () => {
      console.log('CLIENT: Fetching restaurants with params:', {
        date,
        time,
        partySize,
        city: selectedCity,
        cuisine: selectedCuisine,
        priceRange: selectedPriceRange,
        showSavedOnly
      });

      const params = new URLSearchParams();
      if (date) params.set('date', format(date, 'yyyy-MM-dd'));
      if (time) params.set('time', time);
      if (partySize) params.set('partySize', partySize.toString());
      if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedCuisine && selectedCuisine !== 'all') params.set('cuisine', selectedCuisine);
      if (selectedPriceRange && selectedPriceRange !== 'all') params.set('priceRange', selectedPriceRange);
      if (showSavedOnly) params.set('showSavedOnly', 'true');

      const endpoint = date && time 
        ? '/api/restaurants/availability'
        : '/api/restaurants';

      console.log('CLIENT: Calling endpoint:', endpoint);
      const response = await fetch(`${endpoint}?${params}`);
      
      if (!response.ok) {
        console.error('CLIENT: Error fetching restaurants:', await response.text());
        throw new Error('Failed to fetch restaurants');
      }
      
      const data = await response.json();
      console.log('CLIENT: Received response:', data);
      return data;
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/logout", { 
          method: "POST",
          credentials: 'include' 
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Logout failed:", errorText);
          throw new Error("Failed to logout");
        }
        
        // Check if response is JSON or not
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        }
        
        return { success: true };
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate user query to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Redirect to home page or login page
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Logout mutation error:", error);
      // You could add a toast notification here
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* start */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left side: Logo */}
          <div className="flex items-center gap-4">
            <a href="/" onClick={() => window.location.reload()}>
              <img
                src="/Ehgezli-logo.png"
                alt="Ehgezli Logo"
                className="h-16 w-auto object-contain"
              />
            </a>
          </div>

          {/* Right side: User Avatar or other controls */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ehgezli" className="h-10 w-10 rounded-full bg-primary">
                  <span className="text-white font-semibold">
                    {user.firstName.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium leading-none">Hello, {user.firstName}!</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1.5">
                    {user.email}
                  </p>
                </div>

                <DropdownMenuItem asChild>
                  <Link to="/bookings">My Bookings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => mutate()}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Search Controls - Using flex with justify-center */}
          <div className="flex justify-center">
            <div className="flex flex-col md:flex-row gap-4 items-end w-full max-w-5xl">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Time Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {time ? format(new Date(`2000-01-01T${time}:00`), "h:mm a") : <span>Select time</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <ScrollArea className="h-80">
                    <div className="grid grid-cols-1 gap-1 p-2">
                      {generateTimeSlots(date).map((slot) => (
                        <Button
                          key={slot.value}
                          variant={time === slot.value ? "default" : "ghost"}
                          className="justify-start font-normal"
                          onClick={() => {
                            setTime(slot.value);
                          }}
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* Party Size Selector */}
              <Select
                value={partySize.toString()}
                onValueChange={(value) => setPartySize(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-auto">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="People" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              {/* Search Bar */}
              <div className="w-full md:flex-1 md:max-w-[400px]">
                <SearchBar onSearch={handleSearch} />
              </div>

              {/* Filters Button */}
              <div className="flex gap-2">
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ehgezli" className="gap-2">
                      <FilterIcon className="h-4 w-4" />
                      Filters
                      {(selectedCity || selectedCuisine || selectedPriceRange) && (
                        <span className="ml-2 h-4 w-4 rounded-full bg-primary text-[0.6rem] text-primary-foreground inline-flex items-center justify-center">
                          {[selectedCity, selectedCuisine, selectedPriceRange].filter(Boolean).length}
                        </span>
                      )}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                      <DrawerHeader>
                        <DrawerTitle>Filters</DrawerTitle>
                        <DrawerDescription>
                          Filter restaurants by location, cuisine and price range
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">City</label>
                          <Select
                            value={selectedCity}
                            onValueChange={setSelectedCity}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Cities</SelectItem>
                              <SelectItem value="Alexandria">Alexandria</SelectItem>
                              <SelectItem value="Cairo">Cairo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cuisine</label>
                          <Select
                            value={selectedCuisine}
                            onValueChange={setSelectedCuisine}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select cuisine" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Cuisines</SelectItem>
                              {CUISINES.map((cuisine) => (
                                <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Price Range</label>
                          <Select
                            value={selectedPriceRange}
                            onValueChange={setSelectedPriceRange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select price range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Prices</SelectItem>
                              {PRICE_RANGES.map((range) => (
                                <SelectItem key={range.value} value={range.value}>
                                  {range.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DrawerFooter>
                        <Button onClick={handleApplyFilters}>Apply Filters</Button>
                        <DrawerClose asChild>
                          <Button variant="outline" onClick={handleClearFilters}>
                            Clear Filters
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>
                <Button
                  variant="ehgezli"
                  size="icon"
                  className={cn(showSavedOnly && "bg-primary/90 text-primary-foreground hover:bg-primary/80")}
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  title={showSavedOnly ? "Show all restaurants" : "Show saved restaurants only"}
                >
                  <Star className="h-4 w-4" fill={showSavedOnly ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCity || selectedCuisine || selectedPriceRange) && (
            <div className="flex flex-wrap gap-2 items-center justify-center border-b pb-6">
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              {selectedCity && selectedCity !== 'all' && (
                <span className="text-sm bg-secondary px-2 py-1 rounded-md">
                  {selectedCity}
                </span>
              )}
              {selectedCuisine && selectedCuisine !== 'all' && (
                <span className="text-sm bg-secondary px-2 py-1 rounded-md">
                  {selectedCuisine}
                </span>
              )}
              {selectedPriceRange && selectedPriceRange !== 'all' && (
                <span className="text-sm bg-secondary px-2 py-1 rounded-md">
                  {selectedPriceRange}
                </span>
              )}
            </div>
          )}

          {/* Section Title */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Available Restaurants</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Showing available restaurants for {format(date, "MMM d")} at {time ? 
                (console.log("[HomePage] Rendering time in title:", time, new Date(`2000-01-01T${time}:00`)),
                format(new Date(`2000-01-01T${time}:00`), "h:mm a")) : 
                "selected time"}
            </p>
          </div>

          {/* Restaurant Grid */}
          <div className="mt-8">
            <RestaurantGrid
              searchQuery={searchQuery}
              cityFilter={selectedCity === 'all' ? undefined : selectedCity}
              cuisineFilter={selectedCuisine === 'all' ? undefined : selectedCuisine}
              priceFilter={selectedPriceRange === 'all' ? undefined : selectedPriceRange}
              date={date}
              time={time}
              partySize={partySize}
              showSavedOnly={showSavedOnly}
            />
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p> 2024 Ehgezli. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
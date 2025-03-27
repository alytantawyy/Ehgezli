import { RestaurantGrid } from "@/components/restaurant-grid";
import { UserNav } from "@/components/user-nav";
import { SearchBar } from "@/components/SearchBar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Users, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { generateTimeSlots } from "@/utils/time-slots";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [partySize, setPartySize] = useState(2);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = () => {
    setIsDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCuisine(undefined);
    setSelectedPriceRange(undefined);
    setSelectedCity(undefined);
  };

  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['restaurants', { date, time, partySize, city: selectedCity, cuisine: selectedCuisine, priceRange: selectedPriceRange }],
    queryFn: async () => {
      console.log('CLIENT: Fetching restaurants with params:', {
        date,
        time,
        partySize,
        city: selectedCity,
        cuisine: selectedCuisine,
        priceRange: selectedPriceRange
      });

      const params = new URLSearchParams();
      if (date) params.set('date', format(date, 'yyyy-MM-dd'));
      if (time) params.set('time', time);
      if (partySize) params.set('partySize', partySize.toString());
      if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedCuisine && selectedCuisine !== 'all') params.set('cuisine', selectedCuisine);
      if (selectedPriceRange && selectedPriceRange !== 'all') params.set('priceRange', selectedPriceRange);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
          {user && (
            <div className="text-sm text-muted-foreground">
              Hey, {user.firstName}!
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            {/* Date Picker */}
            <div className="w-full md:w-[200px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="w-full md:w-[150px]">
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Time">
                    {time ? format(parseISO(`2000-01-01T${time}`), "h:mm a") : "Time"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="h-[300px]">
                  <ScrollArea className="h-[300px]">
                    {generateTimeSlots(date).map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Party Size */}
            <div className="w-full md:w-[150px]">
              <div className="flex items-center border rounded-md px-3 py-2">
                <Users className="h-4 w-4 opacity-50 mr-2" />
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 2)}
                  className="border-0 p-0 focus-visible:ring-0"
                  placeholder="Guests"
                />
              </div>
            </div>

            {/* Existing Search Bar - now with flex-1 to take remaining space */}
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Existing Filters Button */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="gap-2">
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
          </div>

          {date && time ? (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing available restaurants for {format(date, "PPP")} at {format(parseISO(`2000-01-01T${time}`), "h:mm a")} for {partySize} {partySize === 1 ? "person" : "people"}
              </p>
            </div>
          ) : null}

          <div className="mb-8">
            <h3 className="text-2xl font-semibold">
              {selectedCity && selectedCity !== 'all'
                ? `Restaurants in ${selectedCity}${selectedCuisine && selectedCuisine !== 'all' ? ` - ${selectedCuisine} Cuisine` : ''}`
                : selectedCuisine && selectedCuisine !== 'all'
                  ? `${selectedCuisine} Restaurants`
                  : 'Available Restaurants'
              }
            </h3>
          </div>

          <RestaurantGrid
            searchQuery={searchQuery}
            cityFilter={selectedCity === 'all' ? undefined : selectedCity}
            cuisineFilter={selectedCuisine === 'all' ? undefined : selectedCuisine}
            priceFilter={selectedPriceRange === 'all' ? undefined : selectedPriceRange}
            date={date}
            time={time}
            partySize={partySize}
          />
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
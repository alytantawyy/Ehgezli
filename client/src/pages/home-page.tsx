import { RestaurantGrid } from "@/components/restaurant-grid";
import { UserNav } from "@/components/user-nav";
import { SearchBar } from "@/components/SearchBar";
import { useState } from "react";
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

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = () => {
    setIsDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCity(undefined);
    setSelectedCuisine(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserNav />
            <h1 className="text-2xl font-bold text-primary">
              Ehgezli
            </h1>
          </div>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FilterIcon className="h-4 w-4" />
                Filters
                {(selectedCity || selectedCuisine) && (
                  <span className="ml-2 h-4 w-4 rounded-full bg-primary text-[0.6rem] text-primary-foreground inline-flex items-center justify-center">
                    {[selectedCity, selectedCuisine].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                  <DrawerDescription>
                    Apply filters to find the perfect restaurant
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex gap-4 items-center justify-center mb-4">
            <SearchBar onSearch={handleSearch} placeholder="Search by name, cuisine, or location..." />
          </div>
        </div>

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
        />
      </main>

      <footer className="mt-16 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Ehgezli. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
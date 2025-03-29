import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceTime?: number;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Restaurant, Location, or Cuisine",
  debounceTime = 300 
}: SearchBarProps) {
  console.log("[SearchBar] rendering");
  const [query, setQuery] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle debounced search
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to trigger search after debounce time
    debounceTimerRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceTime);
    
    // Cleanup function to clear timer if component unmounts or query changes again
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, onSearch, debounceTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on explicit submit
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // The useEffect will handle the debounced search
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="flex-1"
      />
      {/* <Button type="submit" size="icon" variant="ehgezli">
        <Search className="h-4 w-4" />
      </Button> */}
    </form>
  );
}
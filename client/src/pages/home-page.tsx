import { RestaurantGrid } from "@/components/restaurant-grid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 text-transparent bg-clip-text">
            Ehgezli
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-400 text-transparent bg-clip-text">
            Find Your Perfect Table
          </h2>
          <p className="text-lg text-muted-foreground">
            Discover and book tables at the finest restaurants in your area.
            Experience exceptional dining with just a few clicks.
          </p>
        </div>

        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-2xl font-semibold">Available Restaurants</h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Filter
            </Button>
            <Button variant="secondary" size="sm">
              Sort
            </Button>
          </div>
        </div>

        <RestaurantGrid />
      </main>

      <footer className="mt-16 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Ehgezli. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

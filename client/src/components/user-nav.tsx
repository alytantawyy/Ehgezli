import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function UserNav() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/bookings">My Bookings</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
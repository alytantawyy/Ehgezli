import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertRestaurantAuthSchema } from "@shared/schema";
import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function RestaurantAuthForm() {
  const { restaurant, isProfileComplete, isLoading, loginMutation, registerMutation } = useRestaurantAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  // Track auth state changes
  useEffect(() => {
    if (!isLoading && restaurant) {
      if (isProfileComplete) {
        setLocation("/restaurant/dashboard");
      } else {
        setLocation("/restaurant/profile-setup");
      }
    }
  }, [restaurant, isProfileComplete, isLoading, setLocation]);

  const loginForm = useForm({
    resolver: zodResolver(insertRestaurantAuthSchema.pick({ email: true, password: true })),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertRestaurantAuthSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleRegisterSubmit = async (data: any) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    }
  };

  const handleLoginSubmit = async (data: any) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
            className="space-y-4"
          >
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="register">
        <Form {...registerForm}>
          <form
            onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
            className="space-y-4"
          >
            <FormField
              control={registerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating Account..." : "Register"}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
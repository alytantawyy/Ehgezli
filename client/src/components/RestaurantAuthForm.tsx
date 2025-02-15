import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { restaurantLoginSchema, insertRestaurantAuthSchema } from "@shared/schema";
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

export default function RestaurantAuthForm() {
  const { restaurant, isProfileComplete, isLoading, loginMutation, registerMutation } = useRestaurantAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm({
    resolver: zodResolver(restaurantLoginSchema),
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

  useEffect(() => {
    if (!isLoading && restaurant) {
      // Check if profile is complete to determine where to redirect
      if (isProfileComplete) {
        setLocation("/restaurant/dashboard");
      } else {
        setLocation("/restaurant/profile-setup");
      }
    }
  }, [restaurant, isProfileComplete, isLoading, setLocation]);

  const handleRegisterSubmit = async (data: any) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      console.error('Registration error:', error);
      // The form will display the error message through the mutation state
    }
  };

  const handleLoginSubmit = async (data: any) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error('Login error:', error);
      // The form will display the error message through the mutation state
    }
  };

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
            {loginMutation.error && (
              <p className="text-sm text-red-500 mt-2">
                {loginMutation.error.message}
              </p>
            )}
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
            {registerMutation.error && (
              <p className="text-sm text-red-500 mt-2">
                {registerMutation.error.message}
              </p>
            )}
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
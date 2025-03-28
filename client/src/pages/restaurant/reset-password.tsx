import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { restaurantPasswordResetSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function RestaurantResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const form = useForm({
    resolver: zodResolver(restaurantPasswordResetSchema),
    defaultValues: {
      token: token || "",
      password: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      return apiRequest<{ message: string }>("POST", "/api/restaurant/reset-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="container max-w-md py-8">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/auth")} className="w-full">
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container max-w-md py-8">
        <Card>
          <CardHeader>
            <CardTitle>Reset Restaurant Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => resetPasswordMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
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
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? "Resetting password..."
                    : "Reset password"}
                </Button>
                <div className="text-center mt-2">
                  <a
                    href="/auth"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Back to login
                  </a>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

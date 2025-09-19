import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User as UserIcon, Edit, Save, X } from "lucide-react";
import { updateProfileSchema, UpdateProfile, User } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: userData, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      profileImageUrl: userData?.profileImageUrl || "",
    },
  });

  // Reset form when userData changes
  React.useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        profileImageUrl: userData.profileImageUrl || "",
      });
    }
  }, [userData, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await apiRequest("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset({
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      profileImageUrl: userData?.profileImageUrl || "",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account settings and personal information</p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Personal Information</CardTitle>
                  <CardDescription>Your basic account information</CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    data-testid="button-edit-profile"
                    className="w-full sm:w-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={userData?.profileImageUrl} alt="Profile" />
                    <AvatarFallback className="text-sm sm:text-lg">
                      {getInitials(userData?.firstName, userData?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-medium" data-testid="text-display-name">
                      {(userData?.firstName || userData?.lastName) 
                        ? `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim()
                        : userData?.fullName || 'User'
                      }
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base" data-testid="text-email">
                      {userData?.email}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter first name" 
                                  {...field} 
                                  data-testid="input-first-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter last name" 
                                  {...field} 
                                  data-testid="input-last-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="profileImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                {...field} 
                                data-testid="input-profile-image"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                          data-testid="button-save-profile"
                          className="w-full sm:w-auto"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          data-testid="button-cancel-edit"
                          className="w-full sm:w-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                      <p className="text-foreground mt-1" data-testid="text-first-name">
                        {userData?.firstName || "Not set"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                      <p className="text-foreground mt-1" data-testid="text-last-name">
                        {userData?.lastName || "Not set"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-foreground mt-1" data-testid="text-user-email">
                        {userData?.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Account Balance</Label>
                  <p className="text-2xl font-bold text-primary mt-1" data-testid="text-account-balance">
                    ${userData?.balance || '0.00'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                  <p className="text-foreground mt-1" data-testid="text-member-since">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
"use client";

import * as z from "zod";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import UserFormModal from "@/components/organizations/UserFormModal";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";

const formSchema = z.object({
  // model-aligned fields
  name: z.string().min(2, "Organization name is required"),
  description: z.string().max(500, "Max 500 characters").optional().or(z.literal("")),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  size: z.number().min(1, "Size must be at least 1"),
  status: z.enum(["active", "inactive"]),
  // keep the name as logoUrl but it uploads a File
  logoUrl: z.any().optional(), // File | null; validated client-side
});

type FormValues = z.infer<typeof formSchema>;
// Helper function to get auth token
const getAuthToken = () => {
  // Check for token in localStorage, sessionStorage, or cookies
  const token = 
    localStorage.getItem('token') || 
    sessionStorage.getItem('token') || 
    document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  
  return token;
};

export default function OrganizationForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const[isLoading, setIsLoading] = useState(false);
  const [userFormData, setUserFormData] = useState<{name:string,email:string,password:string}|null>(null);
  const [orgFormData, setOrgFormData] = useState<FormValues|null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      industry: "",
      size: 0,
      status: "active",
      logoUrl: null,
    },
  });
const handleOpenUserModal = async () => {
  const isValid=await form.trigger();
  if(!isValid) return;
  setOrgFormData(form.getValues());
  setIsUserModalOpen(true);
}
const handleUserSubmit = async (userData:{name:string,email:string,password:string}) => {
  if(!orgFormData) return;
  return handleSubmit(orgFormData,userData);
}
const handleSubmit = async (values: FormValues,userData:{name:string,email:string,password:string}) => {
    // You likely have a multipart endpoint for file uploads.
    // For now we'll prepare FormData (works whether you have file or not).
    setIsLoading(true);
    setUserFormData(userData);
   
    try {
      const authToken = getAuthToken();
      
      // Prepare headers for user request (JSON)
      const userHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      };
      const userPayload={
        fullName:userData.name,
        email:userData.email,
        password:userData.password,
        role:"admin",
        isActive:true,
      }

      // Step 1: Create user first
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: userHeaders,
        credentials: "include",
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        const userError = await userResponse.json();
        throw new Error(`User creation failed: ${userError.message || userResponse.statusText}`);
      }

      const createdUser = await userResponse.json();
      const userId = createdUser.data?._id || createdUser._id || createdUser.id;

      if (!userId) {
        throw new Error("User created but user ID not returned from server");
      }

     // Step 2: Create organization with the user as owner
const orgFormDataToSend = new FormData();

// Always append required fields
orgFormDataToSend.append("name", values.name);
orgFormDataToSend.append("owner", userId);

// Handle optional fields with proper validation
if (values.description && values.description.trim() !== "") {
  orgFormDataToSend.append("description", values.description);
}
if (values.email && values.email.trim() !== "") {
  orgFormDataToSend.append("email", values.email);
}
if (values.phone && values.phone.trim() !== "") {
  orgFormDataToSend.append("phone", values.phone);
}
if (values.address && values.address.trim() !== "") {
  orgFormDataToSend.append("address", values.address);
}
if (values.website && values.website.trim() !== "") {
  orgFormDataToSend.append("website", values.website);
}
if (values.industry && values.industry.trim() !== "") {
  orgFormDataToSend.append("industry", values.industry);
}
if (values.size && values.size > 0) {
  orgFormDataToSend.append("size", String(values.size));
}
if (values.status) {
  orgFormDataToSend.append("status", values.status);
}

// Handle logo file
if (values.logoUrl && values.logoUrl instanceof File) {
  orgFormDataToSend.append("logo", values.logoUrl);
}
// Prepare headers for organization request (FormData - don't set Content-Type)
const orgHeaders: HeadersInit = {
  ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
};

const orgResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
  method: "POST",
  headers: orgHeaders,
  credentials: "include",
  body: orgFormDataToSend, // Use the new FormData variable
})
      if (!orgResponse.ok) {
        const orgError = await orgResponse.json();
        // If organization creation fails, you might want to delete the created user
        // or handle this case according to your business logic
        throw new Error(`Organization creation failed: ${orgError.message || orgResponse.statusText}`);
      }
      const createdOrg=await orgResponse.json();
      const orgId = createdOrg.data?._id || createdOrg._id || createdOrg.id;

      // Step 3: Update user with organization ID (optional, based on your business logic)
      if (orgId) {
        const updateUserResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
          method: "PUT",
          headers: userHeaders,
          credentials: "include",
          body: JSON.stringify({
            organization: orgId,
            role: 'admin' // Ensure the owner has admin role
          }),
        });

        // Log if update fails but don't throw error as main creation succeeded
        if (!updateUserResponse.ok) {
          console.warn("Failed to update user with organization ID, but user and organization were created successfully");
        }
      }

      toast.success("Organization and user created successfully");
      onOpenChange(false);
      router.push("/organizations");

    } catch (error) {
      console.error("Submission error:", error);
      
      // Show specific error messages
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          toast.error("Connection error. Please check if the server is running and configured properly.");
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          toast.error("Authentication required. Please log in again.");
        } else if (error.message.includes('token')) {
          toast.error("Authentication token missing. Please log in again.");
        } else {
          toast.error(error.message || "Failed to create organization");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
   
  };

  const handlePick = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    form.setValue("logoUrl", file, { shouldDirty: true });
  };

  const clearLogo = () => {
    setPreview(null);
    form.setValue("logoUrl", null, { shouldDirty: true });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* FULL SCREEN bottom drawer */}
      <DrawerContent
        className="
          fixed inset-0 z-50 m-0 border-0 bg-background rounded-none
          h-[100dvh] max-h-[100dvh] 
          flex flex-col
        "
      >
        {/* Header */}
        <DrawerHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl">Add Organization</DrawerTitle>
              <DrawerDescription>Add a new organization to your account</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-6 py-6">
            <Form {...form}>
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ============ LEFT SECTION ============ */}
                  <div className="space-y-6">
                    {/* Logo uploader */}
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={() => (
                        <FormItem>
                          <FormLabel>Organization Logo</FormLabel>
                          <div className="flex items-center gap-4">
                            <div className="group relative size-28 border rounded-xl bg-muted/20 overflow-hidden flex items-center justify-center">
                              {/* Placeholder or Image */}
                              {preview ? (
                                <Image
                                  src={preview}
                                  alt="Organization logo preview"
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-xs">
                                  <Upload className="mb-1 h-5 w-5" />
                                  <span>Upload Logo</span>
                                </div>
                              )}

                              {/* Hover actions */}
                              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-2 bg-black/40">
                                <Button type="button" size="icon" variant="secondary" onClick={handlePick} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {preview && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    onClick={clearLogo}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                              <Button type="button" variant="outline" onClick={handlePick}>
                                {preview ? "Change Logo" : "Upload Logo"}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                PNG/JPG/SVG. Recommended square image.
                              </p>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea rows={4} placeholder="Organization description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* ============ RIGHT SECTION ============ */}
                  <div className="space-y-6">
                    {/* Address */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Website */}
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Industry */}
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. HR Tech, Healthcare, Retail..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Size */}
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Size</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Number of employees"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Footer (sticky on mobile if needed) */}
        <div className="shrink-0 border-t px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-end gap-2">
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  router.back();
                }}
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleOpenUserModal}>Create Organization</Button>
          </div>
        </div>
        <UserFormModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSubmit={handleUserSubmit} isLoading={isLoading} />
      </DrawerContent>
    </Drawer>
  );
}

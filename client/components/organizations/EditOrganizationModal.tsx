"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Upload, X, Camera, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Organization {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  size?: number;
  status?: 'active' | 'inactive';
  logo?: string;
}

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onSave?: (data: Partial<Organization>) => void;
  isSettings?: boolean;
}

export default function EditBusinessModal({ 
  isOpen, 
  onClose, 
  organization, 
  onSave, 
  isSettings = false 
}: EditBusinessModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    size: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to get full logo URL
  const getLogoUrl = (logoPath: string | undefined) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
    return `${baseUrl}/${logoPath}`;
  };

  // Helper function to get the appropriate API endpoint
  const getApiEndpoint = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    if (isSettings) {
      return `${baseUrl}/organization-settings`;
    } else {
      return `${baseUrl}/organizations/${organization._id}`;
    }
  };

  useEffect(() => {
    if (organization && isOpen) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        website: organization.website || '',
        industry: organization.industry || '',
        size: organization.size?.toString() || '',
        status: organization.status || 'active'
      });
      setErrors({});
      setSelectedFile(null);
      setPreviewUrl(organization.logo ? getLogoUrl(organization.logo) : null);
    }
  }, [organization, isOpen]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Please select a valid image file' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'File size must be less than 5MB' }));
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, logo: '' }));
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (including http:// or https://)';
    }

    if (formData.size && (isNaN(Number(formData.size)) || Number(formData.size) < 1)) {
      newErrors.size = 'Company size must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
          if (key === 'size') {
            formDataToSend.append(key, value ? Number(value).toString() : '');
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      if (selectedFile) {
        formDataToSend.append('logo', selectedFile);
      }

      const apiEndpoint = getApiEndpoint();
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update organization');
      }

      const result = await response.json();
      
      if (onSave) {
        await onSave(result.data);
      }
      router.refresh();
      onClose();
      toast.success("Organization updated successfully");
      
    } catch (error) {
      console.error('Error updating organization:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: error instanceof Error ? error.message : 'Failed to update organization' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: organization?.name || '',
      description: organization?.description || '',
      email: organization?.email || '',
      phone: organization?.phone || '',
      address: organization?.address || '',
      website: organization?.website || '',
      industry: organization?.industry || '',
      size: organization?.size?.toString() || '',
      status: organization?.status || 'active'
    });
    setErrors({});
    setSelectedFile(null);
    setPreviewUrl(organization?.logo ? getLogoUrl(organization.logo) : null);
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {isSettings ? 'Organization Settings' : 'Edit Organization'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {isSettings 
                  ? 'Update your organization information and settings.'
                  : 'Update the organization information and settings.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Logo Upload Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Organization Logo
              </Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-blue-400 transition-colors">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Logo preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {previewUrl ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-600 mt-2">
                    PNG, JPG up to 5MB. Recommended: 200x200px
                  </p>
                  {errors.logo && (
                    <p className="text-sm text-red-500 mt-1">{errors.logo}</p>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter organization name"
                    className={`mt-1 ${errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} h-9`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="business@example.com"
                    className={`mt-1 ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} h-9`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`mt-1 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} h-9`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className={`mt-1 ${errors.website ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} h-9`}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500 mt-1">{errors.website}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="mt-1 h-9 focus:border-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Business address"
                    className="mt-1 focus:border-blue-500 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                    Industry
                  </Label>
                  <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="e.g., HR Tech, Healthcare, Finance"
              />

                </div>

                <div>
                  <Label htmlFor="size" className="text-sm font-medium text-gray-700">
                    Company Size
                  </Label>
                  <Input
                    id="size"
                    type="number"
                    min="1"
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="Number of employees"
                    className={`mt-1 ${errors.size ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} h-9`}
                  />
                  {errors.size && (
                    <p className="text-sm text-red-500 mt-1">{errors.size}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your organization"
                    rows={3}
                    className="mt-1 resize-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 500 characters ({formData.description.length}/500)
                  </p>
                </div>
              </div>
            </div>
          </form>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t flex-shrink-0">
          <div className="flex justify-end space-x-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-6 h-9 min-w-[100px] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
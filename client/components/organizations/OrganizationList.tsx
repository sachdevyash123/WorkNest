"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Organization {
  _id: string;
  name: string;
  email?: string;
  createdAt: string;
  status?: "Active" | "Inactive";
  owner?: {
    fullName: string;
    email: string;
  };
  members?: Array<{
    user: {
      fullName: string;
      email: string;
      role: string;
    };
  }>;
}

export default function OrganizationList({
  initialData,
}: {
  initialData: Organization[];
}) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredOrgs = initialData.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.email?.toLowerCase().includes(search.toLowerCase()) ||
    org.owner?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getStatusVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default";
      case "inactive":
        return "destructive";
      default:
        return "default";
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage and view all organizations ({initialData.length} total)
          </p>
        </div>
        <Button onClick={() => router.push("/organizations/create")} className="cursor-pointer">
          Add Organization
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Results count */}
      {search && (
        <div className="text-sm text-muted-foreground">
          Found {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''} matching "{search}"
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <TableRow key={org._id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.owner ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">
                                {org.owner.fullName}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{org.owner.fullName}</p>
                            <p className="text-xs text-muted-foreground">{org.owner.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {org.email ? (
                      <span className="text-sm">{org.email}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                      {org.members?.length || 0} member{(org.members?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(org.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(org.status)}
                      className="capitalize"
                    >
                      {org.status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/organizations/${org._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View organization details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-lg font-medium">No organizations found</p>
                    <p className="text-sm">
                      {search ? `No organizations match "${search}"` : "Get started by creating your first organization"}
                    </p>
                    {!search && (
                      <Button
                        onClick={() => router.push("/organizations/create")}
                        className="mt-4"
                      >
                        Create Organization
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer info */}
      {filteredOrgs.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Showing {filteredOrgs.length} of {initialData.length} organizations
        </div>
      )}
    </div>
  );
}
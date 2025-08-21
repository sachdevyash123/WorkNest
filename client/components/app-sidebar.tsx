"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Command,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Settings,
  User2,
  Users,
  Crown,
  AlertTriangle,
  LogOut,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/hooks/useAuth"
import { useOrganization } from "@/lib/hooks/useOrganization"
// Navigation items for SuperAdmin
const superAdminNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
  },
]
// Navigation items for Admin, HR, Employee
const organizationNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organization Settings",
    url: "/organization-settings",
    icon: Building2,
  },
]
// Navigation items for Employee (minimal access)
const employeeNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isSuperAdmin,isAdminOrHR,isEmployee } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()
 // Determine which navigation items to show based on user role
 const getNavItems = () => {
  if (isSuperAdmin()) {
    return superAdminNavItems
  } else if (isEmployee()) {
    return employeeNavItems
  } else {
    // Admin and HR get organization navigation
    return organizationNavItems
  }
}
const navItems=getNavItems();
 // Update active state based on current pathname
 const navItemsWithActive = navItems.map(item => ({
  ...item,
  isActive: pathname.startsWith(item.url)
}))

const handleNavigation = (url: string) => {
  // Check if user has access to the route
  if (isEmployee() && (url.includes('organization') || url.includes('users'))) {
    // Redirect employee to dashboard if they try to access restricted routes
    router.push('/dashboard')
    return
  }
  router.push(url)
}

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Determine what to show in header based on user role
  const getHeaderInfo = () => {
    if (!user) {
      return {
        name: "Loading...",
        subtitle: "",
        icon: Command
      }
    }

    if (isSuperAdmin()) {
      return {
        name: user.fullName || user.firstName + ' ' + user.lastName || user.name || "Super Admin",
        subtitle: "Super Admin",
        icon: Crown
      }
    } else {
       // Show loading state while fetching organization
       if (orgLoading && user.organization || user.organizationId) {
        return {
          name: "Loading organization...",
          subtitle: user.role || "User",
          icon: Building2
        }
      }
      if (organization) {
        return {
          name: organization.name,
          subtitle: organization.industry || user.role || "User",
          icon: Building2
        }
      }
      // If user has organization ID but no organization data (possibly due to access error)
      if (user.organization || user.organizationId) {
        return {
          name: "Organization Access Error",
          subtitle: "Contact Administrator",
          icon: AlertTriangle
        }
      }
      return {
        name: user.fullName || user.firstName + ' ' + user.lastName || user.name || "User",
        subtitle:  user.role || "No Organization",
        icon: User2
      }
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <headerInfo.icon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {headerInfo.name}
                    </span>
                    <span className="truncate text-xs">
                      {headerInfo.subtitle}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                {isSuperAdmin() ? (
                  <>
                    <DropdownMenuItem>
                      <Crown />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Plus />
                      Manage Organizations
                    </DropdownMenuItem>
                  </>
                ) : !isEmployee() ? (
                  <>
                    <DropdownMenuItem>
                      <Building2 />
                      Organization Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Plus />
                      Manage Members
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <User2 />
                      My Profile
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isSuperAdmin() ? "Platform" : "Organization"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItemsWithActive.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={item.isActive}
                    tooltip={item.title}
                  >
                    <button 
                      onClick={() => handleNavigation(item.url)}
                      className="w-full text-left cursor-pointer"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side="right"
                      align="start"
                    >
                      <DropdownMenuItem>
                        <span>View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          {!isEmployee() && (
            <SidebarGroupAction title="Add Project">
              <Plus />
              <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.fullName || user?.firstName + ' ' + user?.lastName || user?.name || "User"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || "email@example.com"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg cursor-pointer"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={()=>router.push('/profile')}>
                  <User2 />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut/>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
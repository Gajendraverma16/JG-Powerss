// src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect } from "react";
import api from "../api";

const initialMenu = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/dashboard.svg"
          alt="Dashboard"
          className="w-5 h-5 transition-all [filter:invert(35%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
  },
  {
    label: "Shop Owners",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/leadicon.png"
          alt="leads"
          className="w-5 h-5 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
    children: [
      { label: "All Shop Owners", path: "/leads/all" },
      // { label: "Villages", path: "/allVillages" },
      // Dynamic lead statuses will be inserted here
    ],
     
  },
  {
    label: "Product",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/quotation.svg"
          alt="Quotation"
          className="w-6 h-6 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
    children: [
      { label: "All Product ", path: "/quotation/view" },
      { label: "Create New", path: "/quotation/create" },
      { label: "Create Product Categories", path: "/categories" },
    ],
  },
  {
    label: "Orders",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/Invoice.svg"
          alt="Invoice"
          className="w-5 h-5 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
    // children: [
    //   { label: "All Orders", path: "/Order/view" },
    //   { label: "New Orders", path: "/Order/new" },
    //   { label: "Return Orders", path: "/Order/return" },
    // ],
     children: [
      { label: "All Orders", path: "/Order/testorder" },
      //  { label: "Create Orders", path: "/Order/new" },
    ],
  },
  // {
  //   label: "Payment",
  //   path: "/payment",
  //   icon: (
  //     <div className="w-6 h-6 flex items-center justify-center">
  //       <img
  //         src="/payments.svg"
  //         alt="Payment"
  //         className="w-5 h-5 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
  //       />
  //     </div>
  //   ),
  // },
  // {
  //   label: "Customer Inquiry",
  //   path: "/customer-inquiry",
  //   icon: (
  //     <div className="w-6 h-6 flex items-center justify-center">
  //       <img
  //         src="/CustomerInquiry.png"
  //         alt="Customer Inquiry"
  //         className="w-4.5 h-4.5 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
  //       />
  //     </div>
  //   ),
  // },
   {
    label: "Create New",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/calendar-2.svg"
          alt="leads"
          className="w-5 h-5 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
    children: [
     { label: "Create Categories", path: "/settings/leads-settings" },   
       { label: "Create Branch", path: "/branch" }, 
        { label: "Create Route", path: "/routee" },      
       { label: "Create Area", path: "/area" },
       { label: "Create Village", path: "/village" },

    ],
     
  },
  {
    label: "Settings",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/setting-2.png"
          alt="settings"
          className="w-5 h-5 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
    children: [
      { label: "Roles", path: "/settings/roles" },
      { label: "Create New Member", path: "/settings/users" },
      { label: "Organization Info", path: "/settings/org" },
      { label: "Update Profile", path: "/settings/update-profile" },
      // { label: "Shop Owner Settings", path: "/settings/leads-settings" },
    ],
  },
  {
    label: "Log Out",
    path: "/logout",
    icon: (
      <div className="w-6 h-6 flex items-center justify-center">
        <img
          src="/logout.png"
          alt="logout"
          className="w-5 h-5 ml-1 transition-all [filter:invert(12%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(98%)_contrast(89%)] group-[.active]:brightness-0 group-[.active]:invert"
        />
      </div>
    ),
  },
];

function formatRoleName(roleName) {
  if (!roleName || typeof roleName !== "string") return roleName;
  return roleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobile }) {
  const { user, rolePermissions } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);
  const [profilePicError, setProfilePicError] = useState(false);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [sidebarMenu, setSidebarMenu] = useState(initialMenu);
  const [activeSection, setActiveSection] = useState(null);
  
  // Track window width for responsive design
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // console.log("user", user);
  // console.log("rolePermissions", rolePermissions);

  useEffect(() => {
    if (user?.profile_pic) {
      setProfilePicError(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchLeadStatuses = async () => {
      try {
        const response = await api.get("/showleadstatus");
        if (response.data.success) {
          setLeadStatuses(response.data.data);
          // logger.log("Fetched lead statuses:", response.data.data);
        }
      } catch (error) {
        console.error("Error fetching lead statuses:", error);
      }
    };

    fetchLeadStatuses();
  }, []);

 useEffect(() => {
    if (leadStatuses?.length > 0) {
      const updatedMenu = initialMenu.map((item) => {
        if (item.label === "Categories") {
          const dynamicChildren = leadStatuses.map((status) => ({
            label: status.status_name,
            path: `/leads/${status.status_id}/${encodeURIComponent(
              status.status_name
            )}`,
          }));
          // console.log(item.children);
          const staticChildren = item.children.filter(
            (child) => child.label === "All Shop Owners"
          );
          return {
            ...item,
            children: [...staticChildren, ...dynamicChildren],
          };
        }
        return item;
      });
      setSidebarMenu(updatedMenu);
    }
  }, [leadStatuses]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        isMobileMenuOpen &&
        !event.target.closest(".mobile-sidebar") &&
        !event.target.closest(".hamburger-button")
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  // Helper: Check if user has "view" permission for a module
  function hasViewPermission(moduleLabel) {
    if (rolePermissions === "ALL") return true;
    if (!Array.isArray(rolePermissions)) return false;
    // Only check for objects, skip string entries like "noBulkAssign"
    return rolePermissions.some(
      (perm) =>
        perm &&
        typeof perm === "object" &&
        perm.module === moduleLabel &&
        Array.isArray(perm.permissions) &&
        perm.permissions.includes("view")
    );
  }

  // Helper: Check if user has "create" permission for a module
  function hasCreatePermission(moduleLabel) {
    if (rolePermissions === "ALL") return true;
    if (!Array.isArray(rolePermissions)) return false;
    return rolePermissions.some(
      (perm) =>
        perm &&
        typeof perm === "object" &&
        perm.module === moduleLabel &&
        Array.isArray(perm.permissions) &&
        perm.permissions.includes("create")
    );
  }

  // Filter menu items based on role and permissions
  const items = sidebarMenu.reduce((acc, item) => {
    if (item.label === "Settings") {
      if (user.role === "admin") {
        acc.push(item);
      } else {
        const filteredChildren = item.children.filter(
          (sub) => sub.path === "/settings/update-profile"
        );
        if (filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren,
          });
        }
      }
    } else if (["Leads", "Quotation", "Product"].includes(item.label)) {
    // Only show if user has "view" permission for this module
    if (hasViewPermission(item.label)) {
      // For Quotation, filter 'Create New' child if no create permission
      if (item.label === "Quotation" && Array.isArray(item.children)) {
        const filteredChildren = item.children.filter(
          (child) =>
            child.label !== "Create New" || hasCreatePermission(item.label)
        );
        acc.push({ ...item, children: filteredChildren });
      } else {
        acc.push(item);
      }
    }
  } 
  // ✅ Always show Orders for everyone (including salesmen)
  else if (item.label === "Orders") {
    acc.push(item);
  } 
  // Default: show other menu items
  else {
    acc.push(item);
  }

  return acc;
}, []);

  // Role mapping for display
  const roleDisplayMap = {
    admin: "Administrator",
    user: "User",
    manager: "Manager",
    // etc.
  };
  const roleLabel =
    user && user.role
      ? formatRoleName(roleDisplayMap[user.role] || user.role)
      : "";

  // Compute displayName: prefer username, else email prefix
  let displayName = "";
  if (user) {
    if (user.username && user.username.trim() !== "") {
      displayName = user.username;
    } else if (user.email) {
      displayName = user.email.split("@")[0];
    }
  }

  // Hamburger button component for mobile
  const HamburgerButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="hamburger-button fixed top-5 right-8 z-50 md:hidden w-10 h-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-[160px] border border-[#F5EFE9] rounded-lg shadow-sm"
    >
      <span
        className={`block w-6 h-0.5 bg-[#242220] transition-all duration-300 ${
          isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
        }`}
      ></span>
      <span
        className={`block w-6 h-0.5 bg-[#242220] mt-1 transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-0" : ""
        }`}
      ></span>
      <span
        className={`block w-6 h-0.5 bg-[#242220] mt-1 transition-all duration-300 ${
          isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
        }`}
      ></span>
    </button>
  );

  // Mobile overlay when sidebar is open
  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
        isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    />
  );

  const handleCollapseToggle = () => {
    if (isMobile) {
      if (!isMobileMenuOpen) {
        setIsMobileMenuOpen(true);
        setIsMobileCollapsed(false); // Always expand on mobile when opening
      } else {
        setIsMobileCollapsed(!isMobileCollapsed);
      }
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Handle section expansion on mobile
  const handleSectionClick = (label) => {
    if (isMobile) {
      setActiveSection(activeSection === label ? null : label);
    }
  };

  return (
    <>
      {/* Hamburger button for mobile */}
      <HamburgerButton />

      {/* Mobile overlay */}
      <MobileOverlay />

      {/* Sidebar */}
      <nav
        className={`rounded-3xl mobile-sidebar bg-white/95 backdrop-blur-[160px] border-r border-[#F5EFE9] transition-all duration-300
          ${
            isMobile
              ? `fixed left-0 top-0 h-screen overflow-y-auto z-50 ${
                  isMobileMenuOpen
                    ? isMobileCollapsed
                      ? "w-[70px] translate-x-0"
                      : "w-[240px] translate-x-0"
                    : "-translate-x-full w-[240px]"
                }`
              : `relative z-10 min-h-screen flex-shrink-0 ${
                  isCollapsed ? "w-[80px]" : "w-[270px]"
                }`
          }
          ${windowWidth < 640 ? 'text-sm' : ''}`}
      >
        {/* Traffic lights (shown when expanded) */}
        {((!isCollapsed && !isMobile) || (!isMobileCollapsed && isMobile)) && (
          <div className="flex gap-2 p-6 ml-20">
            <img src="/JGPOWER.png" alt="logo" height={30} width={60} />
            {/* <h1 className="text-2xl font-bold text-[#ef7e1b]">JG POWERS</h1> */}
          </div>

        )}

        {/* User profile */}
        <div
          className={`px-4 py-4 ${
            (isCollapsed && !isMobile) || (isMobileCollapsed && isMobile)
              ? "px-4"
              : ""
          }`}
        >
          <div className="flex items-center gap-4">
            {user?.profile_pic && !profilePicError ? (
              <img
                src={user.profile_pic}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                onError={() => setProfilePicError(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#8CBFEC] overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src="/Avatar.png"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {((!isCollapsed && !isMobile) ||
              (!isMobileCollapsed && isMobile)) && (
              <div>
                <h3 className="text-[#241B1B] font-medium">
                  {displayName || "User"}
                </h3>
                <p className="text-[#241B1B]/50 text-sm">{roleLabel}</p>
              </div>
            )}
          </div>
          {((!isCollapsed && !isMobile) ||
            (!isMobileCollapsed && isMobile)) && (
            <div className="w-full flex items-center justify-center mt-4">
              <div
                className="w-full bg-gray-300"
                style={{
                  height: "1px",
                  clipPath:
                    "polygon(0% 50%, 20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%)",
                  maxHeight: "20px",
                }}
              />
            </div>
          )}
        </div>

        {/* Menu items */}
        <div
          className={`px-4 py-4 ${
            (isCollapsed && !isMobile) || (isMobileCollapsed && isMobile)
              ? "px-2"
              : ""
          }`}
        >
          {((!isCollapsed && !isMobile) ||
            (!isMobileCollapsed && isMobile)) && (
            <h4 className="text-[#242220]/40 text-xs font-medium mb-2 ml-5">
              MAIN MENU
            </h4>
          )}
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.label}>
                {/* Spacer above Settings */}
                {item.label === "Settings" &&
                  ((!isCollapsed && !isMobile) ||
                    (!isMobileCollapsed && isMobile)) && (
                    <div className="w-full flex items-center justify-center mt-2 mb-2">
                      <div
                        className="w-full bg-gray-300"
                        style={{
                          height: "1px",
                          clipPath:
                            "polygon(0% 50%, 20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%)",
                          maxHeight: "20px",
                        }}
                      />
                    </div>
                  )}

                {item.children &&
                ((!isCollapsed && !isMobile) ||
                  (!isMobileCollapsed && isMobile)) ? (
                  <details className="group" open>
                    <summary className="flex items-center px-5 py-4 text-[#242220] hover:bg-[#242220]/5 rounded-xl cursor-pointer transition-colors">
                      <span className="mr-3">{item.icon}</span>
                      <span className="text-base text-[#242220]">
                        {item.label}
                      </span>
                      <svg
                        className="ml-auto w-6 h-6 transition-transform group-open:rotate-180 [filter:invert(35%)_sepia(6%)_saturate(285%)_hue-rotate(353deg)_brightness(94%)_contrast(89%)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M6 9l6 6 6-6"
                        />
                      </svg>
                    </summary>
                    {/* Removed overflow-hidden so expanded items push sidebar height */}
                    <ul className="pl-4 relative overflow-hidden">
                      {item.children.map((sub) => (
                        <li key={sub.path} className="flex items-center">
                          <div className="flex-shrink-0 w-7 h-7 relative z-10">
                            <img
                              src="/Vector.svg"
                              alt="Back"
                              className="w-18 h-18 -mt-14 ml-1 [filter:invert(85%)_sepia(11%)_saturate(0%)_hue-rotate(175deg)_brightness(89%)_contrast(90%)]"
                            />
                          </div>
                          <NavLink
                            to={sub.path}
                            onClick={() =>
                              isMobile && setIsMobileMenuOpen(false)
                            }
                            className={({ isActive }) =>
                              `flex items-center px-5 py-4 text-sm -ml-1 rounded-xl transition-all flex-grow ${
                                isActive
                                  ? "bg-[#ef7e1b] text-white active shadow-[0_3px_6px_rgba(124,123,135,0.15),0_6px_10px_rgba(124,123,135,0.12),0_8px_12px_rgba(124,123,135,0.08)]"
                                  : "text-[#242220] hover:bg-[#242220]/5"
                              }`
                            }
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <div className="relative group">
                    <NavLink
                      to={
                        item.path ||
                        (item.children ? item.children[0].path : "#")
                      }
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center ${
                          (isCollapsed && !isMobile) ||
                          (isMobileCollapsed && isMobile)
                            ? "px-3 py-4 justify-center"
                            : "px-5 py-4"
                        } rounded-xl transition-all group ${
                          isActive
                            ? "bg-[#ef7e1b] text-white active shadow-[0_3px_6px_rgba(124,123,135,0.15),0_6px_10px_rgba(124,123,135,0.12),0_8px_12px_rgba(124,123,135,0.08)]"
                            : "text-[#242220] hover:bg-[#242220]/5"
                        }`
                      }
                    >
                      <span
                        className={
                          (isCollapsed && !isMobile) ||
                          (isMobileCollapsed && isMobile)
                            ? ""
                            : "mr-3"
                        }
                      >
                        {item.icon}
                      </span>
                      {((!isCollapsed && !isMobile) ||
                        (!isMobileCollapsed && isMobile)) && (
                        <span className="text-base">{item.label}</span>
                      )}
                    </NavLink>

                    {/* Tooltip for collapsed state */}
                    {((isCollapsed && !isMobile) ||
                      (isMobileCollapsed && isMobile)) && (
                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Collapse/Expand button */}
        <button
          onClick={handleCollapseToggle}
          className={`absolute -right-3 top-[102px] w-6 h-6 rounded-full flex items-center justify-center transform transition-transform hover:scale-110 ${
            (isCollapsed && !isMobile) || (isMobileCollapsed && isMobile)
              ? "rotate-180"
              : ""
          }`}
        >
          <img src="/Arrow.svg" alt="Back"  className="w-7 h-7 text-[#ef7e1b]" />
       {/* <img
  src="/right-arrow.png"
  alt="Back"
  className="w-10 h-6 p-1 bg-white border border-[#0e4053] rounded-full "
/> */}

        </button>
      </nav>
    </>
  );
}

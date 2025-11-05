import React, { useState, useEffect, useContext } from "react";
import { FiChevronDown } from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import { FiEdit } from "react-icons/fi";
import api from "../../api";
import Swal from "sweetalert2";
import dummyAvatar from "/dummyavatar.jpeg";
import { SidebarContext } from "../../components/Layout";


// Helper to format role names (capitalize, snake_case to space, capitalize after space)
export function formatRoleName(roleName) {
  if (!roleName || typeof roleName !== "string") return roleName;
  return roleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Define all modules and permissions to always show
const ALL_MODULES = ["Invoice", "Leads", "Quotation"];
const ALL_PERMISSIONS = ["view", "create", "edit", "delete"];

const RolesPermissions = () => {
  const { isCollapsed } = useContext(SidebarContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneno: "",
    address: "",
  });

  // State for active screen and role dropdown
  const [activeScreen, setActiveScreen] = useState("roles"); // 'roles' or 'permissions'
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // State for Add Role Modal
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: "",
    email: "",
    phoneno: "",
    password: "",
    address: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  // --- Permissions State ---
  const initialPermissions = {
    Leads: { view: true, create: true, edit: true, delete: false },
    Quotation: { view: true, create: true, edit: true, delete: false },
    Invoice: { view: true, create: true, edit: true, delete: false },
  };

  const [permissions, setPermissions] = useState(initialPermissions);
  const [moduleIdMap, setModuleIdMap] = useState({});
  const [modulesLoading, setModulesLoading] = useState(true);

  // Fetch module IDs on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await api.get("/getmodules");
        if (response.data.status === "true" || response.data.success) {
          // Map module name to id
          const idMap = {};
          response.data.data.forEach((mod) => {
            idMap[mod.name] = mod.id;
          });
          setModuleIdMap(idMap);
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        setModulesLoading(false);
      }
    };
    fetchModules();
  }, []);

  // Helper to transform API permissions response to UI state
  function transformPermissions(apiData) {
    const result = {};
    // Start with all modules and all permissions set to false
    ALL_MODULES.forEach((module) => {
      result[module] = {};
      ALL_PERMISSIONS.forEach((perm) => {
        result[module][perm] = false;
      });
    });
    // Overlay API response
    apiData.forEach(({ module, permissions }) => {
      if (!result[module]) {
        result[module] = {};
        ALL_PERMISSIONS.forEach((perm) => {
          result[module][perm] = false;
        });
      }
      // Filter out empty strings before setting permissions
      permissions.filter(Boolean).forEach((perm) => {
        result[module][perm] = true;
      });
    });
    return result;
  }

  // Fetch permissions when selectedRole changes (in permissions screen)
  useEffect(() => {
    if (!selectedRole || !selectedRole.id || activeScreen !== "permissions")
      return;
    setLoading(true);
    const fetchPermissions = async () => {
      try {
        const response = await api.get(
          `/role/${selectedRole.id}/module-permissions`
        );
        if (response.data.success) {
          setPermissions(transformPermissions(response.data.data));
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
    // eslint-disable-next-line
  }, [selectedRole, activeScreen]);

  const handlePermissionChange = async (module, permission) => {
    if (!selectedRole || !selectedRole.id) return;
    if (!moduleIdMap[module]) {
      Swal.fire({
        icon: "error",
        title: "Module ID Missing",
        text: `Module ID for '${module}' is missing. Cannot update permission.`,
        confirmButtonColor: "#DD6B55",
      });
      return;
    }
    const action = permissions[module][permission] ? "disable" : "enable";
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to ${action} the '${permission}' permission for the '${module}' module. This will reflect in 60 seconds and affect all users with this role.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0e4053",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    // Optimistically update UI
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: !prev[module][permission],
      },
    }));

    // Build the full permissions array reflecting the new toggle
    const newPermissions = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [permission]: !permissions[module][permission],
      },
    };
    const permissionsPayload = Object.entries(moduleIdMap).map(
      ([mod, module_id]) => {
        const perms = newPermissions[mod] || {};
        const arr = Object.keys(perms).filter((perm) => perms[perm]);
        return {
          module_id,
          permission_names: arr.length === 0 ? [""] : arr,
        };
      }
    );

    const loadingAlert = Swal.fire({
      title: "Updating Permission...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const response = await api.post(
        `/role/${selectedRole.id}/update-permissions`,
        { permissions: permissionsPayload }
      );
      await loadingAlert.close();
      if (response.data.success) {
        Swal.fire({
          icon: "info",
          title: "Permission Updated",
          text: `The '${permission}' permission for '${module}' has been ${
            action === "enable" ? "enabled" : "disabled"
          }.`,
          confirmButtonColor: "#0e4053",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(
          response.data.message || "Failed to update permission."
        );
      }
    } catch (err) {
      await loadingAlert.close();
      // Revert UI on error
      setPermissions((prev) => ({
        ...prev,
        [module]: {
          ...prev[module],
          [permission]: permissions[module][permission],
        },
      }));
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "An error occurred while updating permission.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) {
      Swal.fire({
        icon: "warning",
        title: "No Role Selected",
        text: "Please select a role before saving permissions.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    // Build the permissions array as required by the API
    const permissionsPayload = Object.entries(moduleIdMap).map(
      ([mod, module_id]) => {
        const perms = permissions[mod] || {};
        const arr = Object.keys(perms).filter((perm) => perms[perm]);
        return {
          module_id,
          permission_names: arr.length === 0 ? [""] : arr,
        };
      }
    );

    const loadingAlert = Swal.fire({
      title: "Saving Permissions...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.post(
        `/role/${selectedRole.id}/update-permissions`,
        { permissions: permissionsPayload }
      );
      await loadingAlert.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Permissions Saved!",
          text: `Permissions for ${selectedRole.name} have been updated successfully.`,
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error(response.data.message || "Failed to save permissions.");
      }
    } catch (err) {
      await loadingAlert.close();
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.message || "An error occurred while saving permissions.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };
  // --- End of Permissions State ---

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/roles");
        if (response.data.success) {
          setUsers([...response.data.data]);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (err) {
        console.error("Error fetching users" + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const resetForm = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setNewRoleData({
      name: "",
      email: "",
      phoneno: "",
      password: "",
      address: "",
      description: "",
      image: null,
    });
  };



  const handleCloseModal = () => {
    setIsAddRoleModalOpen(false);
    resetForm();
  };

  const toggleDropdown = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  const handleEdit = (role) => {
    setEditingUser(role);
    setFormData({
      role: formatRoleName(role.name),
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewRoleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      if (file) {
        setNewRoleData((prev) => ({ ...prev, image: file }));
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview); // Revoke old one
        }
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setNewRoleData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddRoleSubmit = async (e) => {
    e.preventDefault();

    // Only send the role name to /addroles
    const payload = {
      name: newRoleData.role,
    };

    try {
      // Show loading state
      const loadingAlert = Swal.fire({
        title: "Creating Role...",
        html: "<div style='color:#555;font-size:15px;margin-top:10px;'></div>",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // API call to create role
      const response = await api.post("/roles/addroles", payload);

      await loadingAlert.close();

      if (response.data.success || response.data.status) {
        // Optionally, you may want to update the roles list here if needed
        setIsAddRoleModalOpen(false);
        resetForm();

        await Swal.fire({
          icon: "success",
          title: "Role Created!",
          html: `Role "${newRoleData.role}" has been successfully created.<br><br><b>Note:</b> Roles cannot import/export CSVs.`,
          confirmButtonColor: "#0e4053",
        });
        window.location.reload();
      } else {
        throw new Error(response.data.message || "Failed to create role");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: err.message || "An error occurred while creating the role.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This cannot be undone. This will reflect in 60 seconds and affect all users with this role.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/roles/${id}`);
        if (response.data.success) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "User has been removed.",
            confirmButtonColor: "#0e4053",
          });
        } else {
          throw new Error("Server rejected delete");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.message,
          confirmButtonColor: "#DD6B55",
        });
      }
    }
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only send the 'name' field for update
      const formattedPayloadUpdate = { name: formData.role };
      const response = await api.post(
        `/roles/update/${editingUser.id}`,
        formattedPayloadUpdate
      );
      if (
        response.data.success ||
        response.data.status === true ||
        response.status === 200
      ) {
        // Update the users list with the edited user
        setUsers(
          users.map((user) =>
            user.id === editingUser.id ? { ...user, ...formData } : user
          )
        );
        setIsModalOpen(false);
        await Swal.fire({
          icon: "success",
          title: "User Updated",
          text: `User was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
        window.location.reload();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update user.",
          confirmButtonColor: "#DD6B55",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message,
        confirmButtonColor: "#DD6B55",
      });
    }
    setActiveDropdown(null);
  };

  const formatAddress = (address) => {
    try {
      const parsedAddress = JSON.parse(address);
      if (parsedAddress && typeof parsedAddress === "object") {
        const { blockUnitStreetName, city, state, country, pincode } =
          parsedAddress;
        return (
          <>
            <span className="font-bold">{blockUnitStreetName}</span>
            <br />
            {city}, {state}, {country}
            <br />
            {pincode}, {country}
          </>
        );
      }
    } catch (e) {
      // Not a JSON string, treat as plain text
    }
    return address;
  };

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
    className={`min-h-[440px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full   ${
        isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
      } md:mx-auto`}
      >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 ">
        {/* Title */}
        <div className="flex gap-6 mb-2 md:mb-0">
          <button
            onClick={() => setActiveScreen("roles")}
            className="focus:outline-none"
          >
            <h2
              className={`text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap pb-1 ${
                activeScreen === "roles"
                  ? "border-b-2 border-[#0e4053]"
                  : "border-b-2 border-transparent"
              }`}
            >
              Roles
            </h2>
          </button>
          <button
            onClick={() => setActiveScreen("permissions")}
            className="focus:outline-none"
          >
            <h2
              className={`text-[20px] md:text-[22px] invisible font-medium text-[#1F2837] whitespace-nowrap pb-1 ${
                activeScreen === "permissions"
                  ? "border-b-2 border-[#0e4053]"
                  : "border-b-2 border-transparent"
              }`}
            >
              Permissions
            </h2>
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {activeScreen === "roles" ? (
            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className=" hover:bg-Duskwood-500 
        bg-[#ef7e1b] text-white
        h-[44px] px-8
        rounded-[8px]
        flex items-center justify-center
      "
            >
              Add Role
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                className="bg-[#ef7e1b] text-white h-[44px] px-4 rounded-[8px] flex items-center justify-center gap-2"
              >
                <span>{selectedRole?.name || "Select Role Name"}</span>
                <FiChevronDown />
              </button>
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden">
                  <div>
                    {selectedRole && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedRole(null);
                            setIsRoleDropdownOpen(false);
                          }}
                          className="group flex items-center px-4 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors"
                        >
                          <span className="group-hover:text-white transition-colors">
                            Select Role Name
                          </span>
                        </button>
                        <svg
                          className="w-full h-[1px]"
                          viewBox="0 0 100 1"
                          preserveAspectRatio="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <polygon points="0,0 50,1 100,0" fill="#E5E7EB" />
                        </svg>
                      </>
                    )}
                    {users.map((role, idx) => (
                      <React.Fragment key={role.id}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedRole({
                              id: role.id,
                              name: formatRoleName(role.name),
                            });
                            setIsRoleDropdownOpen(false);
                          }}
                          className="group flex items-center px-4 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors"
                        >
                          <span className="group-hover:text-white transition-colors">
                            {formatRoleName(role.name)}
                          </span>
                        </button>
                        {idx < users.length - 1 && (
                          <svg
                            className="w-full h-[1px]"
                            viewBox="0 0 100 1"
                            preserveAspectRatio="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <polygon points="0,0 50,1 100,0" fill="#E5E7EB" />
                          </svg>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeScreen === "roles" ? (
        <>
          {/* User List Table */}
          <div className="w-full flex-grow ">
            <table className="w-full  border-collapse">
              <colgroup>
                <col style={{ width: "12.5%" }} />
                <col style={{ width: "12.5%" }} />
                <col style={{ width: "75%" }} />
              </colgroup>
              <thead>
                <tr className="text-left text-[#4B5563]">
                  {/* <th className="py-4 px-6 font-medium text-sm">Name</th> */}
                  {/* <th className="py-4 px-6 font-medium text-sm">Email</th> */}
                  <th className="py-4 px-6 font-medium text-sm">Role</th>
                  {/* <th className="py-4 px-6 font-medium text-sm">Descriptions</th> */}
                  <th className="py-4 px-6 font-medium text-sm">Actions</th>
                  <th className="py-4 px-6 font-medium text-sm" />
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="py-8 px-6 text-center text-[#4B5563]"
                    >
                      No users available.
                    </td>
                  </tr>
                ) : (
                  users.map((role) => {
                    return (
                      <tr key={role.id} className="border-t border-[#E5E7EB]">
                        {/* <td className="py-4 px-6 text-sm text-[#4B5563]">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.image || dummyAvatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <span>{user.name}</span>
                          </div>
                        </td> */}
                        {/* <td className="py-4 px-6 text-sm text-[#4B5563]">
                          {user.email}
                        </td> */}
                        <td className="py-4 px-6 text-sm text-[#4B5563] whitespace-nowrap">
                          {formatRoleName(role.name) || "N/A"}
                        </td>
                        {/* <td className="py-4 px-6 text-sm text-[#4B5563]">
                          {formatAddress(user.address)}
                        </td> */}
                        <td className="py-4 px-6 relative">
                          <button
                            onClick={() => toggleDropdown(role.id)}
                            className="p-2 text-[#4B5563] hover:bg-Duskwood-200 rounded-full transition-colors "
                          >
                            <TbDotsVertical className="w-4 h-4" />
                          </button>
                          {activeDropdown === role.id && (
                            <div className="relative">
                              {/* Trigger, etc. */}
                              <div className="absolute left-3 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden">
                                <div className="">
                                  {/* EDIT button */}
                                  <button
                                    onClick={() => handleEdit(role)}
                                    className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors"
                                    >
                                      <path
                                        fill="currentColor"
                                        d="M4 14v-2h7v2zm0-4V8h11v2zm0-4V4h11v2zm9 14v-3.075l6.575-6.55l3.075 3.05L16.075 20zm7.5-6.575l-.925-.925zm-6 5.075h.95l3.025-3.05l-.45-.475l-.475-.45l-3.05 3.025zm3.525-3.525l-.475-.45l.925.925z"
                                      />
                                    </svg>
                                    <span className="group-hover:text-white transition-colors">
                                      Edit
                                    </span>
                                  </button>
                                  {/* Tapered separator (geometric taper) */}
                                  <svg
                                    className="w-full h-[1px]" // adjust h-1 or h-2 as needed
                                    viewBox="0 0 100 1"
                                    preserveAspectRatio="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <polygon
                                      points="0,0 50,1 100,0"
                                      fill="#E5E7EB"
                                    />
                                  </svg>
                                  {/* DELETE button */}
                                  <button
                                    onClick={() => handleDelete(role.id)}
                                    className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors"
                                    >
                                      <path
                                        fill="currentColor"
                                        d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
                                      />
                                    </svg>
                                    <span className="group-hover:text-white transition-colors">
                                      Delete
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ opacity: 0, pointerEvents: "none" }}>
                            spacer
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="w-full flex-grow">
          {selectedRole == null ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
              <svg
                width="64"
                height="64"
                fill="none"
                viewBox="0 0 64 64"
                className="mb-4"
              >
                <rect width="64" height="64" rx="16" fill="#E7F4FF" />
                <path
                  d="M32 20a12 12 0 1 1 0 24a12 12 0 0 1 0-24zm0 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20zm0 24c7.732 0 14 2.239 14 5v1a1 1 0 0 1-1 1H19a1 1 0 0 1-1-1v-1c0-2.761 6.268-5 14-5zm0 2c-7.18 0-12 2.09-12 3v.5h24V49c0-.91-4.82-3-12-3z"
                  fill="#0e4053"
                />
              </svg>
              <div className="text-lg md:text-xl font-medium text-[#4B5563] text-center">
                Please select a role to manage permissions
              </div>
              <div className="text-sm text-[#6B7280] mt-2 text-center">
                Use the{" "}
                <span className="font-semibold text-[#ef7e1b]">
                  Select Role Name
                </span>{" "}
                dropdown above to choose a role.
              </div>
            </div>
          ) : (
            <div>
              <PermissionsTable
                permissions={permissions}
                onPermissionChange={handlePermissionChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Glassmorphism modal container */}
          <div
            className="
    w-11/12 max-w-[800px] max-h-[90vh] overflow-y-auto p-6 md:p-8
    rounded-2xl
    bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
    shadow-lg
    relative z-10
  "
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 1L1 13"
                  stroke="#1F2837"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 1L13 13"
                  stroke="#1F2837"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Modal title */}
            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              Edit Role
            </h2>

            {/* Only Role Field */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role || ""}
                  onChange={handleInputChange}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  required
                />
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="w-11/12 max-w-[800px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 1L1 13"
                  stroke="#1F2837"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 1L13 13"
                  stroke="#1F2837"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              Add New Role
            </h2>
            <form onSubmit={handleAddRoleSubmit}>
              <div className="space-y-2">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  name="role"
                  value={newRoleData.role || ""}
                  onChange={handleNewRoleChange}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  required
                />
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for Permissions ---

const PermissionToggle = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
        checked ? "bg-[#ef7e1b]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

const PermissionsTable = ({ permissions, onPermissionChange }) => {
  const headers = ["Module", "View", "Create", "Edit", "Delete"];

  return (
    <div className="w-full rounded-lg  overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_0.75fr_0.75fr_0.75fr_0.75fr_2fr] gap-x-4 px-6 py-4 border-b border-gray-200 ">
        {headers.map((header, index) => (
          <div
            key={header}
            className={`font-medium text-sm text-[#4B5563] ${
              index > 0 ? "text-center" : "text-left"
            }`}
          >
            {header}
          </div>
        ))}
        <div /> {/* Empty header for spacing */}
      </div>

      {/* Body */}
      <div>
        {Object.entries(permissions).map(([moduleName, modulePermissions]) => (
          <div
            key={moduleName}
            className="grid grid-cols-[2fr_0.75fr_0.75fr_0.75fr_0.75fr_2fr] gap-x-4 px-6 py-4 border-b border-gray-200 items-center last:border-b-0 hover:bg-gray-50/30 transition-colors"
          >
            <div className="font-medium text-sm text-[#4B5563]">
              {moduleName}
            </div>
            {Object.keys(modulePermissions).map((permission) => (
              <div key={permission} className="flex justify-center">
                <PermissionToggle
                  checked={modulePermissions[permission]}
                  onChange={() => onPermissionChange(moduleName, permission)}
                />
              </div>
            ))}
            <div /> {/* Empty cell for spacing */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPermissions;

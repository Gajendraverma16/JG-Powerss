import React, { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import { FiEdit } from "react-icons/fi";
import api from "../../api";
import Swal from "sweetalert2";
import dummyAvatar from "/dummyavatar.jpeg";

const RolesPermissions = () => {
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
    Payment: { view: true, create: false, edit: false, delete: false },
    "Customer Inquiry": {
      view: true,
      create: false,
      edit: false,
      delete: false,
    },
  };

  const [permissions, setPermissions] = useState(initialPermissions);

  const handlePermissionChange = (module, permission) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: !prev[module][permission],
      },
    }));
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

    const payload = {
      role: selectedRole,
      permissions: permissions,
    };

    const loadingAlert = Swal.fire({
      title: "Saving Permissions...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.post("/permissions", payload);
      await loadingAlert.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Permissions Saved!",
          text: `Permissions for ${selectedRole} have been updated successfully.`,
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
        const response = await api.get("/userlist");
        if (response.data.success) {
          setUsers([...response.data.result]);
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

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phoneno: user.phoneno,
      address: user.address,
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

    const formData = new FormData();
    Object.keys(newRoleData).forEach((key) => {
      formData.append(key, newRoleData[key]);
    });

    try {
      // Show loading state
      const loadingAlert = Swal.fire({
        title: "Creating User...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // API call to create user with multipart/form-data
      const response = await api.post("/users", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadingAlert.close();

      if (response.data.success || response.data.status) {
        const newUser = response.data.result;
        // Prepend the new user to the list
        setUsers((prev) => [newUser, ...prev]);
        setIsAddRoleModalOpen(false);
        resetForm();

        await Swal.fire({
          icon: "success",
          title: "User Created!",
          text: `User "${newUser.name}" has been successfully created.`,
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error(response.data.message || "Failed to create user");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: err.message || "An error occurred while creating the user.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/deleteuser/${id}`);
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
      const response = await api.post(
        `/updateuser/${editingUser.id}`,
        formData
      );
      if (response.data.success) {
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
          text: `${formData.name} was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
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
    <div className="w-full h-auto min-h-[480px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Title */}
        <div className="flex gap-6">
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
              className={`text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap pb-1 ${
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
                <span>{selectedRole || "Select Role Name"}</span>
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedRole("Sales Manager");
                        setIsRoleDropdownOpen(false);
                      }}
                      className="group flex items-center px-4 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors"
                    >
                      <span className="group-hover:text-white transition-colors">
                        Sales Manager
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedRole("Manager");
                        setIsRoleDropdownOpen(false);
                      }}
                      className="group flex items-center px-4 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors"
                    >
                      <span className="group-hover:text-white transition-colors">
                        Manager
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedRole("Sales Representative");
                        setIsRoleDropdownOpen(false);
                      }}
                      className="group flex items-center px-4 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors"
                    >
                      <span className="group-hover:text-white transition-colors">
                        Sales Representative
                      </span>
                    </button>
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
          <div className="hidden md:block w-full flex-grow">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="text-left text-[#4B5563]">
                  <th className="py-4 px-6 font-medium text-sm">Name</th>
                  <th className="py-4 px-6 font-medium text-sm">Email</th>
                  <th className="py-4 px-6 font-medium text-sm">Role</th>
                  <th className="py-4 px-6 font-medium text-sm">
                    Descriptions
                  </th>
                  <th className="py-4 px-6 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-8 px-6 text-center text-[#4B5563]"
                    >
                      No users available.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    return (
                      <tr key={user.id} className="border-t border-[#E5E7EB]">
                        <td className="py-4 px-6 text-sm text-[#4B5563]">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.image || dummyAvatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#4B5563]">
                          {user.email}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#4B5563]">
                          {user.role || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#4B5563]">
                          {formatAddress(user.address)}
                        </td>

                        <td className="py-4 px-6 relative">
                          <button
                            onClick={() => toggleDropdown(user.id)}
                            className="p-2 text-[#4B5563] hover:bg-Duskwood-200  rounded-full transition-colors "
                          >
                            <TbDotsVertical className="w-4 h-4" />
                          </button>
                          {activeDropdown === user.id && (
                            <div className="relative">
                              {/* Trigger, etc. */}
                              <div className="absolute left-3 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden">
                                <div className="">
                                  {/* EDIT button */}
                                  <button
                                    onClick={() => handleEdit(user)}
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
                                    onClick={() => handleDelete(user.id)}
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* User List Cards for Mobile */}
          <div className="md:hidden w-full space-y-4 pb-24 flex-grow">
            {users.length === 0 ? (
              <div className="py-8 px-6 text-center text-[#4B5563]">
                No users available.
              </div>
            ) : (
              users.map((user) => {
                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-200/80"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.image || dummyAvatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="space-y-1 pr-2">
                          <p className="font-bold text-lg text-[#1F2837]">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 break-all">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {/* Actions button */}
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(user.id)}
                          className="p-2 text-[#4B5563] rounded-full hover:bg-gray-100"
                        >
                          <TbDotsVertical className="w-5 h-5" />
                        </button>
                        {activeDropdown === user.id && (
                          <div className="absolute right-0 mt-1 w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden">
                            <div>
                              {/* EDIT button */}
                              <button
                                onClick={() => handleEdit(user)}
                                className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
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

                              {/* Tapered separator */}
                              <svg
                                className="w-full h-[1px]"
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
                                onClick={() => handleDelete(user.id)}
                                className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
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
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">
                          Role:{" "}
                        </span>
                        <span className="text-gray-800">
                          {user.role || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Description:{" "}
                        </span>
                        <span className="text-gray-800">
                          {formatAddress(user.address)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="w-full flex-grow">
          <div>
            <PermissionsTable
              permissions={permissions}
              onPermissionChange={handlePermissionChange}
            />
          </div>
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
              Edit User
            </h2>

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Customer Name */}
              <div className="space-y-2 md:col-start-1 md:row-start-1">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Customer Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="
          w-full h-[48px] px-3 rounded-[12px]
          bg-[#E7EFF8] border border-white/20
          focus:ring-2 focus:ring-[#0e4053] outline-none
          text-[#545454] placeholder-[#545454]
        "
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FiEdit className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 md:col-start-2 md:row-start-1">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="
        w-full h-[48px] px-3 rounded-[12px]
        bg-[#E7EFF8] border border-white/20
        focus:ring-2 focus:ring-[#0e4053] outline-none
        text-[#545454] placeholder-[#545454]
      "
                />
              </div>

              {/* Address: full-width on md+ by spanning 2 columns */}
              <div className="space-y-2 md:col-start-1 md:col-span-2 md:row-start-2">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="
        w-full min-h-[115px] p-3 rounded-[12px]
        bg-[#E7EFF8] border border-white/20
        focus:ring-2 focus:ring-[#0e4053] outline-none
        text-[#545454] placeholder-[#545454] resize-none
      "
                />
              </div>

              {/* Contact (Phone Number) */}
              <div className="space-y-2 md:col-start-1 md:row-start-3">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  name="phoneno"
                  value={formData.phoneno}
                  onChange={handleInputChange}
                  className="
        w-full h-[48px] px-3 rounded-[12px]
        bg-[#E7EFF8] border border-white/20
        focus:ring-2 focus:ring-[#0e4053] outline-none
        text-[#545454] placeholder-[#545454]
      "
                />
              </div>

              {/* (Optional) empty div to fill the right column on the third row, if you want consistent spacing */}
              <div className="hidden md:block md:col-start-2 md:row-start-3" />
            </div>

            {/* Save button */}
            <div className="mt-10 flex justify-center">
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
              >
                Save
              </button>
            </div>
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
              Add New User
            </h2>
            <form onSubmit={handleAddRoleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* --- Left Column: Profile Picture --- */}
                <div className="md:col-span-1 flex flex-col items-center">
                  <label className="block text-[#4B5563] text-[16px] mb-4 w-full">
                    Profile Picture
                  </label>
                  <div className="relative w-32 h-32">
                    <img
                      src={imagePreview || dummyAvatar}
                      alt="Profile Preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <label
                      htmlFor="file-upload"
                      className="absolute bottom-1 right-1 bg-[#ef7e1b] text-white rounded-full p-2 cursor-pointer hover:bg-Duskwood-600 transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                      <input
                        type="file"
                        name="image"
                        id="file-upload"
                        onChange={handleNewRoleChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>

                {/* --- Right Columns: User Details --- */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newRoleData.name}
                      onChange={handleNewRoleChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newRoleData.email}
                      onChange={handleNewRoleChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneno"
                      value={newRoleData.phoneno}
                      onChange={handleNewRoleChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={newRoleData.password}
                      onChange={handleNewRoleChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={newRoleData.address}
                      onChange={handleNewRoleChange}
                      rows="3"
                      className="w-full p-3 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newRoleData.description}
                      onChange={handleNewRoleChange}
                      rows="4"
                      className="w-full p-2 rounded-[12px] bg-[#E7EFF8] border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                >
                  Create User
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

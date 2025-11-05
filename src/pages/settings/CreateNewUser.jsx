import React, { useState, useEffect, useRef, useContext } from "react";
import { FiChevronDown } from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import { FiEdit } from "react-icons/fi";
import api from "../../api";
import Swal from "sweetalert2";
import { Country, State, City } from "country-state-city";
import { SidebarContext } from "../../components/Layout";


// Helper to format role names (capitalize, snake_case to space, capitalize after space)
export function formatRoleName(roleName) {
  if (!roleName || typeof roleName !== "string") return roleName;
  return roleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const formatAddress = (address) => {
  try {
    const parsedAddress = JSON.parse(address);

    // Check if all fields are empty
    const allFieldsEmpty =
      !parsedAddress.blockUnitStreetName &&
      !parsedAddress.country &&
      !parsedAddress.state &&
      !parsedAddress.city &&
      !parsedAddress.pincode;

    if (allFieldsEmpty) {
      return null; // Don't show anything if all fields are empty
    }

    // Build address parts array
    const addressParts = [];

    // Add street name if present
    if (
      parsedAddress.blockUnitStreetName &&
      parsedAddress.blockUnitStreetName.trim()
    ) {
      addressParts.push(
        <strong key="street">{parsedAddress.blockUnitStreetName}</strong>
      );
    }

    // Build location line (city, state, country)
    const locationParts = [];
    if (parsedAddress.city && parsedAddress.city.trim()) {
      locationParts.push(parsedAddress.city);
    }
    if (parsedAddress.state && parsedAddress.state.trim()) {
      locationParts.push(parsedAddress.state);
    }
    if (parsedAddress.country && parsedAddress.country.trim()) {
      locationParts.push(parsedAddress.country);
    }

    if (locationParts.length > 0) {
      addressParts.push(<span key="location">{locationParts.join(", ")}</span>);
    }

    // Add pincode if present
    if (parsedAddress.pincode && parsedAddress.pincode.trim()) {
      addressParts.push(<span key="pincode">{parsedAddress.pincode}</span>);
    }

    // If we have any parts, render them
    if (addressParts.length > 0) {
      return (
        <>
          {addressParts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < addressParts.length - 1 && <br />}
            </React.Fragment>
          ))}
        </>
      );
    }

    return null; // Don't show anything if no valid parts
  } catch (e) {
    // Not a JSON string, or not in the expected format
    // Check if it's a plain string and not empty
    if (
      address &&
      address.trim() &&
      address !== "null" &&
      address !== "undefined"
    ) {
      return address;
    }
    return null; // Don't show anything for invalid/empty addresses
  }
};

// Validation helper for create and edit
function validateUserForm(
  { name, email, password },
  roleObj,
  isCreate = false
) {
  if (!name || name.trim() === "") {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Name is required.",
      confirmButtonColor: "#DD6B55",
    });
    return false;
  }
  if (!email || email.trim() === "") {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Email is required.",
      confirmButtonColor: "#DD6B55",
    });
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please enter a valid email address.",
      confirmButtonColor: "#DD6B55",
    });
    return false;
  }
  if (isCreate && (!password || password.trim() === "")) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Password is required.",
      confirmButtonColor: "#DD6B55",
    });
    return false;
  }
  if (!roleObj) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please select a Role.",
      confirmButtonColor: "#DD6B55",
    });
    return false;
  }
  return true;
}

const CreateUser = () => {
  // Mobile detection and search state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // New state for dropdown and modal
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneno: "",
    is_approved: false,
    blockUnitStreetName: "",
    pincode: "",
    password: "",
    category: "",
  });

  // For create: separate state
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phoneno: "",
    password: "",
    blockUnitStreetName: "",
    pincode: "",
    role: "User", // fixed
    is_approved: false, // if needed
    category: "",
  });

  // New state for create role dropdown
  const [createSelectedRole, setCreateSelectedRole] = useState(null);
  const [createRoleDropdownOpen, setCreateRoleDropdownOpen] = useState(false);
  const [createRoleSearchTerm, setCreateRoleSearchTerm] = useState("");

  // Add state for custom pagination dropdown
  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);
  const itemsPerPageDropdownRef = useRef(null);

  // Address Field States
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [selectedCityObj, setSelectedCityObj] = useState(null);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  // New state for roles
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

  // Variables to check disabled state for address fields
  const isStateFieldDisabled = !selectedCountryObj;
  const isCityFieldDisabled = !selectedStateObj;

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/roles");
        if (response.data.success) {
          setRoles(response.data.data);
        } else {
          console.error("Failed to fetch roles:", response.data.message);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setCountryDropdownOpen(false);
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target)
      ) {
        setStateDropdownOpen(false);
      }
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target)
      ) {
        setCityDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setRoleDropdownOpen(false);
      }
      if (
        itemsPerPageDropdownRef.current &&
        !itemsPerPageDropdownRef.current.contains(event.target)
      ) {
        setIsItemsPerPageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/userlist");
        if (response.data.success) {
          setUsers(response.data.result);
        } else {
          setError("Failed to fetch users");
        }
      } catch (err) {
        setError("Error fetching users: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSearchExpanded(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user?.name?.toLowerCase()?.includes(searchLower) ||
      user?.email?.toLowerCase()?.includes(searchLower) ||
      user?.phoneno?.toLowerCase()?.includes(searchLower) ||
      user?.address?.toLowerCase()?.includes(searchLower)
    );
  });

  // Open create modal: reset createFormData
  const openCreateModal = () => {
    setEditingUser(null);
    setCreateFormData({
      name: "",
      email: "",
      phoneno: "",
      password: "",
      blockUnitStreetName: "",
      pincode: "",
      role: "User",
      is_approved: false,
      category:"",
    });
    clearAddressFields();
    // Reset create role selection
    setCreateSelectedRole(null);
    setCreateRoleSearchTerm("");
    setCreateRoleDropdownOpen(false);
    setIsModalOpenCreate(true);
  };

  // Function to handle submission of the Create Member form:
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!validateUserForm(createFormData, createSelectedRole, true)) {
      return;
    }

    // Declare loadingAlert outside try block
    let loadingAlert;

    try {
      const payload = {
        name: createFormData.name,
        email: createFormData.email,
        phoneno: createFormData.phoneno,
        password: createFormData.password,
         category: createFormData.category,
        address: JSON.stringify({
          blockUnitStreetName: createFormData.blockUnitStreetName,
          country: selectedCountryObj?.name || "",
          state: selectedStateObj?.name || "",
          city: selectedCityObj?.name || "",
          pincode: createFormData.pincode,
        }),
        role: createSelectedRole.name,
        role_id: createSelectedRole.id, // use user-selected value
      };

      // Show loading state
      loadingAlert = Swal.fire({
        title: "Creating User...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      console.log(payload, "sending this in api");

      const response = await api.post("/users", payload);

      if (response.data.status) {
        const newUser = response.data.result;
        // Update the users list with the new user
        setUsers((prev) => [...prev, newUser]);
        setIsModalOpenCreate(false);

        // Close loading alert
        await loadingAlert.close();

        // Show success message
        await Swal.fire({
          icon: "success",
          title: "User Created Successfully",
          text: `User has been added to the system.`,
          confirmButtonColor: "#0e4053",
        });

        // Reset form data
        setCreateFormData({
          name: "",
          email: "",
          phoneno: "",
          password: "",
          blockUnitStreetName: "",
          pincode: "",
          role: "User",
          is_approved: false,
          category:"",
        });
        clearAddressFields();
        setCreateSelectedRole(null); // Clear selected role after creation
        setCreateRoleSearchTerm(""); // Clear search term after creation

        // Refresh the users list
        const refreshResponse = await api.get("/userlist");
        if (refreshResponse.data.success) {
          setUsers(refreshResponse.data.result);
        }
      } else {
        throw new Error(response.data.message || "Failed to Create Member");
      }
    } catch (err) {
      // Close loading alert if it exists
      if (loadingAlert) {
        await loadingAlert.close();
      }

      let errorTitle = "Error Creating User";
      let errorMessage =
        "An error occurred while creating the user. Please try again.";

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 422) {
          // Validation error
          const errors = err.response.data.errors;
          if (errors) {
            // Get the first error message from any field
            const firstError = Object.values(errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            }
          }
        } else if (err.response.data?.message) {
          // Server returned an error message
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorTitle = "Network Error";
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message;
      }

      // Show error message
      await Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  const handleSearchBlur = () => {
    if (isMobile) {
      setIsSearchExpanded(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // New handlers for dropdown and modal
  const toggleDropdown = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  const handleCopyPassword = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "Password copied to clipboard.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Copy Failed",
        text: "Failed to copy password.",
      });
    }
  };

  const handleEdit = (user) => {
    clearAddressFields(); // Clear previous selections
    setEditingUser(user);

    // Always hide password when opening edit modal
    setShowPassword(false);

    let parsedAddress = {};
    try {
      parsedAddress = JSON.parse(user.address);
    } catch (e) {
      // If parsing fails, it might be the old plain string format
      parsedAddress.blockUnitStreetName = user.address;
    }

    setFormData({
      name: user.name,
      email: user.email,
      phoneno: user.phoneno,
      is_approved: user.is_approved,
      blockUnitStreetName: parsedAddress.blockUnitStreetName || "",
      pincode: parsedAddress.pincode || "",
      password: user.password || "",
    });

    // Set selected role for editing
    const role = roles.find((r) => r.name === user.role);
    setSelectedRole(role || null);
    setRoleSearchTerm(role?.name || "");

    // Set country, state, city for editing
    const country = countries.find((c) => c.name === parsedAddress.country);
    setSelectedCountryObj(country || null);
    setCountrySearchTerm(country?.name || "");

    if (country) {
      const statesOfCountry = State.getStatesOfCountry(country.isoCode);
      setStates(statesOfCountry);
      const state = statesOfCountry.find((s) => s.name === parsedAddress.state);
      setSelectedStateObj(state || null);
      setStateSearchTerm(state?.name || "");

      if (state) {
        const citiesOfState = City.getCitiesOfState(
          state.countryCode,
          state.isoCode
        );
        setCities(citiesOfState);
        const city = citiesOfState.find((c) => c.name === parsedAddress.city);
        setSelectedCityObj(city || null);
        setCitySearchTerm(city?.name || "");
      } else {
        setCities([]);
        setSelectedCityObj(null);
        setCitySearchTerm("");
      }
    } else {
      setStates([]);
      setCities([]);
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setStateSearchTerm("");
      setCitySearchTerm("");
    }

    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "is_approved" ? value === "true" : value,
    }));
  };

  // Common input-change handler for edit
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "is_approved" ? value === "true" : value,
    }));
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handlers for Country, State, City pickers
  const handleCountrySearchChange = (e) => {
    const value = e.target.value;
    setCountrySearchTerm(value);
    setCountryDropdownOpen(true);
    // Clear dependent selections if country changes
    if (value === "") {
      setSelectedCountryObj(null);
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setStates([]);
      setCities([]);
      setStateSearchTerm("");
      setCitySearchTerm("");
      setFormData((prev) => ({ ...prev, country: "", state: "", city: "" }));
    }
  };

  const handleCountryClear = () => {
    setSelectedCountryObj(null);
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setStates([]);
    setCities([]);
    setCountrySearchTerm("");
    setStateSearchTerm("");
    setCitySearchTerm("");
    setFormData((prev) => ({ ...prev, country: "", state: "", city: "" }));
    setCreateFormData((prev) => ({
      ...prev,
      country: "",
      state: "",
      city: "",
    }));
  };

  const handleCountrySelect = (country) => {
    setSelectedCountryObj(country);
    setCountrySearchTerm(country.name);
    setCountryDropdownOpen(false);
    setStates(State.getStatesOfCountry(country.isoCode));
    // Clear dependent selections
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setCities([]);
    setStateSearchTerm("");
    setCitySearchTerm("");
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      state: "",
      city: "",
    }));
  };

  const handleStateSearchChange = (e) => {
    if (!selectedCountryObj) return;
    const value = e.target.value;
    setStateSearchTerm(value);
    setStateDropdownOpen(true);
    // Clear dependent selections if state changes
    if (value === "") {
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setCities([]);
      setCitySearchTerm("");
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
    }
  };

  const handleStateSelect = (state) => {
    setSelectedStateObj(state);
    setStateSearchTerm(state.name);
    setStateDropdownOpen(false);
    setCities(City.getCitiesOfState(state.countryCode, state.isoCode));
    // Clear dependent selections
    setSelectedCityObj(null);
    setCitySearchTerm("");
    setFormData((prev) => ({ ...prev, state: state.name, city: "" }));
  };

  const handleStateClear = () => {
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setCities([]);
    setStateSearchTerm("");
    setCitySearchTerm("");
    setFormData((prev) => ({ ...prev, state: "", city: "" }));
    setCreateFormData((prev) => ({ ...prev, state: "", city: "" }));
  };

  const handleCitySearchChange = (e) => {
    if (!selectedStateObj) return;
    const value = e.target.value;
    setCitySearchTerm(value);
    setCityDropdownOpen(true);
    if (value === "") {
      setSelectedCityObj(null);
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCityObj(city);
    setCitySearchTerm(city.name);
    setCityDropdownOpen(false);
    setFormData((prev) => ({ ...prev, city: city.name }));
  };

  const handleCityClear = () => {
    setSelectedCityObj(null);
    setCitySearchTerm("");
    setFormData((prev) => ({ ...prev, city: "" }));
    setCreateFormData((prev) => ({ ...prev, city: "" }));
  };

  // Helper function to clear address fields
  const clearAddressFields = () => {
    setSelectedCountryObj(null);
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setStates([]);
    setCities([]);
    setCountrySearchTerm("");
    setStateSearchTerm("");
    setCitySearchTerm("");
    setCountryDropdownOpen(false);
    setStateDropdownOpen(false);
    setCityDropdownOpen(false);
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
    setOpenStatusMenu(null);
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (!validateUserForm(formData, selectedRole, false)) {
      return;
    }
    try {
      const payload = {
        ...formData,
        address: JSON.stringify({
          blockUnitStreetName: formData.blockUnitStreetName,
          country: selectedCountryObj?.name || "",
          state: selectedStateObj?.name || "",
          city: selectedCityObj?.name || "",
          pincode: formData.pincode,
        }),
        role: selectedRole.name,
        role_id: selectedRole.id,
      };
      const response = await api.post(`/updateuser/${editingUser.id}`, payload);
      if (response.data.success) {
        // Update the users list with the edited user
        setUsers(
          users.map((user) =>
            user.id === editingUser.id
              ? {
                  ...user,
                  ...formData,
                  address: payload.address,
                  role: payload.role,
                } // Update address and role
              : user
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
        setError("Failed to update user");
      }
    } catch (err) {
      setError("Error updating user: " + err.message);
    }
    setOpenStatusMenu(null);
    setActiveDropdown(null);
  };

  const handleStatusToggle = async (user) => {
    const newIsApproved = !user.is_approved;
    try {
      const response = await api.post(`/approval/${user.id}`, {
        is_approved: newIsApproved ? 1 : 0,
      });
      if (response.data.success || response.data.status) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_approved: newIsApproved } : u
          )
        );
        await Swal.fire({
          icon: "success",
          title: "Status Updated",
          text: `${user.name} is now ${
            newIsApproved ? "Approved" : "Blocked"
          }.`,
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error(
          response.data.message || "Server did not confirm status update"
        );
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to update status",
        text: err.message || "An error occurred",
        confirmButtonColor: "#DD6B55",
      });
    }
    setOpenStatusMenu(null);
    setActiveDropdown(null);
  };

  const handleRoleSearchChange = (e) => {
    const value = e.target.value;
    setRoleSearchTerm(value);
    setRoleDropdownOpen(true);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setRoleSearchTerm(role.name);
    setRoleDropdownOpen(false);
  };

  const handleRoleClear = () => {
    setSelectedRole(null);
    setRoleSearchTerm("");
    setRoleDropdownOpen(false);
  };

  // Handlers for Create Member Role Dropdown
  const handleCreateRoleSearchChange = (e) => {
    const value = e.target.value;
    setCreateRoleSearchTerm(value);
    setCreateRoleDropdownOpen(true);
  };

  const handleCreateRoleSelect = (role) => {
    setCreateSelectedRole(role);
    setCreateRoleSearchTerm(role.name);
    setCreateRoleDropdownOpen(false);
  };

  const handleCreateRoleClear = () => {
    setCreateSelectedRole(null);
    setCreateRoleSearchTerm("");
    setCreateRoleDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Consume SidebarContext
  const { isCollapsed } = useContext(SidebarContext);


  return (
    <div

    className={`min-h-[797px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full   ${
        isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[78vw] md:w-[80vw]"
      } md:mx-auto  `}
    >


      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Title */}
        <h1 className="text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap">
          Create New Member
        </h1>

        {/* Search Container */}
        <div className="flex-1 max-w-[400px] mx-1">
          {isMobile && !isSearchExpanded ? (
            <button
              onClick={handleSearchToggle}
              className="
          w-10 h-10
          flex items-center
          rounded-[6px]
          hover:bg-gray-50 transition-colors
        "
            >
              {/* search icon SVG */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
                  stroke="#787374"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.3333 18.3333L20.1667 20.1667"
                  stroke="#787374"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <div className="relative w-full">
              {/* Search icon inside input */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
                    stroke="#787374"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.3333 18.3333L20.1667 20.1667"
                    stroke="#787374"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder={isMobile ? "Search" : "Search by Name, Contact"}
                value={searchTerm}
                onChange={handleSearchChange}
                className="
            w-full
            h-[44px]
            pl-12 pr-4
            bg-[#E9F1F9]
            rounded-[6px]
            text-[#787374] placeholder-[#787374]
            focus:outline-none
            text-sm md:text-base
          "
                onBlur={handleSearchBlur}
                autoFocus={isMobile && isSearchExpanded}
              />
            </div>
          )}
        </div>

        {/* Actions: Create Member + Display Dropdown */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            className=" hover:bg-Duskwood-500
        bg-[#ef7e1b] text-white
        h-[44px] px-5
        rounded-[8px]
        flex items-center justify-center
        cursor-pointer
      "
            onClick={openCreateModal}
          >
            Create Member
          </button>
          <span className="text-[#727A90] text-sm md:text-base lg:text-base whitespace-nowrap">
            Show
          </span>
          {/* Items per page custom dropdown */}
          <div className="relative min-w-[88px]" ref={itemsPerPageDropdownRef}>
            <button
              type="button"
              className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full min-w-[72px] md:min-w-[88px] lg:min-w-[88px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center"
              onClick={() => setIsItemsPerPageDropdownOpen((open) => !open)}
            >
              <span className="truncate text-left flex-1">{itemsPerPage}</span>
              <img
                src="/caret-down.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
              />
            </button>
            {isItemsPerPageDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                {[5, 10, 20, 50].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      handleItemsPerPageChange(option);
                      setIsItemsPerPageDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] ${
                      itemsPerPage === option
                        ? "bg-[#E7EFF8] font-bold text-[#ef7e1b]"
                        : "text-[#545454]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-[#4B5563]">
          Showing {filteredUsers.length} results for "{searchTerm}"
        </div>
      )}

      {/* User List Table */}
      <div className="hidden md:block w-full flex-grow overflow-y-hidden  custom-scrollbar pb-11">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="text-left text-[#4B5563]">
              <th className="py-4 px-6 font-medium text-sm">Name</th>
              <th className="py-4 px-6 font-medium text-sm">Email</th>
              <th className="py-4 px-6 font-medium text-sm">Role</th>
              <th className="py-4 px-6 font-medium text-sm">Address</th>
              <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">Contact Number</th>
              <th className="py-4 px-6 font-medium text-sm">Status</th>
              <th className="py-4 px-6 font-medium text-sm">Category</th>
              <th className="py-4 px-6 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="">
            {currentUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="py-8 px-6 text-center text-[#4B5563]"
                >
                  {searchTerm
                    ? "No users found matching your search."
                    : "No users available."}
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => {
                const isStatusMenuOpen = openStatusMenu === user.id;

                return (
                  <tr key={user.id} className="border-t border-[#E5E7EB]">
                    <td className="py-4 px-6 text-sm text-[#4B5563]">
                      {user.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563]">
                      {user.email}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563]">
                      {formatRoleName(user.role)}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563]">
                      {formatRoleName(user.category)}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563]">
                      {formatAddress(user.address)}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563]">
                      {user.phoneno}
                    </td>
                    <td className="py-4 px-6 ">
                      <div className="relative inline-block group">
                        {/* Status Badge with improved styling */}
                        <div
                          className="flex items-center gap-2"
                          onClick={
                            isMobile
                              ? () =>
                                  setOpenStatusMenu(
                                    isStatusMenuOpen ? null : user.id
                                  )
                              : undefined
                          }
                        >
                          <span
                            className={`
                              px-3 py-1 rounded-lg text-sm
                              flex items-center gap-2 transition-all duration-200
                              cursor-pointer select-none
                              ${
                                user.is_approved
                                  ? "bg-[#27AE60] text-white"
                                  : "bg-[#ef7e1b] text-white"
                              }
                              hover:scale-105 transform
                            `}
                          >
                            {user.is_approved ? "Approved" : "Blocked"}

                            {/* Dropdown arrow */}
                            <svg
                              className={`w-3 h-3 ml-1 transition-transform duration-200 ${
                                isMobile
                                  ? isStatusMenuOpen
                                    ? "rotate-180"
                                    : ""
                                  : "group-hover:rotate-180"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </span>
                        </div>

                        {/* Common Dropdown for both mobile and desktop */}
                        <div
                          className={`
                            absolute left-0 top-full mt-2 z-50
                            transition-all duration-200 ease-out
                            ${
                              isMobile
                                ? isStatusMenuOpen
                                  ? "opacity-100 visible translate-y-0"
                                  : "opacity-0 invisible translate-y-2"
                                : `opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                   transform translate-y-2 group-hover:translate-y-0`
                            }
                          `}
                        >
                          <button
                            onClick={() => handleStatusToggle(user)}
                            className="
                              whitespace-nowrap cursor-pointer
                              bg-white border border-gray-200/60
                              text-gray-700 text-sm font-medium
                              px-4 py-3 rounded-xl shadow-xl
                              hover:bg-gray-50 hover:border-gray-300
                              hover:shadow-2xl hover:scale-105
                              transition-all duration-200
                              backdrop-blur-sm
                              flex items-center gap-2
                              min-w-max
                            "
                          >
                            {/* Action icon */}
                            <div
                              className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${
                                  user.is_approved
                                    ? "bg-Duskwood-100 text-Duskwood-600"
                                    : "bg-green-100 text-green-600"
                                }
                              `}
                            >
                              {user.is_approved ? "P" : "A"}
                            </div>

                            <span className="text-xs">
                              {user.is_approved
                                ? "Change to Blocked"
                                : "Change to Approved"}
                            </span>

                            {/* Arrow indicator */}
                            <svg
                              className="w-3 h-3 opacity-60"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>

                          {/* Dropdown arrow pointer */}
                          <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-gray-200/60 rotate-45 z-40"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 relative">
                      <button
                        onClick={() => toggleDropdown(user.id)}
                        className="p-2 text-[#4B5563] hover:bg-Duskwood-200  rounded-full transition-colors cursor-pointer"
                      >
                        <TbDotsVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === user.id && (
                        <div className="relative">
                          {/* Trigger, etc. */}
                          <div className="absolute -left-4 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden">
                            <div className="">
                              {/* EDIT button */}
                              <button
                                onClick={() => handleEdit(user)}
                                className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors cursor-pointer"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M4 14v-2h7v2zm0-4V8h11v2zm0-4V4h11v2zm9 14v-3.075l6.575-6.55l3.075 3.05L16.075 20zm7.5-6.575l-.925-.925zm-6 5.075h.95l3.025-3.05l-.45-.475l-.475-.45l-3.05 3.025zm3.525-3.525l-.475-.45l.925.925z"
                                  />
                                </svg>
                                <span className="group-hover:text-white transition-colors cursor-pointer">
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
                                className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors cursor-pointer"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
                                  />
                                </svg>
                                <span className="group-hover:text-white transition-colors cursor-pointer">
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
        {currentUsers.length === 0 ? (
          <div className="py-8 px-6 text-center text-[#4B5563]">
            {searchTerm
              ? "No users found matching your search."
              : "No users available."}
          </div>
        ) : (
          currentUsers.map((user) => {
            const isStatusMenuOpen = openStatusMenu === user.id;
            return (
              <div
                key={user.id}
                className=" rounded-lg shadow p-4 border border-gray-200/80"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 pr-2">
                    <p className="font-bold text-lg text-[#1F2837]">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 break-all">
                      {user.email}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Role: </span>
                      {formatRoleName(user.role)}
                    </p>
                  </div>
                  {/* Actions button */}
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(user.id)}
                      className="p-2 text-[#4B5563] rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                      <TbDotsVertical className="w-5 h-5" />
                    </button>
                    {activeDropdown === user.id && (
                      <div className="absolute right-0 mt-1 w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden">
                        <div>
                          {/* EDIT button */}
                          <button
                            onClick={() => handleEdit(user)}
                            className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors cursor-pointer"
                            >
                              <path
                                fill="currentColor"
                                d="M4 14v-2h7v2zm0-4V8h11v2zm0-4V4h11v2zm9 14v-3.075l6.575-6.55l3.075 3.05L16.075 20zm7.5-6.575l-.925-.925zm-6 5.075h.95l3.025-3.05l-.45-.475l-.475-.45l-3.05 3.025zm3.525-3.525l-.475-.45l.925.925z"
                              />
                            </svg>
                            <span className="group-hover:text-white transition-colors cursor-pointer">
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
                            <polygon points="0,0 50,1 100,0" fill="#E5E7EB" />
                          </svg>

                          {/* DELETE button */}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors cursor-pointer"
                            >
                              <path
                                fill="currentColor"
                                d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
                              />
                            </svg>
                            <span className="group-hover:text-white transition-colors cursor-pointer">
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
                    <span className="font-medium text-gray-600">Address: </span>
                    <span className="text-gray-800">
                      {formatAddress(user.address)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Contact: </span>
                    <span className="text-gray-800">{user.phoneno}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200/80 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Status
                  </span>
                  {/* Status Dropdown */}
                  <div className="relative inline-block">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        setOpenStatusMenu(isStatusMenuOpen ? null : user.id)
                      }
                    >
                      <span
                        className={`
                          px-3 py-1 rounded-lg text-sm
                          flex items-center gap-2 transition-all duration-200
                          select-none
                          ${
                            user.is_approved
                              ? "bg-[#27AE60] text-white"
                              : "bg-[#ef7e1b] text-white"
                          }
                        `}
                      >
                        {user.is_approved ? "Approved" : "Blocked"}
                        <svg
                          className={`w-3 h-3 ml-1 transition-transform duration-200 ${
                            isStatusMenuOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </div>

                    <div
                      className={`
                        absolute right-0 top-full mt-2 z-50
                        transition-all duration-200 ease-out
                        ${
                          isStatusMenuOpen
                            ? "opacity-100 visible translate-y-0"
                            : "opacity-0 invisible -translate-y-2"
                        }
                      `}
                    >
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className="
                          whitespace-nowrap cursor-pointer
                          bg-white border border-gray-200/60
                          text-gray-700 text-sm font-medium
                          px-4 py-3 rounded-xl shadow-xl
                          hover:bg-gray-50
                          transition-all duration-200
                          flex items-center gap-2
                          min-w-max
                        "
                      >
                        <div
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${
                              user.is_approved
                                ? "bg-Duskwood-100 text-Duskwood-600"
                                : "bg-green-100 text-green-600"
                            }
                          `}
                        >
                          {user.is_approved ? "P" : "A"}
                        </div>
                        <span className="text-xs">
                          {user.is_approved
                            ? "Change to Blocked"
                            : "Change to Approved"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => {
              setIsModalOpen(false);
              clearAddressFields();
            }}
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
              onClick={() => {
                setIsModalOpen(false);
                clearAddressFields();
              }}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
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
                  Name
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
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                    <FiEdit className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contact (Phone Number) */}
              <div className="space-y-2 md:col-start-2 md:row-start-1">
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

              {/* Address */}
              <div className="space-y-1 md:col-span-2 md:row-start-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Address
                </label>
                <div className="w-full rounded-[12px] border border-white/20 flex flex-col">
                  <input
                    type="text"
                    name="blockUnitStreetName"
                    value={formData.blockUnitStreetName}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border-t border-r border-l border-white/20 outline-none rounded-t-[12px]"
                    placeholder="Block/Unit/Street Name"
                  />
                  <div className="grid grid-cols-2 w-full">
                    {/* State Dropdown */}
                    <div className="relative" ref={stateDropdownRef}>
                      <input
                        type="text"
                        value={stateSearchTerm}
                        onChange={handleStateSearchChange}
                        onFocus={() =>
                          selectedCountryObj && setStateDropdownOpen(true)
                        }
                        placeholder="Select State"
                        className={`w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 border-t-0 border-r outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          isStateFieldDisabled
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : ""
                        }`}
                        disabled={isStateFieldDisabled}
                        readOnly={isStateFieldDisabled}
                        autoComplete="off"
                      />
                      {stateDropdownOpen && !isStateFieldDisabled && (
                        <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {states
                            .filter((state) =>
                              state.name
                                .toLowerCase()
                                .includes(stateSearchTerm.toLowerCase())
                            )
                            .map((state) => (
                              <div
                                key={state.isoCode}
                                onClick={() => handleStateSelect(state)}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {state.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    {/* City Dropdown */}
                    <div className="relative" ref={cityDropdownRef}>
                      <input
                        type="text"
                        value={citySearchTerm}
                        onChange={handleCitySearchChange}
                        onFocus={() =>
                          selectedStateObj && setCityDropdownOpen(true)
                        }
                        placeholder="Select City"
                        className={`w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 border-t-0 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          isCityFieldDisabled
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : ""
                        }`}
                        disabled={isCityFieldDisabled}
                        readOnly={isCityFieldDisabled}
                        autoComplete="off"
                      />
                      {cityDropdownOpen && !isCityFieldDisabled && (
                        <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {cities
                            .filter((city) =>
                              city.name
                                .toLowerCase()
                                .includes(citySearchTerm.toLowerCase())
                            )
                            .map((city) => (
                              <div
                                key={city.name}
                                onClick={() => handleCitySelect(city)}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {city.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 w-full">
                    {/* Pincode Input */}
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 border-t-0 border-r rounded-bl-[12px] outline-none"
                      placeholder="Pincode"
                    />
                    {/* Country Dropdown */}
                    <div className="relative" ref={countryDropdownRef}>
                      <input
                        type="text"
                        value={countrySearchTerm}
                        onChange={handleCountrySearchChange}
                        onFocus={() => setCountryDropdownOpen(true)}
                        placeholder="Select Country"
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 border-t-0 rounded-br-[12px] outline-none text-[#545454] placeholder-[#545454] text-[16px]"
                        autoComplete="off"
                      />
                      {countryDropdownOpen && (
                        <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {countries
                            .filter((country) =>
                              country.name
                                .toLowerCase()
                                .includes(countrySearchTerm.toLowerCase())
                            )
                            .map((country) => (
                              <div
                                key={country.isoCode}
                                onClick={() => handleCountrySelect(country)}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {country.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
<div className="mt-4">
  <label className="block text-gray-700 mb-2">Category</label>
  <select
    name="category"
    value={createFormData.category || ""}
    onChange={handleCreateInputChange}
    className="w-full h-[48px] px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
  >
    <option value="">Select Category</option>
    <option value="salaried">Salaried</option>
    <option value="incentive">Incentive</option>
  </select>
</div>




              {/* Role Dropdown (new) */}
              <div
                className="space-y-2 md:col-span-2 md:row-start-3 relative"
                ref={roleDropdownRef}
              >
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Role
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] text-left flex items-center justify-between cursor-pointer"
                    onClick={() => setRoleDropdownOpen((open) => !open)}
                  >
                    <span>
                      {selectedRole
                        ? formatRoleName(selectedRole.name)
                        : "Select Role"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        roleDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {roleDropdownOpen && (
                    <div className="absolute custom-scrollbar top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto">
                      {roles.map((role) => (
                        <button
                          type="button"
                          key={role.id}
                          className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                          onClick={() => {
                            setSelectedRole(role);
                            setRoleDropdownOpen(false);
                          }}
                        >
                          {formatRoleName(role.name)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2 md:col-start-2 md:row-start-4">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="
                      w-full h-[48px] px-3 rounded-[12px]
                      bg-[#E7EFF8] border border-white/20
                      focus:ring-2 focus:ring-[#0e4053] outline-none
                      text-[#545454] placeholder-[#545454]
                    "
                    placeholder="Enter new password to change"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        className="bg-[#E7EFF8]"
                      >
                        <path
                          fill="currentColor"
                          d="M6 23H3q-.825 0-1.412-.587T1 21v-3h2v3h3zm12 0v-2h3v-3h2v3q0 .825-.587 1.413T21 23zm-6-4.5q-3 0-5.437-1.775T3 12q1.125-2.95 3.563-4.725T12 5.5t5.438 1.775T21 12q-1.125 2.95-3.562 4.725T12 18.5m0-2q2.2 0 4.025-1.2t2.8-3.3q-.975-2.1-2.8-3.3T12 7.5T7.975 8.7t-2.8 3.3q.975 2.1 2.8 3.3T12 16.5m0-1q1.45 0 2.475-1.025T15.5 12t-1.025-2.475T12 8.5T9.525 9.525T8.5 12t1.025 2.475T12 15.5m0-2q-.625 0-1.063-.437T10.5 12t.438-1.062T12 10.5t1.063.438T13.5 12t-.437 1.063T12 13.5M1 6V3q0-.825.588-1.412T3 1h3v2H3v3zm20 0V3h-3V1h3q.825 0 1.413.588T23 3v3zm-9 6"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-5 h-5 cursor-pointer"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(formData.password)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    title="Copy password to clipboard"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="bg-[#E7EFF8] cursor-pointer"
                    >
                      <path
                        fill="currentColor"
                        d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-end gap-2 ">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.password) {
                        Swal.fire({
                          icon: "error",
                          title: "Error",
                          text: "Please enter a new password.",
                          confirmButtonColor: "#DD6B55",
                        });
                        return;
                      }

                      const result = await Swal.fire({
                        title: "Are you sure?",
                        text: "This will change the user's password.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#0e4053",
                        cancelButtonColor: "#aaa",
                        confirmButtonText: "Yes, change it!",
                      });

                      if (result.isConfirmed) {
                        try {
                          const response = await api.post(
                            `/updatepassword/${editingUser.id}`,
                            {
                              password: formData.password,
                            }
                          );
                          if (response.data.success) {
                            Swal.fire({
                              icon: "success",
                              title: "Password Changed",
                              text: "User password has been updated.",
                              confirmButtonColor: "#0e4053",
                            });
                          } else {
                            throw new Error(
                              response.data.message ||
                                "Failed to change password"
                            );
                          }
                        } catch (err) {
                          Swal.fire({
                            icon: "error",
                            title: "Error Changing Password",
                            text:
                              err.response?.data?.message ||
                              err.message ||
                              "An error occurred.",
                            confirmButtonColor: "#DD6B55",
                          });
                        }
                      }
                    }}
                    className="text-[10px] text-[#ef7e1b] hover:underline cursor-pointer  flex whitespace-nowrap cursor-pointer"
                  >
                    Click to change user's password{" "}
                  </button>
                  <p className="text-[10px] text-[#545454] whitespace-nowrap cursor-pointer">
                    {/* Note: User will be logged out */}
                  </p>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-10 flex justify-center">
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}

      {isModalOpenCreate && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => {
              setIsModalOpenCreate(false);
              clearAddressFields();
            }}
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
              onClick={() => {
                setIsModalOpenCreate(false);
                clearAddressFields();
              }}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
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
              Create Member
            </h2>

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Customer Name */}
              <div className="space-y-2 md:col-start-1 md:row-start-1">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={createFormData.name}
                    onChange={handleCreateInputChange}
                    className="
          w-full h-[48px] px-3 rounded-[12px]
          bg-[#E7EFF8] border border-white/20
          focus:ring-2 focus:ring-[#0e4053] outline-none
          text-[#545454] placeholder-[#545454]
        "
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <FiEdit className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contact (Phone Number) */}
              <div className="space-y-2 md:col-start-2 md:row-start-1">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  name="phoneno"
                  value={createFormData.phoneno}
                  onChange={handleCreateInputChange}
                  className="
        w-full h-[48px] px-3 rounded-[12px]
        bg-[#E7EFF8] border border-white/20
        focus:ring-2 focus:ring-[#0e4053] outline-none
        text-[#545454] placeholder-[#545454]
      "
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-1 md:col-span-2 md:row-start-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Address
                </label>
                <div className="w-full rounded-[12px] border border-white/20 flex flex-col">
                  <input
                    type="text"
                    name="blockUnitStreetName"
                    value={createFormData.blockUnitStreetName}
                    onChange={handleCreateInputChange}
                    className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border-t border-r border-l border-white/20 outline-none rounded-t-[12px]"
                    placeholder="Block/Unit/Street Name"
                    required
                  />

                  {/* State and City Dropdowns */}
                  <div className="grid grid-cols-2 w-full">
                    {/* State Dropdown */}
                    <div className="relative" ref={stateDropdownRef}>
                      <input
                        type="text"
                        value={stateSearchTerm}
                        onChange={handleStateSearchChange}
                        onFocus={() =>
                          selectedCountryObj && setStateDropdownOpen(true)
                        }
                        placeholder="Select State"
                        className={`w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 border-t-0 border-r outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          !selectedCountryObj
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : ""
                        }`}
                        disabled={!selectedCountryObj}
                        readOnly={!selectedCountryObj}
                        autoComplete="off"
                      />
                      {stateDropdownOpen && (
                        <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {states
                            .filter((state) =>
                              state.name
                                .toLowerCase()
                                .includes(stateSearchTerm.toLowerCase())
                            )
                            .map((state) => (
                              <div
                                key={state.isoCode}
                                onClick={() => handleStateSelect(state)}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {state.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* City Dropdown */}
                    <div className="relative" ref={cityDropdownRef}>
                      <input
                        type="text"
                        value={citySearchTerm}
                        onChange={handleCitySearchChange}
                        onFocus={() =>
                          selectedStateObj && setCityDropdownOpen(true)
                        }
                        placeholder="Select City"
                        className={`w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 border-t-0 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          !selectedStateObj
                            ? "cursor-not-allowed opacity-60 bg-gray-300"
                            : ""
                        }`}
                        disabled={!selectedStateObj}
                        readOnly={!selectedStateObj}
                        autoComplete="off"
                      />
                      {cityDropdownOpen && (
                        <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {cities
                            .filter((city) =>
                              city.name
                                .toLowerCase()
                                .includes(citySearchTerm.toLowerCase())
                            )
                            .map((city) => (
                              <div
                                key={city.name}
                                onClick={() => handleCitySelect(city)}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {city.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pincode and Country */}
                  <div className="grid grid-cols-2 w-full">
                    {/* Pincode Input */}
                    <input
                      type="text"
                      name="pincode"
                      value={createFormData.pincode}
                      onChange={handleCreateInputChange}
                      className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 border-t-0 border-r rounded-bl-[12px] outline-none"
                      placeholder="Pincode"
                    />
                    {/* Country Dropdown */}
                    <div className="relative" ref={countryDropdownRef}>
                      <input
                        type="text"
                        value={countrySearchTerm}
                        onChange={handleCountrySearchChange}
                        onFocus={() => setCountryDropdownOpen(true)}
                        placeholder="Select Country"
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 border-t-0 rounded-br-[12px] outline-none text-[#545454] placeholder-[#545454] text-[16px]"
                        autoComplete="off"
                      />
                      {countryDropdownOpen && (
                        <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {countries
                            .filter((country) =>
                              country.name
                                .toLowerCase()
                                .includes(countrySearchTerm.toLowerCase())
                            )
                            .map((country) => (
                              <div
                                key={country.isoCode}
                                onClick={() => handleCountrySelect(country)}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {country.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 md:col-start-1 md:row-start- ">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                 Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={createFormData.email}
                  onChange={handleCreateInputChange}
                  className="
        w-full h-[48px] px-3 rounded-[12px]
        bg-[#E7EFF8] border border-white/20
        focus:ring-2 focus:ring-[#0e4053] outline-none
        text-[#545454] placeholder-[#545454]
      "
                  required
                />
              </div>

              {/* Role Dropdown (new) */}
              <div
                className="space-y-2 md:col-span-2 md:row-start-3 relative"
                ref={roleDropdownRef}
              >
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Role
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] text-left flex items-center justify-between cursor-pointer"
                    onClick={() => setCreateRoleDropdownOpen((open) => !open)}
                  >
                    <span>
                      {createSelectedRole
                        ? formatRoleName(createSelectedRole.name)
                        : "Select Role"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        createRoleDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {createRoleDropdownOpen && (
                    <div className="absolute custom-scrollbar top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto">
                      {roles.map((role) => (
                        <button
                          type="button"
                          key={role.id}
                          className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                          onClick={() => {
                            setCreateSelectedRole(role);
                            setCreateRoleDropdownOpen(false);
                          }}
                        >
                          {formatRoleName(role.name)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
 {createSelectedRole?.name?.toLowerCase().replace(/\s/g, "") === "salesman" && (
  <div className="mt-4">
    <label className="block text-gray-700 mb-2">Category</label>
    <select
      name="category"
      value={createFormData.category || ""}
      onChange={handleCreateInputChange}
      className="w-full h-[48px] px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
    >
      <option value="">Select Category</option>
      <option value="salaried">Salaried</option>
      <option value="incentive">Incentive</option>
    </select>
  </div>
)}


{/* Another log to see the condition */}
{console.log(
  "Condition for showing Category:",
  createSelectedRole?.name?.toLowerCase() === "salesman"
)}




              {/* Password field */}
              <div className="space-y-2 md:col-start-2 md:row-start-4">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type="password"
                    name="password"
                    value={createFormData.password}
                    onChange={handleCreateInputChange}
                    className="
                      w-full h-[48px] px-3 rounded-[12px]
                      bg-[#E7EFF8] border border-white/20
                      focus:ring-2 focus:ring-[#0e4053] outline-none
                      text-[#545454] placeholder-[#545454]
                    "
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredUsers.length > 0 && (
        <div className="flex justify-center pt-7 mt-auto">
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Previous Page */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`w-[44px] h-[44px] lg:w-[52px] lg:h-[52px]
          rounded-full border border-[#7E7B7B]
          flex items-center justify-center transition-colors
          ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : "group hover:bg-Duskwood-200 hover:border-white "
          }
        `}
            >
              <svg
                width="33"
                height="32"
                viewBox="0 0 33 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`stroke-current text-[#7E7B7B]
            ${currentPage === 1 ? "" : "group-hover"}
          `}
              >
                <path
                  d="M23.1667 5.33398L12.06 13.3873C9.09198 15.5407 9.09198 16.462 12.06 18.614L23.1667 26.6673"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Page Info */}
            <div className="flex items-center gap-2 text-sm lg:text-base text-[#4B5563]">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <span>({filteredUsers.length} total)</span>
            </div>

            {/* Next Page */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`w-[44px] h-[44px] lg:w-[52px] lg:h-[52px]
          rounded-full border border-[#7E7B7B]
          flex items-center justify-center transition-colors
          ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : "group hover:bg-Duskwood-200 hover:border-white "
          }
        `}
            >
              <svg
                width="52"
                height="52"
                viewBox="0 0 52 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`stroke-current text-[#7E7B7B]
            ${currentPage === totalPages ? "" : "group-hover"}
          `}
              >
                <circle cx="26" cy="26" r="25.5" strokeWidth="1" />
                <path
                  d="M20.8333 15.334L31.94 23.3873C34.908 25.5407 34.908 26.462 31.94 28.614L20.8333 36.6673"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateUser;
//before new changes

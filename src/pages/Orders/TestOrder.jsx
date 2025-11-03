import React, { useState, useEffect, useRef, useContext, use } from "react";
import {
  FiChevronDown,
  FiEdit,
  FiUpload,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import api from "../../api";
import Swal from "sweetalert2";
import { FaCheck } from "react-icons/fa6";
import { useParams, useNavigate } from "react-router-dom"; 
import { RxCross2 } from "react-icons/rx";
import "../../styles/scrollbar.css";
import { SidebarContext } from "../../components/Layout";

const TestOrder = () => {
  const { statusId, statusName } = useParams(); // Get statusId and statusName from URL
  const navigate = useNavigate(); // Initialize navigate

  const dynamicApiEndpoint = statusId
    ? `/leadstatus/${statusId}`
    : "/orders";
    const dynamicHeaderTitle = "All Order List";
    const dynamicModalTitle = statusName
    ? `Edit ${decodeURIComponent(statusName)} Item`
    : "Edit Quotation";

  // Mobile detection and search state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [quotations, setQuotations] = useState([]);
  console.log("farhabn",quotations);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Consume SidebarContext
  const { isCollapsed } = useContext(SidebarContext);

  // Search, filter, and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    customerName: "all",
    email: "all",
    payment: "all", // New payment filter
    itemCount: "all", // New item count filter
    createdDateRange: "all", // New Created Date Range Filter
    updatedDateRange: "all", // New Updated At Date Range Filter
    contact:"all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Checkbox selection state for bulk operations
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("Inprogress"); // Add bulk status state

  // New state for dropdown and modal
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [formData, setFormData] = useState({
    client_name: "",
    client_address: "",
    package_type: "",
    plot_size: "",
  });

  const [serviceItems, setServiceItems] = useState([
    {
      item_name: "",
      qty: 1,
      amount: 0,
    },
  ]);

  // Add state for expanded row to show all items
  const [expandedQuotationId, setExpandedQuotationId] = useState(null);

  // New state for modal to display items and calculate net total for each quotation
  const [selectedItems, setSelectedItems] = useState(null);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  // New state for "Created" date filter
  const [createdDateRangeDropdownOpen, setCreatedDateRangeDropdownOpen] =
    useState(false);
  const [createdTimeRange, setCreatedTimeRange] = useState("all"); // 'all', '7days', '30days', '90days', 'custom'
  const [customCreatedDateRange, setCustomCreatedDateRange] = useState({
    fromDate: null,
    toDate: null,
  });

  // New state for "Updated At" date filter
  const [updatedDateRangeDropdownOpen, setUpdatedDateRangeDropdownOpen] =
    useState(false);
  const [updatedTimeRange, setUpdatedTimeRange] = useState("all"); // 'all', '7days', '30days', '90days', 'custom'
  const [customUpdatedDateRange, setCustomUpdatedDateRange] = useState({
    fromDate: null,
    toDate: null,
  });

  // Ref for the Created date range dropdown
  const createdDateRangeDropdownRef = useRef(null);

  // Ref for the Updated At date range dropdown
  const updatedDateRangeDropdownRef = useRef(null);

  // Add refs and state for custom dropdowns (for UI only)
  const customerNameDropdownRef = useRef(null);
  const emailDropdownRef = useRef(null);
  const paymentDropdownRef = useRef(null);
  const itemCountDropdownRef = useRef(null);
  const contactDropdownRef = useRef(null)
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);
  const itemsPerPageDropdownRef = useRef(null);
  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const response = await api.get(dynamicApiEndpoint); // Use dynamicApiEndpoint
        console.log(response.data);
        if (response.data.success) {
          setQuotations(response.data.data); // Access data.data for quotations
        } else {
          setError("Failed to fetch");
        }
      } catch (err) {
        setError("Error fetching : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();    
  }, [dynamicApiEndpoint]); // Depend on dynamicApiEndpoint

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

  // Helper function to recursively search all fields in an object for a search term
  const objectContainsSearchTerm = (obj, searchLower) => {
    if (obj == null) return false;
    if (typeof obj === "string" || typeof obj === "number") {
      return String(obj).toLowerCase().includes(searchLower);
    }
    if (Array.isArray(obj)) {
      return obj.some((item) => objectContainsSearchTerm(item, searchLower));
    }
    if (typeof obj === "object") {
      return Object.values(obj).some((value) =>
        objectContainsSearchTerm(value, searchLower)
      );
    }
    return false;
  };

  // Helper function to format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to calculate days remaining until valid_until
  const calculateDaysRemaining = (validUntilDate) => {
    if (!validUntilDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validDate = new Date(validUntilDate);
    validDate.setHours(0, 0, 0, 0);
    const diffTime = validDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "Expired";
    } else if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "1 day remaining";
    } else {
      return `${diffDays} days remaining`;
    }
  };

  // Handler for predefined date range selection
  const handleCreatedTimeRangeChange = (range) => {
    setCreatedTimeRange(range);
    setCreatedDateRangeDropdownOpen(false);
    if (range === "custom") {
      // Keep custom range dates if already set, otherwise null
      setCustomCreatedDateRange((prev) => ({
        fromDate: prev.fromDate,
        toDate: prev.toDate,
      }));
    } else {
      setCustomCreatedDateRange({ fromDate: null, toDate: null });
    }
  };

  // Handler for custom date input changes
  const handleCustomCreatedDateChange = (field, value) => {
    setCustomCreatedDateRange((prev) => ({
      ...prev,
      [field]: value ? new Date(value) : null,
    }));
  };

  // Apply custom date range
  const applyCustomCreatedDateRange = () => {
    setCreatedTimeRange("custom");
    setCreatedDateRangeDropdownOpen(false);
  };

  // Handler for predefined updated date range selection
  const handleUpdatedTimeRangeChange = (range) => {
    setUpdatedTimeRange(range);
    setUpdatedDateRangeDropdownOpen(false);
    if (range === "custom") {
      setCustomUpdatedDateRange((prev) => ({
        fromDate: prev.fromDate,
        toDate: prev.toDate,
      }));
    } else {
      setCustomUpdatedDateRange({ fromDate: null, toDate: null });
    }
  };

  // Handler for custom updated date input changes
  const handleCustomUpdatedDateChange = (field, value) => {
    setCustomUpdatedDateRange((prev) => ({
      ...prev,
      [field]: value ? new Date(value) : null,
    }));
  };

  // Apply custom updated date range
  const applyCustomUpdatedDateRange = () => {
    setUpdatedTimeRange("custom");
    setUpdatedDateRangeDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        createdDateRangeDropdownRef.current &&
        !createdDateRangeDropdownRef.current.contains(event.target)
      ) {
        setCreatedDateRangeDropdownOpen(false);
      }
      // Close updated date range dropdown
      if (
        updatedDateRangeDropdownRef.current &&
        !updatedDateRangeDropdownRef.current.contains(event.target)
      ) {
        setUpdatedDateRangeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [createdDateRangeDropdownRef, updatedDateRangeDropdownRef]);

  // Filter quotations based on search term and filter criteria
  const filteredQuotations = quotations.filter((quotation) => {
    const searchLower = searchTerm.toLowerCase();

    // Calculate net total for this quotation
    const netTotal = parseFloat(quotation?.grand_total || 0); // Use grand_total directly

    // Search across all fields using the helper, and also check net total
    const matchesSearch =
      !searchTerm ||
      objectContainsSearchTerm(quotation, searchLower) ||
      String(netTotal).toLowerCase().includes(searchLower);

    const matchesCustomerName =
      filters.customerName === "all" ||
      quotation?.client_name
        ?.toLowerCase()
        ?.includes(filters.customerName.toLowerCase());

    const matchesEmail =
      filters.email === "all" ||
      quotation?.client_address
        ?.toLowerCase()
        ?.includes(filters.email.toLowerCase());

    // Created date filter logic
    let matchesCreatedDate = true;
    if (createdTimeRange !== "all") {
      const createdAtDate = new Date(quotation.created_at);
      const now = new Date();

      if (createdTimeRange === "custom") {
        const from = customCreatedDateRange.fromDate;
        const to = customCreatedDateRange.toDate;
        if (from && to) {
          matchesCreatedDate =
            createdAtDate >= from &&
            createdAtDate <= new Date(to.setHours(23, 59, 59, 999)); // End of day
        } else if (from) {
          matchesCreatedDate = createdAtDate >= from;
        } else if (to) {
          matchesCreatedDate =
            createdAtDate <= new Date(to.setHours(23, 59, 59, 999));
        }
      } else {
        let daysAgo;
        if (createdTimeRange === "7days") daysAgo = 7;
        else if (createdTimeRange === "30days") daysAgo = 30;
        else if (createdTimeRange === "90days") daysAgo = 90;

        if (daysAgo) {
          const cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - daysAgo);
          matchesCreatedDate = createdAtDate >= cutoffDate;
        }
      }
    }

    // Updated At date filter logic
    let matchesUpdatedDate = true;
    if (updatedTimeRange !== "all") {
      const updatedAtDate = new Date(quotation.updated_at);
      const now = new Date();

      if (updatedTimeRange === "custom") {
        const from = customUpdatedDateRange.fromDate;
        const to = customUpdatedDateRange.toDate;
        if (from && to) {
          matchesUpdatedDate =
            updatedAtDate >= from &&
            updatedAtDate <= new Date(to.setHours(23, 59, 59, 999)); // End of day
        } else if (from) {
          matchesUpdatedDate = updatedAtDate >= from;
        } else if (to) {
          matchesUpdatedDate =
            updatedAtDate <= new Date(to.setHours(23, 59, 59, 999));
        }
      } else {
        let daysAgo;
        if (updatedTimeRange === "7days") daysAgo = 7;
        else if (updatedTimeRange === "30days") daysAgo = 30;
        else if (updatedTimeRange === "90days") daysAgo = 90;

        if (daysAgo) {
          const cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - daysAgo);
          matchesUpdatedDate = updatedAtDate >= cutoffDate;
        }
      }
    }

    // Payment filter logic
    let matchesPayment = true;
    switch (filters.payment) {
      case "lt50000":
        matchesPayment = netTotal < 50000;
        break;
      case "50001-100000":
        matchesPayment = netTotal >= 50001 && netTotal <= 100000;
        break;
      case "100001-400000":
        matchesPayment = netTotal >= 100001 && netTotal <= 400000;
        break;
      case "400001-500000":
        matchesPayment = netTotal >= 400001 && netTotal <= 500000;
        break;
      case "gt500000":
        matchesPayment = netTotal > 500000;
        break;
      default:
        matchesPayment = true;
    }

    // Contact filter logic
let matchesContact = true;
switch (filters.contact) {
  case "startsWith9":
    matchesContact = contact?.startsWith("9");
    break;
  case "startsWith8":
    matchesContact = contact?.startsWith("8");
    break;
  case "startsWith7":
    matchesContact = contact?.startsWith("7");
    break;
  default:
    matchesContact = true;
}

    // Item count filter logic
    const itemCount = quotation.items ? quotation.items.length : 0;
    let matchesItemCount = true;
    switch (filters.itemCount) {
      case "1-5":
        matchesItemCount = itemCount >= 1 && itemCount <= 5;
        break;
      case "6-20":
        matchesItemCount = itemCount >= 6 && itemCount <= 20;
        break;
      case "21-50":
        matchesItemCount = itemCount >= 21 && itemCount <= 50;
        break;
      case "51-100":
        matchesItemCount = itemCount >= 51 && itemCount <= 100;
        break;
      case "gt100":
        matchesItemCount = itemCount > 100;
        break;
      default:
        matchesItemCount = true;
    }

    return (
      matchesSearch &&
      matchesCustomerName &&
      matchesEmail &&
      matchesPayment &&
      matchesContact &&
      matchesItemCount &&
      matchesCreatedDate &&
      matchesUpdatedDate &&
      matchesContact
    );
  });

  // Helper function for form validation
  const validateFormData = (data) => {
    const errors = [];

    if (!data.customer_name || data.customer_name.trim() === "") {
      errors.push("Customer Name is required.");
    }
    if (!data.email || data.email.trim() === "") {
      errors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Please enter a valid email address.");
    }
    if (!data.contact_number || data.contact_number.trim() === "") {
      errors.push("Contact Number is required.");
    } else if (!/^\d{10}$/.test(data.contact_number)) {
      errors.push("Contact Number must be 10 digits.");
    }
    if (!data.address || data.address.trim() === "") {
      errors.push("Address is required.");
    }

    return errors;
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex);

  // Reset to first page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, createdTimeRange, customCreatedDateRange]);

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

  // Checkbox handlers for bulk selection
  const toggleQuotationSelection = (quotationId) => {
    setSelectedLeads((prev) =>
      prev.includes(quotationId)
        ? prev.filter((id) => id !== quotationId)
        : [...prev, quotationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === currentQuotations.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentQuotations.map((quotation) => quotation.id));
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedLeads.length} orders. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete them!",
    });
    if (result.isConfirmed) {
      try {
        // Simulate bulk delete API call; adjust based on actual API
        await Promise.all(
          selectedLeads.map((id) => api.delete(`/orders/${id}`)) // Changed endpoint to deletequotation
        );
        setQuotations((prev) =>
          prev.filter((quotation) => !selectedLeads.includes(quotation.id))
        );
        setSelectedLeads([]);
        await Swal.fire({
          icon: "success",
          title: " Deleted!",
          text: "Selected  have been removed.",
          confirmButtonColor: "#0e4053",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Bulk Delete Failed",
          text: err.message || "An error occurred during deletion.",
          confirmButtonColor: "#DD6B55",
        });
      }
    }
  };

  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  // New handlers for dropdown and modal
  const toggleDropdown = (quotationId) => {
    setActiveDropdown(activeDropdown === quotationId ? null : quotationId);

    // If we're opening the dropdown, scroll it into view
    if (activeDropdown !== quotationId) {
      // Use setTimeout to ensure the dropdown is rendered before scrolling
      setTimeout(() => {
        const dropdownElement = document.querySelector(
          `[data-dropdown-id="${quotationId}"]`
        );
        if (dropdownElement) {
          dropdownElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }, 0);
    }
  };

  const handleEdit = (quotation) => {
    // Navigate to QuotationCreate.jsx with the quotation data (deep clone to ensure serializability)
    navigate("/Order/new", {
      state: { quotation: JSON.parse(JSON.stringify(quotation)) },
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        const response = await api.get(`/deletequotation/${id}`); // Changed endpoint to deletequotation
        if (response.data.status || response.data.success) {
          setQuotations((prev) => prev.filter((q) => q.id !== id));
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: response.data.message || " has been removed.",
            confirmButtonColor: "#0e4053",
          });
        } else {
          throw new Error(response.data.message || "Server rejected delete");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete  Failed",
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
      // Assuming the API for update expects the new field names directly or maps them internally
      const response = await api.post(
        `/updatequotation/${editingQuotation.id}`,
        {
          client_name: formData.client_name,
          client_address: formData.client_address,
          package_type: formData.package_type,
          contact_number:formData.contact_number,
          plot_size: formData.plot_size,
          items: serviceItems.map((item) => ({
            item_name: item.item_name,
            qty: item.qty,
            rate: parseFloat(item.amount / item.qty).toFixed(2), // Calculate rate from amount and qty
            amount: parseFloat(item.amount).toFixed(2),
          })),
          grand_total: calculateTotalServiceCharge(), // Assuming this maps to grand_total
        }
      );

      if (response.status === 200) {
        // Update the quotations list with the edited data
        setQuotations(
          quotations.map((q) =>
            q.id === editingQuotation.id
              ? {
                  ...q,
                  ...formData,
                  // Update items and grand_total for the displayed quotation
                  items: serviceItems.map((item) => ({
                    item_name: item.item_name,
                    qty: item.qty,
                    rate: parseFloat(item.amount / item.qty).toFixed(2),
                    amount: parseFloat(item.amount).toFixed(2),
                  })),
                  grand_total: calculateTotalServiceCharge().toFixed(2),
                }
              : q
          )
        );
        Swal.fire({
          icon: "success",
          title: "Quotation Updated",
          text:
            response.data.message ||
            `${formData.client_name} was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error(response.data.message || "Failed to update ");
      }
    } catch (err) {
      let errorTitle = "Error Updating ";
      let errorMessage =
        "An error occurred while updating the quotation. Please try again.";

      if (err.response) {
        if (err.response.status === 422) {
          const errors = err.response.data.errors;
          if (errors) {
            const firstError = Object.values(errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            }
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorTitle = "Network Error";
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else {
        errorMessage = err.message;
      }

      await Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: "#DD6B55",
      });
    }
    setActiveDropdown(null);
  };

  // Cleanup image preview URLs when component unmounts - Removed as per new requirements
  useEffect(() => {
    // No image preview to clean up
    return () => {};
  }, []);

  // Helper function to calculate net total
  const calculateNetTotal = (items) => {
    return items
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      .toFixed(2);
  };
  const calculatePoints = (items) => {
    return items
      .reduce((sum, item) => sum + parseFloat(item.points || 0), 0)
      .toFixed(2);
  };

  // Function to open items modal
  const handleShowItems = (items, e) => {
    e.stopPropagation();
    setSelectedItems(items);
    setIsItemsModalOpen(true);
  };

  // Handle service item changes
  const handleServiceItemChange = (index, field, value) => {
    const updatedItems = [...serviceItems];
    if (field === "qty") {
      updatedItems[index][field] = Math.max(0, parseInt(value) || 0);
    } else if (field === "amount") {
      updatedItems[index][field] = Math.max(0, parseFloat(value) || 0);
    } else {
      updatedItems[index][field] = value;
    }
    setServiceItems(updatedItems);
  };

  // Add new service item
  const addServiceItem = () => {
    setServiceItems([
      ...serviceItems,
      {
        item_name: "",
        qty: 1,
        amount: 0,
      },
    ]);
  };

  // Remove service item
  const removeServiceItem = (index) => {
    const updatedItems = serviceItems.filter((_, i) => i !== index);
    setServiceItems(updatedItems);
  };

  // Calculate total service charge
  const calculateTotalServiceCharge = () => {
    return serviceItems.reduce((total, item) => {
      const itemTotal = parseFloat(item.amount) || 0;
      return total + itemTotal;
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Filters
      if (
        activeFilterDropdown === "customerName" &&
        customerNameDropdownRef.current &&
        !customerNameDropdownRef.current.contains(event.target)
      ) {
        setActiveFilterDropdown(null);
      }
      if (
        activeFilterDropdown === "email" &&
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(event.target)
      ) {
        setActiveFilterDropdown(null);
      }
      if (
        activeFilterDropdown === "payment" &&
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target)
      ) {
        setActiveFilterDropdown(null);
      }
      if (
        activeFilterDropdown === "contact" &&
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target)
      )
       {
        setActiveFilterDropdown(null);
      }
      if (
        activeFilterDropdown === "itemCount" &&
        itemCountDropdownRef.current &&
        !itemCountDropdownRef.current.contains(event.target)
      ) {
        setActiveFilterDropdown(null);
      }
      // Pagination dropdown
      if (
        isItemsPerPageDropdownOpen &&
        itemsPerPageDropdownRef.current &&
        !itemsPerPageDropdownRef.current.contains(event.target)
      ) {
        setIsItemsPerPageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeFilterDropdown, isItemsPerPageDropdownOpen]);

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading Order...
      </div>
    );
  }

  return (
    <div
      className={`min-h-[797px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full   ${
        isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
      } md:mx-auto`}
    >
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Title */}
        <h1 className="text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap">
          {dynamicHeaderTitle}
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
            text-sm md:text-base lg:text-base
          "
                onBlur={handleSearchBlur}
                autoFocus={isMobile && isSearchExpanded}
              />
            </div>
          )}
        </div>

        {/* Actions: Create Lead + Display Dropdown + Bulk Actions */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 lg:gap-4">
          {selectedLeads.length > 0 && (
            <>
              <button
                className="hover:bg-red-500
            bg-[#DD6B55] text-white
            h-[44px] px-5
            rounded-[8px]
            flex items-center justify-center
          "
                onClick={handleBulkDelete}
              >
                Bulk Delete
              </button>
            </>
          )}
          <span className="text-[#727A90] text-sm md:text-base lg:text-base whitespace-nowrap">
            Show
          </span>
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
      {/* Filter Section */}
      <div className="grid grid-cols-2 gap-3 mb-2 md:grid-cols-2 lg:grid-cols-4 md:gap-6 w-full">
        {/* Customer Name Dropdown */}
        <div className="relative" ref={customerNameDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center"
            onClick={() =>
              setActiveFilterDropdown(
                activeFilterDropdown === "customerName" ? null : "customerName"
              )
            }
          >
            <span className="truncate text-left flex-1">
              {filters.customerName === "all"
                ? "Customer Name"
                : filters.customerName}
            </span>
            {filters.customerName !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("customerName", "all");
                }}
              >
                <RxCross2 />
              </button>
            )}
            <img
              src="/caret-down.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
          </button>
          {activeFilterDropdown === "customerName" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  quotations?.map((q) => q.client_name)
                    .filter(Boolean)
                    .map((name) => name.toLowerCase().trim())
                )
              ).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    handleFilterChange("customerName", name);
                    setActiveFilterDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment Dropdown */}
        <div className="relative" ref={paymentDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[160px] lg:min-w-[160px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center"
            onClick={() =>
              setActiveFilterDropdown(
                activeFilterDropdown === "payment" ? null : "payment"
              )
            }
          >
            <span className="truncate text-left flex-1">
              {filters.payment === "all"
                ? "All Payments"
                : {
                    lt50000: "Less than ₹50,000",
                    "50001-100000": "Between ₹50,001 and ₹1,00,000",
                    "100001-400000": "Between ₹1,00,001 and ₹4,00,000",
                    "400001-500000": "Between ₹4,00,001 and ₹5,00,000",
                    gt500000: "Greater than ₹5,00,000",
                  }[filters.payment]}
            </span>
            {filters.payment !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("payment", "all");
                }}
              >
                <RxCross2 />
              </button>
            )}
            <img
              src="/caret-down.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
          </button>
          {activeFilterDropdown === "payment" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {[
                { value: "all", label: "All Payments" },
                { value: "lt50000", label: "Less than ₹50,000" },
                {
                  value: "50001-100000",
                  label: "Between ₹50,001 and ₹1,00,000",
                },
                {
                  value: "100001-400000",
                  label: "Between ₹1,00,001 and ₹4,00,000",
                },
                {
                  value: "400001-500000",
                  label: "Between ₹4,00,001 and ₹5,00,000",
                },
                { value: "gt500000", label: "Greater than ₹5,00,000" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange("payment", option.value);
                    setActiveFilterDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer ${
                    filters.payment === option.value
                      ? "bg-[#E7EFF8] text-[#ef7e1b] font-bold"
                      : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
     {/* Contact Dropdown
<div className="relative" ref={contactDropdownRef}>
  <button
    type="button"
    className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[160px] lg:min-w-[160px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center"
    onClick={() =>
      setActiveFilterDropdown(
        activeFilterDropdown === "contact" ? null : "contact"
      )
    }
  >
    <span className="truncate text-left flex-1">
      {filters.contact === "all"
        ? "All Contacts"
        : {
            startsWith9: "Starts with 9",
            startsWith8: "Starts with 8",
            startsWith7: "Starts with 7",
            startsWith6: "Starts with 6",
          }[filters.contact]}
    </span>

    {filters.contact !== "all" && (
      <button
        type="button"
        className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
        style={{ padding: 0, lineHeight: 1 }}
        tabIndex={-1}
        title="Clear filter"
        onClick={(e) => {
          e.stopPropagation();
          handleFilterChange("contact", "all");
        }}
      >
        <RxCross2 />
      </button>
    )}

    <img
      src="/caret-down.svg"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
    />
  </button>

  {activeFilterDropdown === "contact" && (
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
      {[
        { value: "all", label: "All Contacts" },
        { value: "startsWith9", label: "Starts with 9" },
        { value: "startsWith8", label: "Starts with 8" },
        { value: "startsWith7", label: "Starts with 7" },
        { value: "startsWith6", label: "Starts with 6" },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            handleFilterChange("contact", option.value);
            setActiveFilterDropdown(null);
          }}
          className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer ${
            filters.contact === option.value
              ? "bg-[#E7EFF8] text-[#ef7e1b] font-bold"
              : ""
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )}
</div> */}


        {/* Created Date Range Filter */}
        <div className="relative" ref={createdDateRangeDropdownRef}>
          <button
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setCreatedDateRangeDropdownOpen(!createdDateRangeDropdownOpen)
            }
          >
            <span className="truncate text-left flex-1">
              {createdTimeRange === "all" && "Created At"}
              {createdTimeRange === "7days" && "Last 7 Days"}
              {createdTimeRange === "30days" && "Last 30 Days"}
              {createdTimeRange === "90days" && "Last 90 Days"}
              {createdTimeRange === "custom" && (
                <span className="text-[10px] whitespace-nowrap">
                  {`${formatDateForDisplay(
                    customCreatedDateRange.fromDate
                  )} - ${formatDateForDisplay(customCreatedDateRange.toDate)}`}
                </span>
              )}
            </span>
            <img
              src="/caret-down.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
          </button>
          {createdDateRangeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 cursor-pointer">
              <div className="px-4 pt-3  text-[#4B5563]">
                <p className="text-sm font-medium">Select Range</p>
              </div>
              <div className="p-2">
                {/* Predefined ranges */}
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    createdTimeRange === "all"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleCreatedTimeRangeChange("all")}
                >
                  {" "}
                  <span>All Dates</span>{" "}
                  {createdTimeRange === "all" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    createdTimeRange === "7days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleCreatedTimeRangeChange("7days")}
                >
                  {" "}
                  <span>Last 7 Days</span>{" "}
                  {createdTimeRange === "7days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    createdTimeRange === "30days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleCreatedTimeRangeChange("30days")}
                >
                  {" "}
                  <span>Last 30 Days</span>{" "}
                  {createdTimeRange === "30days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    createdTimeRange === "90days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleCreatedTimeRangeChange("90days")}
                >
                  {" "}
                  <span>Last 90 Days</span>{" "}
                  {createdTimeRange === "90days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                {/* Custom date range */}
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-[#4B5563] mb-2">
                    Custom Range
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        className="w-full h-[48px] text-sm px-2 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        value={
                          customCreatedDateRange.fromDate
                            ? customCreatedDateRange.fromDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleCustomCreatedDateChange(
                            "fromDate",
                            e.target.value
                          )
                        }
                        max={
                          customCreatedDateRange.toDate
                            ? customCreatedDateRange.toDate
                                .toISOString()
                                .split("T")[0]
                            : new Date().toISOString().split("T")[0]
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        className="w-full h-[48px] text-sm px-2 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        value={
                          customCreatedDateRange.toDate
                            ? customCreatedDateRange.toDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleCustomCreatedDateChange(
                            "toDate",
                            e.target.value
                          )
                        }
                        min={
                          customCreatedDateRange.fromDate
                            ? customCreatedDateRange.fromDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <button
                    className="hover:bg-Duskwood-500 bg-[#ef7e1b] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center w-full"
                    onClick={applyCustomCreatedDateRange}
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Updated Date Range Filter */}
        <div className="relative" ref={updatedDateRangeDropdownRef}>
          <button
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setUpdatedDateRangeDropdownOpen(!updatedDateRangeDropdownOpen)
            }
          >
            <span className="truncate text-left flex-1">
              {updatedTimeRange === "all" && "Updated At"}
              {updatedTimeRange === "7days" && "Last 7 Days"}
              {updatedTimeRange === "30days" && "Last 30 Days"}
              {updatedTimeRange === "90days" && "Last 90 Days"}
              {updatedTimeRange === "custom" && (
                <span className="text-[10px] whitespace-nowrap">
                  {`${formatDateForDisplay(
                    customUpdatedDateRange.fromDate
                  )} - ${formatDateForDisplay(customUpdatedDateRange.toDate)}`}
                </span>
              )}
            </span>
            <img
              src="/caret-down.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
          </button>
          {updatedDateRangeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 cursor-pointer">
              <div className="px-4 pt-3  text-[#4B5563]">
                <p className="text-sm font-medium">Select Range</p>
              </div>
              <div className="p-2">
                {/* Predefined ranges */}
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "all"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleUpdatedTimeRangeChange("all")}
                >
                  {" "}
                  <span>All Dates</span>{" "}
                  {updatedTimeRange === "all" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "7days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleUpdatedTimeRangeChange("7days")}
                >
                  {" "}
                  <span>Last 7 Days</span>{" "}
                  {updatedTimeRange === "7days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "30days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleUpdatedTimeRangeChange("30days")}
                >
                  {" "}
                  <span>Last 30 Days</span>{" "}
                  {updatedTimeRange === "30days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "90days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleUpdatedTimeRangeChange("90days")}
                >
                  {" "}
                  <span>Last 90 Days</span>{" "}
                  {updatedTimeRange === "90days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}{" "}
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                {/* Custom date range */}
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-[#4B5563] mb-2">
                    Custom Range
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        className="w-full h-[48px] text-sm px-2 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        value={
                          customUpdatedDateRange.fromDate
                            ? customUpdatedDateRange.fromDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleCustomUpdatedDateChange(
                            "fromDate",
                            e.target.value
                          )
                        }
                        max={
                          customUpdatedDateRange.toDate
                            ? customUpdatedDateRange.toDate
                                .toISOString()
                                .split("T")[0]
                            : new Date().toISOString().split("T")[0]
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        className="w-full h-[48px] text-sm px-2 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        value={
                          customUpdatedDateRange.toDate
                            ? customUpdatedDateRange.toDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleCustomUpdatedDateChange(
                            "toDate",
                            e.target.value
                          )
                        }
                        min={
                          customUpdatedDateRange.fromDate
                            ? customUpdatedDateRange.fromDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <button
                    className="hover:bg-Duskwood-500 bg-[#ef7e1b] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center w-full"
                    onClick={applyCustomUpdatedDateRange}
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-[#4B5563]">
          Showing {filteredQuotations?.length} results for "{searchTerm}"
        </div>
      )}
      {/* Quotation List Table */}
      <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="text-left text-[#4B5563]">
              <th className="py-4 px-3 font-medium text-sm w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedLeads.length === currentQuotations?.length &&
                    currentQuotations?.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer"
                />
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[120px]">
                 Status
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[120px]">
                 No.
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Customer Name
              </th>

              <th className="py-4 px-3 font-medium text-sm w-[120px] whitespace-nowrap">
                Shop Name
              </th>
              <th className="py-4 px-3 font-medium text-sm w-[120px] whitespace-nowrap">
                Contact
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[180px]">
                Total
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Created
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Updated At
              </th>
              {/* <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Valid Until
              </th> */}
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Salesman
              </th>
              <th className="py-4 px-3 font-medium text-sm w-12">Action</th>
            </tr>
          </thead>
          {/* L */}
         <tbody>
  {currentQuotations?.length === 0 ? (
    <tr>
      <td colSpan="10" className="py-8 px-3 text-center text-[#4B5563]">
        {searchTerm
          ? "No orders found matching your search."
          : "No orders available."}
      </td>
    </tr>
  ) : (
    currentQuotations?.map((order) => (
      <React.Fragment key={order?.id}>
        <tr className="border-t border-[#E5E7EB]">
          <td className="py-4 px-3 w-12">
            <input
              type="checkbox"
              checked={selectedLeads.includes(order?.id)}
              onChange={() => toggleQuotationSelection(order?.id)}
              className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer bg-[#E9EAEA]"
            />
          </td>

          {/* ✅ Order Status */}
          <td
            className={`py-4 px-3 text-sm font-medium overflow-hidden truncate ${
              order?.order_type === "return"
                ? "text-red-600"
                : order?.order_type === "new"
                ? "text-blue-600"
                : "text-gray-700"
            }`}
          >
            {order?.order_type
              ? order?.order_type === "return"
                ? "Return"
                : "New Order"
              : "Pending"}
          </td>

          {/* ✅ Order Number */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            {order?.order_no || "-"}
          </td>

          {/* ✅ Shop Owner Name */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            <span className="text-[#1F2837] font-medium">
              {order?.shop_owner?.customer_name || "-"}
            </span>
          </td>

          {/* ✅ Notes */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            {order?.notes || "No notes provided"}
          </td>

          {/* ✅ Contact Number */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            {order?.shop_owner?.contact_number || "No contact"}
          </td>

          {/* ✅ Total Value + Items Count */}
          <td className="py-4 px-3 text-sm text-[#4B5563]">
            <div
              className="inline-flex items-center gap-2 bg-Duskwood-50 px-3 py-1.5 rounded-full hover:bg-Duskwood-100 transition-colors cursor-pointer"
              onClick={(e) => handleShowItems(order.items, e)}
            >
              <span className="font-medium text-[#1F2837] whitespace-nowrap">
                Rs {parseFloat(order.total_value || 0).toFixed(2)}
              </span>
              <div className="h-3.5 w-[1px] bg-Duskwood-200 "></div>
              <span className="text-xs text-Duskwood-600 whitespace-nowrap">
                {order?.items?.length || 0} items
              </span>
            </div>
          </td>

          {/* ✅ Created Date */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            {order?.created_at && (
              <>
                <span className="block text-sm">
                  {new Date(order.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                <span className="block text-Duskwood-600 text-xs mt-1">
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </td>

          {/* ✅ Updated Date */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            {order?.updated_at && (
              <>
                <span className="block text-sm">
                  {new Date(order.updated_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                <span className="block text-Duskwood-600 text-xs mt-1">
                  {new Date(order.updated_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </td>

          {/* ✅ Salesman Name */}
          <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
            {order?.salesman?.name || "-"}
          </td>

          {/* ✅ Actions */}
          <td className="py-4 px-3 relative">
            <button
              onClick={() => toggleDropdown(order?.id)}
              className="p-2 text-[#4B5563] hover:bg-Duskwood-200 rounded-full transition-colors"
            >
              <TbDotsVertical className="w-4 h-4" />
            </button>
            {activeDropdown === order?.id && (
              <div className="relative">
                <div
                  data-dropdown-id={order?.id}
                  className="absolute left-3 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden"
                >
                  {/* <button
                    onClick={() => handleEdit(order)}
                    className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
                  >
                    <FiEdit className="mr-2 w-4 h-4 group-hover:text-white" />
                    <span className="group-hover:text-white">Edit</span>
                  </button> */}

                  <svg
                    className="w-full h-[1px]"
                    viewBox="0 0 100 1"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon points="0,0 50,1 100,0" fill="#E5E7EB" />
                  </svg>

                  <button
                    onClick={() => handleDelete(order?.id)}
                    className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
                  >
                    <FiTrash2 className="mr-2 w-4 h-4 group-hover:text-white" />
                    <span className="group-hover:text-white">Delete</span>
                  </button>
                </div>
              </div>
            )}
          </td>
        </tr>
      </React.Fragment>
    ))
  )}
</tbody>

        </table>
      </div>
      {/* Quotation List Cards for Mobile */}
      <div className="md:hidden w-full space-y-6 pb-24 flex-grow overflow-x-auto">
        {currentQuotations.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4  rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.5a2.5 2.5 0 00-2.5 2.5v.5a2 2 0 01-2 2h-3a2 2 0 01-2-2v-.5a2.5 2.5 0 00-2.5-2.5H4"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm
                ? "No quotations found matching your search."
                : "No quotations available."}
            </p>
          </div>
        ) : (
          currentQuotations.map((quotation) => {
            return (
              <div
                key={quotation?.id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg"
              >
                {/* Header Section */}
                <div className="p-4 sm:p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(quotation?.id)}
                        onChange={() => toggleQuotationSelection(quotation?.id)}
                        className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500 focus:ring-2"
                      />

                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
                          {/* Removed profile_pic rendering */}
                          <img
                            src="/dummyavatar.jpeg"
                            alt={quotation?.client_name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          {/* Quotation ID */}
                          <div className="text-xs text-Duskwood-600 font-semibold ">
                            Quotation No: {quotation?.quote_no}
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">
                            {quotation?.client_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {quotation?.client_address}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {quotation?.created_at ? (
                              <>
                                <span className="block text-xs">
                                  {new Date(
                                    quotation?.created_at
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                                <span className="block text-Duskwood-600 text-xs mt-1">
                                  {formatDateForDisplay(quotation?.created_at)}
                                </span>
                              </>
                            ) : (
                              ""
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(quotation?.id)}
                        className="p-1 text-[#4B5563] rounded-full hover:bg-gray-100"
                      >
                        <TbDotsVertical className="w-4 h-4" />
                      </button>

                      {activeDropdown === quotation?.id && (
                        <div className="absolute right-0 mt-1 w-24 sm:w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden">
                          <div>
                            {/* EDIT button */}
                            <button
                              onClick={() => handleEdit(quotation)}
                              className="group flex items-center px-3 py-2 text-xs text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="mr-2 w-3 h-3 fill-current text-[#4B5563] group-hover:text-white transition-colors"
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
                              <polygon points="0,0 50,1 100,0" fill="#E5E7EB" />
                            </svg>

                            {/* DELETE button */}
                            <button
                              onClick={() => handleDelete(quotation?.id)}
                              className="group flex items-center px-3 py-2 text-xs text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="mr-2 w-3 h-3 fill-current text-[#4B5563] group-hover:text-white transition-colors"
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
                </div>

                {/* Details Section */}
                <div className="p-3 sm:p-4 space-y-3">
                  {/* Total Row (matches desktop, clickable for items modal) */}
                  <div
                    className="flex items-center space-x-1 p-2 bg-Duskwood-50 rounded-lg hover:bg-Duskwood-100 transition-colors duration-200 mb-2 cursor-pointer"
                    onClick={(e) => handleShowItems(quotation?.items, e)}
                  >
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-5 h-5 text-Duskwood-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M12 8v8m0 0l-3-3m3 3l3-3"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      <p className="text-[10px] ml-1 font-medium text-Duskwood-600 uppercase tracking-wide">
                        Total
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] ml-1 text-Duskwood-900 font-bold">
                          Rs {parseFloat(quotation?.grand_total).toFixed(2)}
                        </p>
                        <span className="text-xs text-Duskwood-600">
                          ({quotation?.items.length} items)
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Contact Number Row */}
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M3 5a2 2 0 002-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Shop Name
                      </p>
                    <p className="text-[10px] ml-1 text-gray-900">
  {quotation?.lead?.requirements || "No requirements provided"}
</p>

                    </div>
                  </div>
                  {/* Created At Row */}
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Created At
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900">
                        {quotation?.created_at ? (
                          <>
                            <span className="block text-xs">
                              {new Date(
                                quotation?.created_at
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                            <span className="block text-Duskwood-600 text-xs mt-1">
                              {formatDateForDisplay(quotation?.created_at)}
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Updated At Row */}
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M4 4v5h.582m15.356-2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Updated At
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900">
                        {quotation?.updated_at ? (
                          <>
                            <span className="block text-xs">
                              {new Date(
                                quotation?.updated_at
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                            <span className="block text-Duskwood-600 text-xs mt-1">
                              {formatDateForDisplay(quotation?.updated_at)}
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Valid Until Row */}
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      {/* <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Valid Until
                      </p> */}
                      <p className="text-[10px] ml-1 text-gray-900">
                        {quotation?.valid_until ? (
                          <>
                            <span className="block text-xs">
                              {formatDateForDisplay(quotation?.valid_until)}
                            </span>
                            <span
                              className={`block text-xs mt-1 ${
                                calculateDaysRemaining(
                                  quotation?.valid_until
                                ) === "Expired"
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              ({calculateDaysRemaining(quotation?.valid_until)})
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Removed WhatsApp, Status, and old items table UI */}
                </div>
              </div>
            );
          })
        )}
      </div>{" "}
      {/* Items Modal */}
      {isItemsModalOpen && selectedItems && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => setIsItemsModalOpen(false)}
          />

          {/* Glassmorphism modal container */}
          <div
            className="w-11/12 max-w-[1000px] max-h-[90vh] overflow-y-auto p-6 md:p-8
              rounded-2xl
              bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
              shadow-lg
              relative z-10 custom-scrollbar"
          >
            {/* Close button */}
            <button
              onClick={() => setIsItemsModalOpen(false)}
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
            <h2 className="text-[24px] sm:text-[29px] font-medium text-[#1F2837] mb-8">
              Items Details
            </h2>
           
          
            {/* Items Table */}
            <div className=" rounded-[12px] overflow-hidden">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Item Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Rate
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className=" divide-y divide-[#E5E7EB]">
                  {selectedItems?.map((item, index) => (
                     console.log(selectedItems,"hello farhan"),
                    <tr key={index} className="">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        Rs {parseFloat(item.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        Rs {parseFloat(item.points).toFixed(2)}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        {item.customerName}
                      </td>
                    </tr>
                  ))}
                  {/* <tr className=" font-medium">
                    <td
                      colSpan="3"
                      className="px-6 py-4 text-right text-sm text-[#1F2837]"
                    >
                      Net Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1F2837]">
                      Rs {calculateNetTotal(selectedItems)}
                    </td>
                  </tr> */}
                </tbody>
              </table>
            </div>

            {/* Close button */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setIsItemsModalOpen(false)}
                className="w-full md:w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pagination Controls */}
      {filteredQuotations?.length > 0 && (
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
              : "group hover:bg-Duskwood-200 "
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
              <span>({filteredQuotations?.length} total)</span>
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
              : "group hover:bg-Duskwood-200 "
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

export default TestOrder;


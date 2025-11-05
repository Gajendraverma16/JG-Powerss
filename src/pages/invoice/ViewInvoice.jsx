import React, { useState, useEffect, useRef, useContext } from "react";
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
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Import useParams, useNavigate, and useLocation
import { useAuth } from "../../auth/AuthContext";
import { RxCross2 } from "react-icons/rx";

import "../../styles/scrollbar.css";
import { SidebarContext } from "../../components/Layout";

const ViewInvoice = () => {
  const { statusId, statusName } = useParams(); // Get statusId and statusName from URL
  const navigate = useNavigate(); // Add useNavigate
  const location = useLocation();

  const dynamicApiEndpoint = statusId
    ? `/leadstatus/${statusId}`
    : "/showinvoice";
  const dynamicHeaderTitle = "All Invoice List";
  const dynamicModalTitle = statusName
    ? `Edit ${decodeURIComponent(statusName)} Item`
    : "Edit Invoice";

  // Mobile detection and search state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Consume SidebarContext
  const { isCollapsed } = useContext(SidebarContext);

  // Search, filter, and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    payment: "all", // New payment filter
    itemCount: "all", // New item count filter
    invoiceDateRange: "all", // Changed from invoiceDate to invoiceDateRange
    expiryDate: "all", // New Expiry Date filter
    billTo: "all", // New Bill To filter
    shipTo: "all", // New Ship To filter
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Checkbox selection state for bulk operations
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("Inprogress"); // Add bulk status state

  // New state for dropdown and modal
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    contact: "",
    address: "",
    company_name: "",
    status: "",
    invoice_date: "",
    expiry_date: "",
  });

  const [serviceItems, setServiceItems] = useState([
    {
      serviceName: "",
      quantity: 1,
      totalItemPrice: 0,
    },
  ]);

  // Add state for expanded row to show all items
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  // New state for modal to display items and calculate net total for each invoice
  const [selectedItems, setSelectedItems] = useState(null);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  // State for Created Date Range Filter
  const [createdTimeRange, setCreatedTimeRange] = useState("all"); // 'all', '7days', '30days', '90days', 'custom'
  const [customCreatedDateRange, setCustomCreatedDateRange] = useState({
    fromDate: new Date(),
    toDate: new Date(),
  });
  const [createdDateRangeDropdownOpen, setCreatedDateRangeDropdownOpen] =
    useState(false);
  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);

  // Ref for created date range dropdown
  const createdDateRangeDropdownRef = useRef(null);
  const itemsPerPageDropdownRef = useRef(null); // Add this ref

  // Refs for filter dropdowns
  const billToDropdownRef = useRef(null);
  const shipToDropdownRef = useRef(null);
  const paymentDropdownRef = useRef(null);
  const invoiceDateRangeDropdownRef = useRef(null);

  // State and callback ref for the currently open action dropdown
  const [actionDropdownNode, setActionDropdownNode] = useState(null);

  const { user, rolePermissions } = useAuth();

  // Extract module name from URL (e.g., 'invoice' from '/invoice/all')
  const pathParts = location.pathname.split("/").filter(Boolean);
  const moduleNameFromUrl = pathParts[0] ? pathParts[0].toLowerCase() : null;

  // Find permissions for the module from rolePermissions
  const permissionsForInvoiceModule = React.useMemo(() => {
    if (rolePermissions === "ALL") {
      // Grant all positive permissions, do NOT include any inverse permissions
      return ["create", "edit", "delete", "view"];
    }
    if (!moduleNameFromUrl || !Array.isArray(rolePermissions)) return [];
    const found = rolePermissions.find(
      (perm) => perm.module && perm.module.toLowerCase() === moduleNameFromUrl
    );
    return found ? found.permissions : [];
  }, [rolePermissions, moduleNameFromUrl]);

  // Permission checks for bulk actions (optional, for future use)
  const hasBulkDeletePermission =
    rolePermissions === "ALL" || !rolePermissions?.includes("noBulkDelete");

  const getInvoiceStatus = (invoice) => {
    if (!invoice) return null;
    const balance = parseFloat(invoice.balance);
    const received = parseFloat(invoice.received_amount);

    if (isNaN(balance) || isNaN(received)) {
      return "Unknown"; // or some default
    }

    if (balance <= 0) {
      return "Paid";
    }
    if (received > 0) {
      return "Partially Paid";
    }
    return "Unpaid";
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get(dynamicApiEndpoint); // Use dynamicApiEndpoint
        if (response.data.success) {
          setInvoices(response.data.data); // Access data.data for invoices
        } else {
          setError("Failed to fetch invoices");
        }
      } catch (err) {
        setError("Error fetching invoices: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
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

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

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

  // Helper to format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle created time range change
  const handleCreatedTimeRangeChange = (range) => {
    setCreatedTimeRange(range);
    setCreatedDateRangeDropdownOpen(false); // Close dropdown after selection
    if (range === "custom") {
      // Keep custom range dates if already set, otherwise null
      setCustomCreatedDateRange((prev) => ({
        fromDate: prev.fromDate,
        toDate: prev.toDate,
      }));
    } else {
      setCustomCreatedDateRange({ fromDate: null, toDate: null }); // Clear custom range if a predefined range is selected
    }
  };

  // Handle custom created date changes
  const handleCustomCreatedDateChange = (field, dateString) => {
    setCustomCreatedDateRange((prev) => ({
      ...prev,
      [field]: dateString ? new Date(dateString) : null,
    }));
    setCreatedTimeRange("custom"); // Set to custom when dates are picked
  };

  // Apply custom created date range
  const applyCustomCreatedDateRange = () => {
    setCreatedTimeRange("custom");
    setCreatedDateRangeDropdownOpen(false);
  };

  // Filter invoices based on search term and filter criteria
  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();

    // Calculate net total for this invoice
    const netTotal = parseFloat(
      invoice.items && invoice.items.length > 0
        ? invoice.items.reduce(
            (sum, item) => sum + parseFloat(item.total_price || 0),
            0
          )
        : 0
    );

    // Search across all fields using the helper, and also check net total
    const matchesSearch =
      !searchTerm ||
      objectContainsSearchTerm(invoice, searchLower) ||
      String(netTotal).toLowerCase().includes(searchLower);

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

    // Item count filter logic
    const itemCount = invoice.items ? invoice.items.length : 0;
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

    // New Expiry Date filter logic
    const matchesExpiryDate =
      filters.expiryDate === "all" ||
      (invoice?.expiry_date
        ? new Date(invoice.expiry_date).toISOString().split("T")[0] ===
          filters.expiryDate
        : false);

    // New Invoice Date Range filter logic
    let matchesInvoiceDateRange = true;
    if (filters.invoiceDateRange !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      const updatedAtDate = invoice.updated_at
        ? new Date(invoice.updated_at)
        : null;
      if (updatedAtDate) {
        updatedAtDate.setHours(0, 0, 0, 0); // Normalize updated_at date

        switch (filters.invoiceDateRange) {
          case "today":
            matchesInvoiceDateRange =
              updatedAtDate.getTime() === today.getTime();
            break;
          case "last7days":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            matchesInvoiceDateRange =
              updatedAtDate >= sevenDaysAgo && updatedAtDate <= today;
            break;
          case "last30days":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            matchesInvoiceDateRange =
              updatedAtDate >= thirtyDaysAgo && updatedAtDate <= today;
            break;
          case "last6months":
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            matchesInvoiceDateRange =
              updatedAtDate >= sixMonthsAgo && updatedAtDate <= today;
            break;
          case "last12months":
            const twelveMonthsAgo = new Date(today);
            twelveMonthsAgo.setFullYear(today.getFullYear() - 1);
            matchesInvoiceDateRange =
              updatedAtDate >= twelveMonthsAgo && updatedAtDate <= today;
            break;
          default:
            matchesInvoiceDateRange = true;
        }
      } else {
        matchesInvoiceDateRange = false; // If no updated_at date, it can't match any date range
      }
    }

    // New Created Date Range filter logic
    let matchesCreatedDate = true;
    if (createdTimeRange !== "all") {
      const createdAtDate = new Date(invoice.created_at);
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

    // New Bill To filter logic
    const matchesBillTo =
      filters.billTo === "all" ||
      invoice?.bill_to_name
        ?.toLowerCase()
        .includes(filters.billTo.toLowerCase());

    // New Ship To filter logic
    const matchesShipTo =
      filters.shipTo === "all" ||
      invoice?.ship_to_name
        ?.toLowerCase()
        .includes(filters.shipTo.toLowerCase());

    return (
      matchesSearch &&
      matchesPayment &&
      matchesItemCount &&
      matchesInvoiceDateRange && // Updated to use new filter
      matchesExpiryDate &&
      matchesCreatedDate && // Add new created date filter
      matchesBillTo &&
      matchesShipTo
    );
  });

  // Helper function for form validation
  const validateFormData = (data) => {
    const errors = [];

    if (!data.customer_name || data.customer_name.trim() === "") {
      errors.push("Customer Name is required.");
    }
    if (!data.contact || data.contact.trim() === "") {
      errors.push("Contact Number is required.");
    } else if (!/^\d{10}$/.test(data.contact)) {
      errors.push("Contact Number must be 10 digits.");
    }
    if (!data.address || data.address.trim() === "") {
      errors.push("Address is required.");
    }
    if (!data.company_name || data.company_name.trim() === "") {
      errors.push("Company Name is required.");
    }
    if (!data.status || data.status.trim() === "") {
      errors.push("Status is required.");
    }
    if (!data.invoice_date || data.invoice_date.trim() === "") {
      errors.push("Invoice Date is required.");
    }
    if (!data.expiry_date || data.expiry_date.trim() === "") {
      errors.push("Expiry Date is required.");
    }

    return errors;
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to first page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filters,
    createdTimeRange,
    customCreatedDateRange,
    filters.billTo,
    filters.shipTo,
  ]);

  // Close created date range dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const refs = [
        billToDropdownRef,
        shipToDropdownRef,
        paymentDropdownRef,
        invoiceDateRangeDropdownRef,
        itemsPerPageDropdownRef, // Add this ref
      ];
      const isClickInsideAny = refs.some(
        (ref) => ref.current && ref.current.contains(event.target)
      );
      if (!isClickInsideAny && activeDropdown) {
        setActiveDropdown(null);
      }
      if (
        createdDateRangeDropdownOpen &&
        createdDateRangeDropdownRef.current &&
        !createdDateRangeDropdownRef.current.contains(event.target)
      ) {
        setCreatedDateRangeDropdownOpen(false);
      }
      // Close items per page dropdown
      if (
        isItemsPerPageDropdownOpen &&
        itemsPerPageDropdownRef.current &&
        !itemsPerPageDropdownRef.current.contains(event.target)
      ) {
        setIsItemsPerPageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    activeDropdown,
    createdDateRangeDropdownOpen,
    isItemsPerPageDropdownOpen,
  ]); // Add isItemsPerPageDropdownOpen to dependencies

  // Close filter dropdowns on click outside (for action dropdown only)
  useEffect(() => {
    const handleMouseDownOutside = (event) => {
      console.log("Document mousedown", event.target);
      if (
        activeDropdown &&
        actionDropdownNode &&
        !actionDropdownNode.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDownOutside);
    return () =>
      document.removeEventListener("mousedown", handleMouseDownOutside);
  }, [activeDropdown, actionDropdownNode]);

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
  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedLeads((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === currentInvoices.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentInvoices.map((invoice) => invoice.id));
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedLeads.length} invoice(s). This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete them!",
    });
    if (result.isConfirmed) {
      let deletedCount = 0;
      let failedCount = 0;
      let failedIds = [];
      Swal.fire({
        title: "Deleting...",
        html: `Deleting <b>0</b>/${selectedLeads.length} invoices...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      for (let i = 0; i < selectedLeads.length; i++) {
        const id = selectedLeads[i];
        try {
          const response = await api.delete(`/deleteinvoice/${id}`);
          if (response.data.status || response.data.success) {
            setInvoices((prev) => prev.filter((q) => q.id !== id));
            deletedCount++;
          } else {
            failedCount++;
            failedIds.push(id);
          }
        } catch (err) {
          failedCount++;
          failedIds.push(id);
        }
        Swal.update({
          html: `Deleting <b>${i + 1}</b>/${selectedLeads.length} invoices...`,
        });
      }
      setSelectedLeads([]);
      Swal.close();
      if (failedCount === 0) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Selected  have been removed.",
          confirmButtonColor: "#0e4053",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Some Deletes Failed",
          html: `Deleted: ${deletedCount}<br>Failed: ${failedCount}<br>Failed IDs: ${failedIds.join(
            ", "
          )}`,
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
  const toggleDropdown = (invoiceId) => {
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);

    // If we're opening the dropdown, scroll it into view
    if (activeDropdown !== invoiceId) {
      // Use setTimeout to ensure the dropdown is rendered before scrolling
      setTimeout(() => {
        const dropdownElement = document.querySelector(
          `[data-dropdown-id="${invoiceId}"]`
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

  const handleEdit = (invoice) => {
    navigate("/invoice/create", { state: { invoice, mode: "edit" } });
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
        const response = await api.delete(`/deleteinvoice/${id}`); // Changed endpoint to deleteinvoice
        if (response.data.status || response.data.success) {
          setInvoices((prev) => prev.filter((q) => q.id !== id));
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
          title: "Delete Invoice Failed",
          text: err.message,
          confirmButtonColor: "#DD6B55",
        });
      }
    }
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData);

    if (errors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        html: errors.join("<br>"),
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    try {
      const response = await api.post(`/updateinvoice/${editingInvoice.id}`, {
        ...formData,
        items: serviceItems.map((item) => ({
          service: item.serviceName,
          quantity: item.quantity,
          total_price: parseFloat(item.totalItemPrice).toFixed(2),
        })),
        totalAmount: calculateTotalServiceCharge(),
      });

      if (response.status === 200) {
        // Update the invoices list with the edited data
        setInvoices(
          invoices.map((q) =>
            q.id === editingInvoice.id
              ? {
                  ...q,
                  ...formData,
                  items: serviceItems.map((item) => ({
                    service: item.serviceName,
                    quantity: item.quantity,
                    total_price: parseFloat(item.totalItemPrice).toFixed(2),
                  })),
                  totalAmount: calculateTotalServiceCharge(),
                }
              : q
          )
        );
        setIsModalOpen(false);
        Swal.fire({
          icon: "success",
          title: "Invoice Updated",
          text:
            response.data.message ||
            `${formData.customer_name} was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error(response.data.message || "Failed to update invoice");
      }
    } catch (err) {
      let errorTitle = "Error Updating Invoice";
      let errorMessage =
        "An error occurred while updating the invoice. Please try again.";

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
    if (Array.isArray(items)) {
      return items
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
        .toFixed(2);
    }
    return (0).toFixed(2);
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
    if (field === "quantity") {
      updatedItems[index][field] = Math.max(0, parseInt(value) || 0);
    } else if (field === "totalItemPrice") {
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
        serviceName: "",
        quantity: 1,
        totalItemPrice: 0,
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
      const itemTotal = parseFloat(item.totalItemPrice) || 0;
      return total + itemTotal;
    }, 0);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading 
      </div>
    );
  }

  return (
    <div
      className={`min-h-[797px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full   ${
        isCollapsed
          ? "lg:max-w-[85vw] md:w-[85vw]"
          : "lg:max-w-[75vw] md:w-[80vw]"
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
          <span className="text-[#727A90] text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
            Show
          </span>
          <div className="relative" ref={itemsPerPageDropdownRef}>
            {" "}
            {/* Add ref here */}
            <button
              type="button"
              className="
                relative appearance-none h-[32px] sm:h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-8 sm:pr-10 md:pr-15 lg:pr-15 w-full min-w-[56px] sm:min-w-[72px] md:min-w-[88px] lg:min-w-[88px] bg-white border border-[#E9EAEA] rounded-[8px]  text-[#242729] text-[10px] sm:text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center box-border
              "
              onClick={() =>
                setIsItemsPerPageDropdownOpen(!isItemsPerPageDropdownOpen)
              }
            >
              <span>{itemsPerPage}</span>
               <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
            </button>
            {isItemsPerPageDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar box-border">
                {[5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-xs sm:text-sm md:text-base lg:text-base ${
                      itemsPerPage === num
                        ? "bg-[#E7EFF8] font-bold text-[#ef7e1b]"
                        : "text-[#545454]"
                    }`}
                    onClick={() => {
                      handleItemsPerPageChange(num);
                      setIsItemsPerPageDropdownOpen(false);
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Filter Section */}
      <div className="w-full grid grid-cols-2 gap-3 mb-2 lg:grid-cols-5 md:gap-6">
        {/* Bill To Dropdown */}
        <div className="relative" ref={billToDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(activeDropdown === "billTo" ? null : "billTo")
            }
          >
            <span className="truncate text-left flex-1">
              {filters.billTo === "all" ? "Bill To" : filters.billTo}
            </span>
            {/* Cross to clear filter */}
            {filters.billTo !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("billTo", "all");
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
          {activeDropdown === "billTo" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  invoices
                    .map((invoice) => invoice.bill_to_name)
                    .filter(Boolean)
                    .map((name) => name.toLowerCase().trim())
                )
              ).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    handleFilterChange("billTo", name);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Ship To Dropdown */}
        <div className="relative" ref={shipToDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(activeDropdown === "shipTo" ? null : "shipTo")
            }
          >
            <span className="truncate text-left flex-1">
              {filters.shipTo === "all" ? "Ship To" : filters.shipTo}
            </span>
            {/* Cross to clear filter */}
            {filters.shipTo !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("shipTo", "all");
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
          {activeDropdown === "shipTo" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  invoices
                    .map((invoice) => invoice.ship_to_name)
                    .filter(Boolean)
                    .map((name) => name.toLowerCase().trim())
                )
              ).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    handleFilterChange("shipTo", name);
                    setActiveDropdown(null);
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
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(activeDropdown === "payment" ? null : "payment")
            }
          >
            <span className="truncate text-left flex-1">
              {(() => {
                switch (filters.payment) {
                  case "lt50000":
                    return "< ₹50,000";
                  case "50001-100000":
                    return "₹50,001-1,00,000";
                  case "100001-400000":
                    return "₹1,00,001-4,00,000";
                  case "400001-500000":
                    return "₹4,00,001-5,00,000";
                  case "gt500000":
                    return "> ₹5,00,000";
                  default:
                    return "All Payments";
                }
              })()}
            </span>
            {/* Cross to clear filter */}
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
          {activeDropdown === "payment" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("payment", "all");
                  setActiveDropdown(null);
                }}
              >
                All Payments
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("payment", "lt50000");
                  setActiveDropdown(null);
                }}
              >
                {"< ₹50,000"}
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("payment", "50001-100000");
                  setActiveDropdown(null);
                }}
              >
                {"₹50,001-1,00,000"}
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("payment", "100001-400000");
                  setActiveDropdown(null);
                }}
              >
                {"₹1,00,001-4,00,000"}
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("payment", "400001-500000");
                  setActiveDropdown(null);
                }}
              >
                {"₹4,00,001-5,00,000"}
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("payment", "gt500000");
                  setActiveDropdown(null);
                }}
              >
                {"> ₹5,00,000"}
              </button>
            </div>
          )}
        </div>
        {/* Updated At Date Range Filter (was Invoice Date) */}
        <div className="relative" ref={invoiceDateRangeDropdownRef}>
          <button
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(
                activeDropdown === "invoiceDateRange"
                  ? null
                  : "invoiceDateRange"
              )
            }
          >
            <span className="truncate text-left flex-1">
              {(() => {
                switch (filters.invoiceDateRange) {
                  case "today":
                    return "Updated Today";
                  case "last7days":
                    return "Updated Last 7 Days";
                  case "last30days":
                    return "Updated Last 30 Days";
                  case "last6months":
                    return "Updated Last 6 Months";
                  case "last12months":
                    return "Updated Last 12 Months";
                  default:
                    return "Updated At";
                }
              })()}
            </span>
            {/* Cross to clear filter */}
            {filters.invoiceDateRange !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("invoiceDateRange", "all");
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
          {activeDropdown === "invoiceDateRange" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("invoiceDateRange", "all");
                  setActiveDropdown(null);
                }}
              >
                All Dates
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("invoiceDateRange", "today");
                  setActiveDropdown(null);
                }}
              >
                Today
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("invoiceDateRange", "last7days");
                  setActiveDropdown(null);
                }}
              >
                Last 7 Days
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("invoiceDateRange", "last30days");
                  setActiveDropdown(null);
                }}
              >
                Last 30 Days
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("invoiceDateRange", "last6months");
                  setActiveDropdown(null);
                }}
              >
                Last 6 Months
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                onClick={() => {
                  handleFilterChange("invoiceDateRange", "last12months");
                  setActiveDropdown(null);
                }}
              >
                Last 12 Months
              </button>
            </div>
          )}
        </div>
        {/* Created Date Range Filter */}
        <div
          className="relative col-span-2 lg:col-span-1"
          ref={createdDateRangeDropdownRef}
        >
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
      </div>
      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-[#4B5563]">
          Showing {filteredInvoices.length} results for "{searchTerm}"
        </div>
      )}
      {/* Invoice List Table */}
      <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="text-left text-[#4B5563]">
              <th className="py-4 px-3 font-medium text-sm w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedLeads.length === currentInvoices.length &&
                    currentInvoices.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer"
                />
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[120px]">
                Invoice No
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Bill To
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[150px]">
                Ship To
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[180px]">
                Total
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[120px]">
                Created At
              </th>
              <th className="py-4 px-3 font-medium text-sm whitespace-nowrap w-[120px]">
                Updated At
              </th>
              <th className="py-4 px-3 font-medium text-sm w-12 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="py-8 px-3 text-center text-[#4B5563]"
                >
                  {searchTerm
                    ? "No invoices found matching your search."
                    : "No invoices available."}
                </td>
              </tr>
            ) : (
              currentInvoices.map((invoice) => (
                <React.Fragment key={invoice.id}>
                  <tr className="border-t border-[#E5E7EB]">
                    <td className="py-4 px-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer bg-[#E9EAEA]"
                      />
                    </td>
                    <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
                      {invoice.invoice_no}
                    </td>
                    <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
                      <span className="text-[#1F2837] font-medium">
                        {invoice.bill_to_name}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
                      <span className="text-[#1F2837] font-medium">
                        {invoice.ship_to_name}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-sm text-[#4B5563]">
                      <div
                        className="inline-flex items-center gap-2 bg-Duskwood-50 px-3 py-1.5 rounded-full hover:bg-Duskwood-100 transition-colors cursor-pointer"
                        onClick={(e) => handleShowItems(invoice.items, e)}
                      >
                        <span className="font-medium text-[#1F2837]">
                          Rs {invoice.grand_total}
                        </span>
                        <div className="h-3.5 w-[1px] bg-Duskwood-200"></div>
                        <span className="text-xs text-Duskwood-600">
                          {invoice.items?.length} items
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
                      {invoice.created_at ? (
                        <>
                          <span className="block text-sm">
                            {new Date(invoice.created_at).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </span>
                          <span className="block text-Duskwood-600 text-xs mt-1">
                            {formatDateForDisplay(invoice.created_at)}
                          </span>
                        </>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="py-4 px-3 text-sm text-[#4B5563] overflow-hidden truncate">
                      {invoice.updated_at ? (
                        <>
                          <span className="block text-sm">
                            {new Date(invoice.updated_at).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </span>
                          <span className="block text-Duskwood-600 text-xs mt-1">
                            {formatDateForDisplay(invoice.updated_at)}
                          </span>
                        </>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="py-4 px-3 relative">
                      <button
                        onClick={() => toggleDropdown(invoice.id)}
                        className="p-2 text-[#4B5563] hover:bg-Duskwood-200 hover:text-white rounded-full transition-colors "
                      >
                        <TbDotsVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === invoice.id && (
                        <div className="relative">
                          <div
                            ref={
                              activeDropdown === invoice.id
                                ? setActionDropdownNode
                                : null
                            }
                            data-dropdown-id={invoice.id}
                            className="absolute left-3 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden"
                            onMouseDown={(e) => {
                              console.log("Dropdown mousedown", invoice.id);
                              e.stopPropagation();
                            }} // Prevent dropdown from closing
                          >
                            {/* EDIT button - only if permission */}
                            {permissionsForInvoiceModule.includes("edit") && (
                              <button
                                onClick={() => {
                                  console.log("Edit clicked", invoice);
                                  handleEdit(invoice);
                                }}
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
                            )}
                            {/* Separator if both buttons shown */}
                            {permissionsForInvoiceModule.includes("edit") &&
                              permissionsForInvoiceModule.includes(
                                "delete"
                              ) && (
                                <svg
                                  className="w-full h-[1px]"
                                  viewBox="0 0 100 1"
                                  preserveAspectRatio="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <polygon
                                    points="0,0 50,1 100,0"
                                    fill="#E5E7EB"
                                  ></polygon>
                                </svg>
                              )}
                            {/* DELETE button - only if permission */}
                            {permissionsForInvoiceModule.includes("delete") && (
                              <button
                                onClick={() => {
                                  console.log("Delete clicked", invoice.id);
                                  handleDelete(invoice.id);
                                }}
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
                            )}
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
      {/* Invoice List Cards for Mobile */}
      <div className="md:hidden w-full space-y-6 pb-24 flex-grow overflow-x-auto">
        {currentInvoices.length === 0 ? (
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
                ? "No invoices found matching your search."
                : "No invoices available."}
            </p>
          </div>
        ) : (
          currentInvoices.map((invoice) => {
            return (
              <div
                key={invoice.id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg"
              >
                {/* Header Section */}
                <div className="p-4 sm:p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500 focus:ring-2"
                      />

                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
                          {/* Removed profile_pic rendering */}
                          <img
                            src="/dummyavatar.jpeg"
                            alt={invoice.customer_name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          {/* Invoice ID */}
                          <div className="text-xs text-Duskwood-600 font-semibold ">
                            Invoice No: {invoice.invoice_no}
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">
                            {invoice.company_name || invoice.customer_name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateForDisplay(invoice.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(invoice.id)}
                        className="p-1 text-[#4B5563] rounded-full hover:bg-gray-100"
                      >
                        <TbDotsVertical className="w-4 h-4" />
                      </button>

                      {activeDropdown === invoice.id && (
                        <div
                          ref={
                            activeDropdown === invoice.id
                              ? setActionDropdownNode
                              : null
                          }
                          className="absolute right-0 mt-1 w-24 sm:w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden"
                          onMouseDown={(e) => {
                            console.log("Dropdown mousedown", invoice.id);
                            e.stopPropagation();
                          }} // Prevent dropdown from closing
                        >
                          <div>
                            {/* EDIT button - only if permission */}
                            {permissionsForInvoiceModule.includes("edit") && (
                              <button
                                onClick={() => {
                                  console.log("Edit clicked (mobile)", invoice);
                                  handleEdit(invoice);
                                }}
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
                            )}
                            {/* Separator if both buttons shown */}
                            {permissionsForInvoiceModule.includes("edit") &&
                              permissionsForInvoiceModule.includes(
                                "delete"
                              ) && (
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
                              )}
                            {/* DELETE button - only if permission */}
                            {permissionsForInvoiceModule.includes("delete") && (
                              <button
                                onClick={() => {
                                  console.log(
                                    "Delete clicked (mobile)",
                                    invoice.id
                                  );
                                  handleDelete(invoice.id);
                                }}
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
                            )}
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
                    onClick={(e) => handleShowItems(invoice.items, e)}
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
                          Rs {invoice.grand_total}
                        </p>
                        <span className="text-xs text-Duskwood-600">
                          ({invoice?.items?.length} items)
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Company Name Row */}
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
                          d="M19 21v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2m7-8v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1m-4 0h14a2 2 0 012 2v5a2 2 0 01-2 2H3a2 2 0 01-2-2v-5a2 2 0 012-2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Bill To
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900">
                        {invoice.bill_to_name}
                      </p>
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 ">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Ship To
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900">
                        {invoice.ship_to_name}
                      </p>
                    </div>
                  </div>
                  {/* Invoice Date Row */}
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
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Invoice Date
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900">
                        {invoice.invoice_date
                          ? formatDateForDisplay(invoice.invoice_date)
                          : ""}
                      </p>
                    </div>
                  </div>
                  {/* Expiry Date Row */}
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
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Expiry Date
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900">
                        {invoice.expiry_date
                          ? new Date(invoice.expiry_date).toLocaleDateString()
                          : ""}
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
                        {invoice.created_at ? (
                          <>
                            <span className="block text-xs">
                              {new Date(invoice.created_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                            <span className="block text-Duskwood-600 text-xs mt-1">
                              {formatDateForDisplay(invoice.created_at)}
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
                        {invoice.updated_at ? (
                          <>
                            <span className="block text-xs">
                              {new Date(invoice.updated_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                            <span className="block text-Duskwood-600 text-xs mt-1">
                              {formatDateForDisplay(invoice.updated_at)}
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
      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-50/10 backdrop-blur-sm border border-white/30">
          <div className="w-11/12 max-w-[900px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10 custom-scrollbar">
            <h2 className="text-[24px] sm:text-[29px] font-medium text-[#1F2837] mb-8">
              {dynamicModalTitle}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      handleInputChange("customer_name", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={(e) =>
                      handleInputChange("company_name", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={(e) =>
                      handleInputChange("contact", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Status
                  </label>
                  <input
                    type="text"
                    name="status"
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      handleInputChange("invoice_date", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px]">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      handleInputChange("expiry_date", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  />
                </div>
              </div>{" "}
              <div className="mt-8">
                <h3 className="text-[20px] font-medium text-[#1F2837] mb-4">
                  Service Items
                </h3>

                {/* Table Headers */}
                <div className="grid grid-cols-[0.4fr_3fr_1fr_1fr] gap-4 text-[#8B8B8B] text-[10px] font-bold mb-1">
                  <div className="whitespace-nowrap">Sr. No.</div>
                  <div>Service</div>
                  <div className="whitespace-nowrap">Quantity</div>
                  <div className="whitespace-nowrap">Total Price</div>
                </div>

                <div className="w-full h-[1px] bg-gray-200 my-4"></div>

                {/* Service Items */}
                {serviceItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[0.4fr_3fr_1fr_1fr] gap-4 items-center mb-4 relative group"
                  >
                    <div className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 flex items-center text-[#545454]">
                      {index + 1}
                    </div>
                    <div>
                      <textarea
                        placeholder="Detailed Service Description"
                        className="w-full px-3 py-2 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] resize-y overflow-hidden h-auto min-h-[44px]"
                        value={item.serviceName}
                        onChange={(e) =>
                          handleServiceItemChange(
                            index,
                            "serviceName",
                            e.target.value
                          )
                        }
                        rows={1}
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="1"
                        className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        value={item.quantity}
                        onChange={(e) =>
                          handleServiceItemChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        value={item.totalItemPrice}
                        onChange={(e) =>
                          handleServiceItemChange(
                            index,
                            "totalItemPrice",
                            e.target.value
                          )
                        }
                      />
                      <button
                        onClick={() => removeServiceItem(index)}
                        className="absolute cursor-pointer -right-4 text-red-500  transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-3 h-3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="h-[44px] px-10 rounded-[12px] bg-[#ef7e1b] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-white hover:bg-[#ee7f1b]"
                  >
                    Add
                  </button>
                </div>

                <div className="w-full h-[1px] bg-gray-200 my-4"></div>

                <div className="flex items-center justify-end gap-8 lg:gap-56 mb-14">
                  <div className="text-[#ef7e1b] text-lg sm:text-xl lg:text-[20px] font-bold">
                    Total
                  </div>
                  <div className="text-[#ef7e1b] text-lg sm:text-xl lg:text-[20px] font-bold">
                    Rs {calculateTotalServiceCharge().toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-[46px] px-8 text-[#545454] bg-[#E7EFF8] hover:bg-[#d3e5f7] rounded-[12px] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[46px] px-4 text-white bg-[#ef7e1b] hover:bg-[#ee7f1b] rounded-[12px] transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
                      Product/Service
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      GST (%)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-sm font-medium text-[#4B5563] uppercase tracking-wider"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className=" divide-y divide-[#E5E7EB]">
                  {selectedItems.map((item, index) => (
                    <tr key={index} className="">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454] text-center">
                        {item.qty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        Rs {parseFloat(item.rate).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454] text-center">
                        {item.gst}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#545454]">
                        Rs {parseFloat(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className=" font-medium">
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-right text-sm text-[#1F2837]"
                    >
                      Net Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1F2837]">
                      Rs {calculateNetTotal(selectedItems)}
                    </td>
                  </tr>
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
      {filteredInvoices.length > 0 && (
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
                <path
                  d="M18.3333 18.3333L20.1667 20.1667"
                  stroke="#787374"
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
              <span>({filteredInvoices.length} total)</span>
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

export default ViewInvoice;

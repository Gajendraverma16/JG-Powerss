import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { FiChevronDown, FiEdit, FiUpload, FiDownload } from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import api from "../../api";
import Swal from "sweetalert2";
import { FaCheck } from "react-icons/fa6";
import { BsFiletypeCsv } from "react-icons/bs";
import { useParams, useLocation } from "react-router-dom"; // Import useParams and useLocation
import { Country, State, City } from "country-state-city";

import { RxCross2 } from "react-icons/rx";

import "../../styles/scrollbar.css";
import { SidebarContext } from "../../components/Layout";
import { useAuth } from "../../auth/AuthContext";

const CustomLeadManager = () => {
  const { statusId, statusName } = useParams(); // Get statusId and statusName from URL

  const [bulkDeleteMessage, setBulkDeleteMessage] = useState(false);
  const [bulkDeleteFollowUp, setBulkDeleteFollowUp] = useState(false);

  // New state variables for bulk edit checkboxes
  const [bulkAssignUser, setBulkAssignUser] = useState(false);
  const [bulkChangeStatus, setBulkChangeStatus] = useState(false);

  const handleBulkActionsSubmit = async () => {
    if (selectedLeads.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Shop Owners Selected",
        text: "Please select Shop Owners to perform bulk actions.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (
      !bulkDeleteMessage &&
      !bulkDeleteFollowUp &&
      !bulkAssignUser &&
      !bulkChangeStatus
    ) {
      Swal.fire({
        icon: "info",
        title: "No Action Selected",
        text: "Please check an action to perform.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    // Validate required selections for each action
    if (bulkAssignUser && !selectedAssignee) {
      Swal.fire({
        icon: "error",
        title: "User Not Selected",
        text: "Please select a user to assign Shop Owners to.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    if (bulkChangeStatus && !bulkEditSelectedStatus) {
      Swal.fire({
        icon: "error",
        title: "Status Not Selected",
        text: "Please select a status to change Shop Owners to.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Performing bulk actions for ${selectedLeads.length} Shop Owners...`,
        html: "Please wait, this may take a moment.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const successfulUpdates = [];
      const failedUpdates = [];

      // Use the current state, but don't rely on it changing mid-function
      const currentLeadsState = [...leads];

      for (const leadId of selectedLeads) {
        try {
          const leadToUpdate = currentLeadsState.find(
            (lead) => lead.customer_id === leadId
          );

          if (!leadToUpdate) {
            failedUpdates.push({ id: leadId, reason: "Lead not found." });
            continue;
          }

          const formDataToSend = new FormData();

          // Append all existing lead data that isn't changing
          safeAppend(
            formDataToSend,
            "customer_name",
            leadToUpdate.customer_name
          );
          safeAppend(formDataToSend, "email", leadToUpdate.email);
          safeAppend(formDataToSend, "contact_number", leadToUpdate.contact);
          safeAppend(formDataToSend, "city", leadToUpdate.city);
          safeAppend(
            formDataToSend,
            "whatsapp_number",
            leadToUpdate.whatsapp_number
          );
          safeAppend(formDataToSend, "requirements", leadToUpdate.requirements);
          safeAppend(formDataToSend, "source", leadToUpdate.source);
          safeAppend(formDataToSend, "status", leadToUpdate.status_name);
          safeAppend(formDataToSend, "status_id", leadToUpdate.status_id);

          // Handle assigned_to field
          let assignedToId = leadToUpdate.assigned_to;
          if (bulkAssignUser && selectedAssignee) {
            // Use the selected assignee
            const userObj = users.find((u) => u.name === selectedAssignee);
            assignedToId = userObj ? userObj.id : "";
          } else if (
            typeof assignedToId === "string" &&
            isNaN(Number(assignedToId))
          ) {
            // Use existing assignee if not changing
            const userObj = users.find((u) => u.name === assignedToId);
            assignedToId = userObj ? userObj.id : "";
          }
          safeAppend(
            formDataToSend,
            "assigned_to",
            parseInt(assignedToId, 10) || 0
          );

          // Handle status field
          let statusToUse = leadToUpdate.status_name;
          let statusIdToUse = leadToUpdate.status_id;
          if (bulkChangeStatus && bulkEditSelectedStatus) {
            statusToUse = bulkEditSelectedStatus.status_name;
            statusIdToUse = bulkEditSelectedStatus.status_id;
          }
          safeAppend(formDataToSend, "status", statusToUse);
          safeAppend(formDataToSend, "status_id", statusIdToUse);

          // Handle delete operations
          safeAppend(
            formDataToSend,
            "message",
            bulkDeleteMessage ? "" : leadToUpdate.message
          );
          safeAppend(
            formDataToSend,
            "follow_up_date",
            bulkDeleteFollowUp ? "" : leadToUpdate.follow_up_date_input
          );
          safeAppend(
            formDataToSend,
            "follow_up_time",
            bulkDeleteFollowUp ? "" : leadToUpdate.follow_up_time_input
          );

          const response = await api.post(
            `/udateleads/${leadId}`,
            formDataToSend,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          if (response.data.status || response.data.success) {
            successfulUpdates.push(leadId);
          } else {
            failedUpdates.push({
              id: leadId,
              reason: response.data.message || "Unknown error",
            });
          }
        } catch (err) {
          failedUpdates.push({
            id: leadId,
            reason: err.message || "Network error",
          });
        }
      }

      await loadingAlert.close();

      // Show a summary of results
      const actionsPerformed = [];
      if (bulkAssignUser) actionsPerformed.push("User Assignment");
      if (bulkChangeStatus) actionsPerformed.push("Status Change");
      if (bulkDeleteMessage) actionsPerformed.push("Message Deletion");
      if (bulkDeleteFollowUp) actionsPerformed.push("Follow-up Date Deletion");

      await Swal.fire({
        icon: successfulUpdates.length > 0 ? "success" : "error",
        title: "Bulk Actions Complete",
        html: `Successfully updated ${successfulUpdates.length} lead(s).<br/>
        Actions performed: ${actionsPerformed.join(", ")}<br/>${
          failedUpdates.length > 0
            ? `<span class="text-red-500">${failedUpdates.length} lead(s) failed.</span>`
            : ""
        }`,
        confirmButtonColor: "#0e4053",
      });

      // Fetch fresh data once at the end
      await fetchLeads();
    } catch (err) {
      if (loadingAlert) await loadingAlert.close();
      Swal.fire({
        icon: "error",
        title: "Bulk Actions Error",
        text: err.message || "An unexpected error occurred.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  const dynamicApiEndpoint = statusId ? `/leadstatus/${statusId}` : "/showlead";
  const dynamicHeaderTitle = statusName
    ? `All ${decodeURIComponent(statusName)} Items`
    : "All Leads";
  const dynamicModalTitle = statusName
    ? `Edit ${decodeURIComponent(statusName)} Item`
    : "Edit Shop Owner";

  // Helper function to format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB"); // Adjust locale as needed
  };

  // Helper function to format date in "Jun 23, 2025" format
  const formatDateForTable = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // New helper function to format date and time for table display (time above, date below)
  const formatDateTimeForTable = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return (
      <div className="flex flex-col">
        <span>{time}</span>
        <span className="text-xs text-Duskwood-600">{date}</span>
      </div>
    );
  };

  // Handler for predefined time range changes
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setDateRangeDropdownOpen(false);
    // The filtering logic will be in filteredLeads based on timeRange
  };

  // Handler for custom date range input changes
  const handleCustomDateChange = (type, dateString) => {
    setCustomDateRange((prev) => ({
      ...prev,
      [type]: new Date(dateString),
    }));
  };

  // Handler to apply custom date range
  const applyCustomDateRange = () => {
    if (customDateRange.fromDate && customDateRange.toDate) {
      setTimeRange("custom");
      setDateRangeDropdownOpen(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Date Range",
        text: "Please select both a start and end date for the custom range.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // Handler for predefined time range changes for created date
  const handleCreatedTimeRangeChange = (range) => {
    setCreatedTimeRange(range);
    setCreatedDateRangeDropdownOpen(false);
  };

  // Handler for custom created date range input changes
  const handleCustomCreatedDateChange = (type, dateString) => {
    setCustomCreatedDateRange((prev) => ({
      ...prev,
      [type]: new Date(dateString),
    }));
  };

  // Handler to apply custom created date range
  const applyCustomCreatedDateRange = () => {
    if (customCreatedDateRange.fromDate && customCreatedDateRange.toDate) {
      setCreatedTimeRange("custom");
      setCreatedDateRangeDropdownOpen(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Date Range",
        text: "Please select both a start and end date for the custom range.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // Mobile detection and search state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statuses, setStatuses] = useState([]);
  // Add new state for status dropdown
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  // Add new state for assign to dropdown
  const [isAssignToDropdownOpen, setIsAssignToDropdownOpen] = useState(false);
  const assignToDropdownRef = useRef(null);
  // Add new state for CSV dropdown
  const [isCsvDropdownOpen, setIsCsvDropdownOpen] = useState(false);
  const csvDropdownRef = useRef(null);
  // New state for follow up date range filter
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const dateRangeDropdownRef = useRef(null);
  const [timeRange, setTimeRange] = useState("all"); // "all", "7days", "30days", "90days", "custom"
  const [customDateRange, setCustomDateRange] = useState({
    fromDate: new Date(),
    toDate: new Date(),
  });

  // New state for created date range filter
  const [createdDateRangeDropdownOpen, setCreatedDateRangeDropdownOpen] =
    useState(false);
  const createdDateRangeDropdownRef = useRef(null);
  const [createdTimeRange, setCreatedTimeRange] = useState("all"); // "all", "7days", "30days", "90days", "custom"
  const [customCreatedDateRange, setCustomCreatedDateRange] = useState({
    fromDate: new Date(),
    toDate: new Date(),
  });

  // New state for Bulk Assign Modal
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);

  // New state for Country, State, City pickers
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [selectedCityObj, setSelectedCityObj] = useState(null);

  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Consume SidebarContext
  const { isCollapsed } = useContext(SidebarContext);

  // New state for Import CSV Modal and file upload
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Search, filter, and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    customerName: "all",
    city: "all",
    requirements: "all",
    source: "all",
    assignedTo: "all",
    followUp: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  // Add state and ref for custom items per page dropdown
  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);
  const itemsPerPageDropdownRef = useRef(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        itemsPerPageDropdownRef.current &&
        !itemsPerPageDropdownRef.current.contains(event.target)
      ) {
        setIsItemsPerPageDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [itemsPerPageDropdownRef]);

  // Checkbox selection state for bulk operations
  const [selectedLeads, setSelectedLeads] = useState([]);

  // New state for dropdown and modal
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneno: "",
    city: "",
    whatsapp: "",
    requirements: "",
    source: "",
    assigned_to: "",
    follow_up: "",
    status: "new",
    message: "",
    role: "User",
    is_approved: false,
    profile_pic: null,
    // New address fields
    blockUnitStreetName: "",
    state: "",
    country: "",
    pincode: "",
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Add state for users
  const [users, setUsers] = useState([]);

  // Add refs for each dropdown (desktop and mobile)
  const dropdownRefs = useRef({});

  // Add a ref for the currently open dropdown node (desktop/mobile)
  const [dropdownNode, setDropdownNode] = useState(null);

  // Add refs for all dropdowns
  const customerNameDropdownRef = useRef(null);
  const cityFilterDropdownRef = useRef(null);
  const sourceFilterDropdownRef = useRef(null);
  const assignedToFilterDropdownRef = useRef(null);

  // Add function to fetch users
  const fetchUsers = async () => {
    try {
      const response = await api.get("/userlist");
      if (response.data.success && response.data.result) {
        // Check if result is an array before filtering
        if (Array.isArray(response.data.result)) {
          // Filter users where is_approved is true
          const approvedUsers = response.data.result.filter(
            (user) => user.is_approved
          );
          setUsers(approvedUsers);
        } else {
          // If result is not an array, set empty array
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      setUsers([]);
    }
  };

  // Add function to fetch statuses
  const fetchStatuses = async () => {
    try {
      const response = await api.get("/showleadstatus");

      if (response.data.success) {
        setStatuses(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  // 1. Define fetchLeads as a reusable function at the top (after useEffect)
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get(dynamicApiEndpoint); // Use dynamicApiEndpoint
      if (response.data.success) {
        setLeads(response.data.result);
      } else {
        setError("Failed to fetch shop owners.");
      }
    } catch (err) {
      setError("Error fetching shop owners: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchUsers();
    fetchStatuses(); // Add this line to fetch statuses
    setCountries(Country.getAllCountries());
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

  // Add useEffect for status dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for CSV dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        csvDropdownRef.current &&
        !csvDropdownRef.current.contains(event.target)
      ) {
        setIsCsvDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for date range dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateRangeDropdownRef.current &&
        !dateRangeDropdownRef.current.contains(event.target)
      ) {
        setDateRangeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for created date range dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        createdDateRangeDropdownRef.current &&
        !createdDateRangeDropdownRef.current.contains(event.target)
      ) {
        setCreatedDateRangeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for assignee dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect for country-state-city dropdowns
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this ref for filter dropdowns
  const filterDropdownRef = useRef(null);

  // Filtered lists for country, state, city
  const filteredCountries = useMemo(
    () =>
      countries.filter((country) =>
        country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
      ),
    [countries, countrySearchTerm]
  );

  const filteredStates = useMemo(
    () =>
      states.filter((state) =>
        state.name.toLowerCase().includes(stateSearchTerm.toLowerCase())
      ),
    [states, stateSearchTerm]
  );

  const filteredCities = useMemo(
    () =>
      cities.filter((city) =>
        city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
      ),
    [cities, citySearchTerm]
  );

  // Helper function to extract city name from address
  const extractCityFromAddress = (address) => {
    if (!address) return "";

    try {
      // Try to parse as JSON first
      const parsedAddress = JSON.parse(address);
      return parsedAddress.city || "";
    } catch (e) {
      // If not JSON, try the old format (line breaks)
      const addressParts = address.split(/\r?\n/);
      if (addressParts.length >= 2) {
        const cityStatePart = addressParts[1].split(", ");
        return cityStatePart[0] || "";
      }
      return address;
    }
  };

  // Filter leads based on search term and filter criteria
  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();

    // Search across all relevant fields
    const matchesSearch =
      // Basic info
      lead?.customer_name?.toLowerCase()?.includes(searchLower) ||
      lead?.email?.toLowerCase()?.includes(searchLower) ||
      lead?.contact?.toLowerCase()?.includes(searchLower) ||
      lead?.address?.toLowerCase()?.includes(searchLower) ||
      // Additional fields
      lead?.city?.toLowerCase()?.includes(searchLower) ||
      lead?.whatsapp_number?.toLowerCase()?.includes(searchLower) ||
      lead?.requirements?.toLowerCase()?.includes(searchLower) ||
      lead?.source?.toLowerCase()?.includes(searchLower) ||
      lead?.assigned_to?.toLowerCase()?.includes(searchLower) ||
      lead?.follow_up_date?.toLowerCase()?.includes(searchLower) ||
      // Status
      lead?.status_name?.toLowerCase()?.includes(searchLower) ||
      // Created date
      lead?.created?.toLowerCase()?.includes(searchLower) ||
      // Customer ID (convert to string for searching)
      String(lead?.customer_id)?.includes(searchLower);

    const matchesCustomerName =
      filters.customerName === "all" ||
      lead?.customer_name
        ?.toLowerCase()
        ?.includes(filters.customerName.toLowerCase());

    const matchesCity =
      filters.city === "all" ||
      extractCityFromAddress(lead?.city)
        ?.toLowerCase()
        ?.includes(filters.city.toLowerCase());

    const matchesRequirements =
      filters.requirements === "all" ||
      lead?.requirements
        ?.toLowerCase()
        ?.includes(filters.requirements.toLowerCase());

    const matchesSource =
      filters.source === "all" ||
      lead?.source?.toLowerCase()?.includes(filters.source.toLowerCase());

    const matchesAssignedTo =
      filters.assignedTo === "all" ||
      lead?.assigned_to
        ?.toLowerCase()
        ?.includes(filters.assignedTo.toLowerCase());

    const matchesFollowUp =
      filters.followUp === "all" ||
      lead?.follow_up_date
        ?.toLowerCase()
        ?.includes(filters.followUp.toLowerCase());

    // New logic for date range filtering
    const matchesFollowUpDateRange = () => {
      if (timeRange === "all") return true;
      if (!lead.follow_up_date) return false; // Leads without follow_up_date won't match for specific ranges
      const followUpDate = new Date(lead.follow_up_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      switch (timeRange) {
        case "7days":
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return followUpDate >= sevenDaysAgo && followUpDate <= today;
        case "30days":
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return followUpDate >= thirtyDaysAgo && followUpDate <= today;
        case "90days":
          const ninetyDaysAgo = new Date(today);
          ninetyDaysAgo.setDate(today.getDate() - 90);
          return followUpDate >= ninetyDaysAgo && followUpDate <= today;
        case "custom":
          const from = new Date(customDateRange.fromDate);
          from.setHours(0, 0, 0, 0);
          const to = new Date(customDateRange.toDate);
          to.setHours(23, 59, 59, 999);
          return followUpDate >= from && followUpDate <= to;
        default:
          return true;
      }
    };

    // New logic for created date range filtering
    const matchesCreatedDateRange = () => {
      if (!lead.created) return false; // Leads without created date won't match

      // Parse the created date string (format: "YYYY-MM-DD")
      const createdDateParts = lead.created.split("-");
      if (createdDateParts.length !== 3) return false;

      const createdDate = new Date(
        parseInt(createdDateParts[0]), // year
        parseInt(createdDateParts[1]) - 1, // month (0-indexed)
        parseInt(createdDateParts[2]) // day
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      switch (createdTimeRange) {
        case "7days":
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return createdDate >= sevenDaysAgo && createdDate <= today;
        case "30days":
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return createdDate >= thirtyDaysAgo && createdDate <= today;
        case "90days":
          const ninetyDaysAgo = new Date(today);
          ninetyDaysAgo.setDate(today.getDate() - 90);
          return createdDate >= ninetyDaysAgo && createdDate <= today;
        case "custom":
          const from = new Date(customCreatedDateRange.fromDate);
          from.setHours(0, 0, 0, 0);
          const to = new Date(customCreatedDateRange.toDate);
          to.setHours(23, 59, 59, 999);
          return createdDate >= from && createdDate <= to;
        case "all":
        default:
          return true;
      }
    };

    return (
      matchesSearch &&
      matchesCustomerName &&
      matchesCity &&
      matchesRequirements &&
      matchesSource &&
      matchesAssignedTo &&
      matchesFollowUp &&
      matchesFollowUpDateRange() &&
      matchesCreatedDateRange()
    );
  });

  // Helper function for form validation
  const validateFormData = (data) => {
    const errors = [];

    if (!data.name || data.name.trim() === "") {
      errors.push("Customers Name is required.");
    }
    if (!data.phoneno || data.phoneno.trim() === "") {
      errors.push("Contact is required.");
    }
    return errors;
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to first page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

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
  const toggleLeadSelection = (leadId) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === currentLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentLeads.map((lead) => lead.customer_id));
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedLeads.length} Shop Owner(s). This cannot be undone.`,
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
          selectedLeads.map((id) => api.delete(`/deletelead/${id}`))
        );
        setLeads((prev) =>
          prev.filter((lead) => !selectedLeads.includes(lead.customer_id))
        );
        setSelectedLeads([]);
        await Swal.fire({
          icon: "success",
          title: "Shop Owners Deleted!",
          text: "Selected shop owners have been removed.",
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
  const toggleDropdown = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);

    // If we're opening the dropdown, scroll it into view
    if (activeDropdown !== userId) {
      // Use setTimeout to ensure the dropdown is rendered before scrolling
      setTimeout(() => {
        const dropdownElement = document.querySelector(
          `[data-dropdown-id="${userId}"]`
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

  const handleEdit = (lead) => {
    setEditingLead(lead);

    // Reset country-state-city related states
    setSelectedCountryObj(null);
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setCountries(Country.getAllCountries()); // Re-fetch all countries
    setStates([]);
    setCities([]);
    setCountrySearchTerm("");
    setStateSearchTerm("");
    setCitySearchTerm("");

    let followUpDate = "";
    let followUpTime = "";
    if (lead.follow_up_date) {
      const dateObj = new Date(lead.follow_up_date);
      followUpDate = dateObj.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }); // YYYY-MM-DD
      followUpTime = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }); // HH:MM
    }

    // Parse the address from lead.city (which contains the full address as JSON)
    let blockUnitStreetName = "";
    let stateName = "";
    let countryName = "";
    let pincode = "";
    let cityName = "";

    let parsedAddress = null;
    if (lead.city && typeof lead.city === "string") {
      try {
        parsedAddress = JSON.parse(lead.city);
      } catch (e) {
        console.error("Error parsing lead.city JSON:", e);
      }
    } else if (lead.city && typeof lead.city === "object") {
      // If it's already an object (e.g., from an older API response or direct setting)
      parsedAddress = lead.city;
    }

    if (parsedAddress) {
      blockUnitStreetName = parsedAddress.name || "";
      cityName = parsedAddress.city || "";
      stateName = parsedAddress.state || "";
      countryName = parsedAddress.country || "";
      pincode = parsedAddress.pin || "";
    }

    setFormData({
      name: lead.customer_name,
      email: lead.email,
      phoneno: lead.contact,
      city: cityName, // Set the actual city name here
      whatsapp: lead.whatsapp_number,
      requirements: lead.requirements,
      source: lead.source,
      assigned_to:
        users.find((user) => user.name === lead.assigned_to)?.name || "",
      follow_up_date_input: followUpDate, // Set parsed date
      follow_up_time_input: followUpTime, // Set parsed time
      status: lead.status_name.toLowerCase().replace(/\s+/g, "_"),
      message: lead.message || "",
      role: lead.role || "User",
      is_approved: lead.is_approved,
      profile_pic: null,
      blockUnitStreetName: blockUnitStreetName,
      state: stateName,
      country: countryName,
      pincode: pincode,
    });
    setImagePreview(lead.profile_pic || null);
    setIsModalOpen(true);
    setActiveDropdown(null);

    // Also need to set selectedCountryObj and selectedStateObj for the dropdowns to work correctly on edit
    if (countryName) {
      const countryObj = Country.getAllCountries().find(
        (c) => c.name === countryName
      );
      if (countryObj) {
        setSelectedCountryObj(countryObj);
        setStates(State.getStatesOfCountry(countryObj.isoCode));
        setCountrySearchTerm(countryName); // Set search term so input shows name

        if (stateName) {
          const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
            (s) => s.name === stateName
          );
          if (stateObj) {
            setSelectedStateObj(stateObj);
            setCities(
              City.getCitiesOfState(stateObj.countryCode, stateObj.isoCode)
            );
            setStateSearchTerm(stateName); // Set search term so input shows name

            if (cityName) {
              const cityObj = City.getCitiesOfState(
                stateObj.countryCode,
                stateObj.isoCode
              ).find((c) => c.name === cityName);
              if (cityObj) {
                setSelectedCityObj(cityObj);
                setCitySearchTerm(cityName); // Set search term so input shows name
              }
            }
          }
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_pic") {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          profile_pic: file,
        }));
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handlers for Country, State, City pickers
  const handleCountrySearchChange = (e) => {
    const value = e.target.value;
    setCountrySearchTerm(value);
    setCountryDropdownOpen(true);

    // Clear dependent selections if country changes
    if (value === "") {
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setStates([]);
      setCities([]);
      setStateSearchTerm("");
      setCitySearchTerm("");
      setFormData((prev) => ({ ...prev, country: "", state: "", city: "" }));
    }
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
    // Prevent state search if no country is selected
    if (!countrySearchTerm) {
      return;
    }

    const value = e.target.value;
    setStateSearchTerm(value);
    setStateDropdownOpen(true);

    // Clear dependent selections if state changes
    if (value === "") {
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

  const handleCitySearchChange = (e) => {
    // Prevent city search if no state is selected
    if (!stateSearchTerm) {
      return;
    }

    const value = e.target.value;
    setCitySearchTerm(value);
    setCityDropdownOpen(true);

    if (value === "") {
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCityObj(city);
    setCitySearchTerm(city.name);
    setCityDropdownOpen(false);
    setFormData((prev) => ({ ...prev, city: city.name }));
  };

  // Handle Bulk Assign
  const [isBulkAssignLoading, setIsBulkAssignLoading] = useState(false);
  // Add this ref to keep modal open after bulk assign or bulk edit
  const bulkEditJustSubmittedRef = useRef(false);
  const handleBulkAssign = async () => {
    console.log("handleBulkAssign called");
    if (selectedLeads.length === 0 || !selectedAssignee) {
      Swal.fire({
        icon: "error",
        title: "Selection Error",
        text: "Please select Shop Owners and an assignee to proceed.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    const assignedToUser = users.find((user) => user.name === selectedAssignee);

    if (!assignedToUser) {
      Swal.fire({
        icon: "error",
        title: "User Not Found",
        text: "Selected assignee not found in the user list.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    const assigneeId = assignedToUser.id;

    setIsBulkAssignLoading(true); // Set loading state
    bulkEditJustSubmittedRef.current = true; // <-- Set ref before operation

    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Assigning ${selectedLeads.length} Shop Owners...`,
        html: "Please wait, this may take a moment.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const successfulAssignments = [];
      const failedAssignments = [];

      for (const leadId of selectedLeads) {
        try {
          const leadToUpdate = leads.find(
            (lead) => lead.customer_id === leadId
          );
          if (!leadToUpdate) {
            failedAssignments.push({
              id: leadId,
              reason: "Lead not found locally.",
            });
            continue;
          }

          const formDataToSend = new FormData();
          // Populate formDataToSend with existing lead data (excluding profile_image if not changed)
          // Ensure all required fields are sent, even if only assigned_to is changing
          const bulkData = {
            customer_name: leadToUpdate.customer_name,
            email: leadToUpdate.email,
            contact_number: leadToUpdate.contact,
            city: leadToUpdate.city,
            whatsapp_number: leadToUpdate.whatsapp_number,
            requirements: leadToUpdate.requirements,
            source: leadToUpdate.source,
            follow_up_date: leadToUpdate.follow_up_date,
            status: leadToUpdate.status_name, // Use existing status name
            status_id: leadToUpdate.status_id, // Use existing status ID
            message: leadToUpdate.message || "",
            assigned_to: assigneeId,
          };
          Object.keys(bulkData).forEach((key) => {
            const value = bulkData[key];
            if (value !== null && value !== undefined) {
              formDataToSend.append(key, value);
            }
          });

          const response = await api.post(
            `/udateleads/${leadId}`,
            formDataToSend,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data.status || response.data.success) {
            successfulAssignments.push(leadId);
          } else {
            failedAssignments.push({
              id: leadId,
              reason: response.data.message || "Unknown error",
            });
          }
        } catch (err) {
          failedAssignments.push({
            id: leadId,
            reason: err.message || "Network error",
          });
        }
      }

      await loadingAlert.close();

      if (successfulAssignments.length > 0) {
        await Swal.fire({
          icon: "success",
          title: "Bulk Assignment Complete!",
          html: `Successfully assigned ${
            successfulAssignments.length
          } lead(s).<br/>${
            failedAssignments.length > 0
              ? `<span class=\"text-red-500\">${failedAssignments.length} lead(s) failed to assign.</span>`
              : ""
          }`,
          confirmButtonColor: "#0e4053",
        });
      } else if (failedAssignments.length > 0) {
        await Swal.fire({
          icon: "error",
          title: "Bulk Assignment Failed",
          html: `Failed to assign all Shop Owners. ${failedAssignments.length} Shop Owner(s) encountered errors.`, // You might show more details here if needed
          confirmButtonColor: "#DD6B55",
        });
      } else {
        // Should not happen if selectedLeads is not empty
        await Swal.fire({
          icon: "info",
          title: "No Shop Owners Assigned",
          text: "No Shop Owners were assigned.",
          confirmButtonColor: "#DD6B55",
        });
      }

      // Refresh leads and reset state
      await fetchLeads();
      setSelectedAssignee("");
      setAssigneeSearchTerm("");
      // Do NOT close the modal here if bulkEditJustSubmittedRef.current is true
      // Only close when user explicitly closes
      console.log("handleBulkAssign completed");
    } catch (err) {
      if (loadingAlert) {
        await loadingAlert.close();
      }
      Swal.fire({
        icon: "error",
        title: "Bulk Assignment Error",
        text:
          err.message || "An unexpected error occurred during bulk assignment.",
        confirmButtonColor: "#DD6B55",
      });
    } finally {
      setIsBulkAssignLoading(false); // Unset loading state
      bulkEditJustSubmittedRef.current = false; // Reset ref after operation
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
        const response = await api.delete(`/deletelead/${id}`);
        if (response.data.status || response.data.success) {
          setLeads((prev) => prev.filter((l) => l.customer_id !== id));
          await Swal.fire({
            icon: "success",
            title: " Deleted!",
            text: response.data.message || " has been removed.",
            confirmButtonColor: "#0e4053",
          });
        } else {
          throw new Error(response.data.message || "Server rejected delete");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Lead Failed",
          text: err.message,
          confirmButtonColor: "#DD6B55",
        });
      }
    }
    setOpenStatusMenu(null);
    setActiveDropdown(null);
  };

  const handleSubmit = async (e, action = "save") => {
    console.log("button pressed");
    if (e && e.preventDefault) e.preventDefault();
    console.log(formData, "formData");
    console.log(statuses, "statuses");
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        html: validationErrors.map((err) => `<div>${err}</div>`).join(""),
        confirmButtonColor: "#DD6B55",
      });
      return false; // Return false on validation error
    }

    try {
      const formDataToSend = new FormData();
      // Find the selected status object from statuses array
      const selectedStatus = statuses.find(
        (status) =>
          status &&
          status.status_name &&
          status.status_name.toLowerCase().replace(/\s+/g, "_") ===
            formData.status
      );

      if (!selectedStatus) {
        throw new Error("Invalid status selected");
      }

      // --- FIX: Convert assigned_to (name) to user ID (int) with role check ---
      let assignedToId;
      if (user?.role === "admin") {
        // If admin, find user by name from the form data
        const assignedUser = users.find((u) => u.name === formData.assigned_to);
        assignedToId = assignedUser ? assignedUser.id : 0; // Default to 0 if not found
      } else {
        // If not admin, force assignment to the current user
        assignedToId = user.id;
      }

      // Construct full address as JSON object
      const addressObject = {
        name: formData.blockUnitStreetName,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pin: formData.pincode,
      };

      // Combine follow_up_date_input and follow_up_time_input
      let combinedFollowUpDate = null;
      if (formData.follow_up_date_input) {
        const datePart = formData.follow_up_date_input;
        const timePart = formData.follow_up_time_input
          ? formData.follow_up_time_input + ":00"
          : formData.follow_up_time_input;
        combinedFollowUpDate = `${datePart} ${timePart}`;
      }
      // Format the data to match API keys
      const formattedData = {
        customer_name: formData.name,
        email: formData.email,
        contact_number: formData.phoneno,
        city: JSON.stringify(addressObject),
        whatsapp_number: formData.whatsapp,
        requirements: formData.requirements,
        source: formData.source,
        assigned_to: parseInt(assignedToId, 10) || 0, // Ensure it's an integer
        follow_up_date: combinedFollowUpDate,
        status: selectedStatus.status_name,
        status_id: selectedStatus.status_id,
        message: formData.message,
        profile_image: formData.profile_pic,
      };

      // Append all formatted fields, but skip null/undefined values
      Object.keys(formattedData).forEach((key) => {
        const value = formattedData[key];
        if (key === "profile_image" && value) {
          formDataToSend.append("profile_image", value);
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      const prevStatus = editingLead.status_name;
      const response = await api.post(
        `/udateleads/${editingLead.customer_id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data.status || response.data.success) {
        // Update the leads list with the edited lead
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.customer_id === editingLead.customer_id
              ? {
                  ...lead,
                  customer_name: response.data.lead.customer_name,
                  email: response.data.lead.email,
                  contact: response.data.lead.contact_number,
                  city: response.data.lead.city,
                  whatsapp_number: response.data.lead.whatsapp_number,
                  requirements: response.data.lead.requirements,
                  source: response.data.lead.source,
                  assigned_to:
                    users.find(
                      (user) => user.id == response.data.lead.assigned_to
                    )?.name || response.data.lead.assigned_to,
                  follow_up_date: response.data.lead.follow_up_date,
                  status_name: response.data.lead.status,
                  message: response.data.lead.message,
                  profile_pic: response.data.lead.profile_image, // Use profile_image from response
                }
              : lead
          )
        );
        if (action === "save") {
          setIsModalOpen(false); // Only close modal on Save
        }
        await Swal.fire({
          icon: "success",
          title: "Shop Owner Updated",
          text:
            response.data.message ||
            `${formData.name} was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
        await fetchLeads(); // Instead of window.location.reload()

        // Update editingLead and formData with fresh data only for navigation scenarios
        if (action === "next" || action === "back") {
          const updatedLead = leads.find(
            (l) => l.customer_id === editingLead.customer_id
          );

          if (updatedLead) {
            setEditingLead(updatedLead); // Crucially update editingLead with fresh data

            // Re-populate formData with the fresh lead data
            let followUpDate = "";
            let followUpTime = "";
            if (updatedLead.follow_up_date) {
              const dateObj = new Date(updatedLead.follow_up_date);
              followUpDate = dateObj.toLocaleDateString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }); // YYYY-MM-DD format for input type="date"
              followUpTime = dateObj.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }); // HH:MM format for input type="time"
            }

            let blockUnitStreetName = "";
            let stateName = "";
            let countryName = "";
            let pincode = "";
            let cityName = "";
            let parsedAddress = null;

            if (updatedLead.city && typeof updatedLead.city === "string") {
              try {
                parsedAddress = JSON.parse(updatedLead.city);
              } catch (e) {
                console.error("Error parsing lead.city JSON:", e);
              }
            } else if (
              updatedLead.city &&
              typeof updatedLead.city === "object"
            ) {
              parsedAddress = updatedLead.city;
            }

            if (parsedAddress) {
              blockUnitStreetName = parsedAddress.name || "";
              cityName = parsedAddress.city || "";
              stateName = parsedAddress.state || "";
              countryName = parsedAddress.country || "";
              pincode = parsedAddress.pin || "";
            }

            setFormData({
              name: updatedLead.customer_name,
              email: updatedLead.email,
              phoneno: updatedLead.contact,
              city: cityName,
              whatsapp: updatedLead.whatsapp_number,
              requirements: updatedLead.requirements,
              source: updatedLead.source,
              assigned_to:
                users.find((user) => user.name === updatedLead.assigned_to)
                  ?.name || "",
              follow_up_date_input: followUpDate,
              follow_up_time_input: followUpTime,
              status: updatedLead.status_name
                .toLowerCase()
                .replace(/\s+/g, "_"),
              message: updatedLead.message || "",
              role: updatedLead.role || "User",
              is_approved: updatedLead.is_approved,
              profile_pic: null,
              blockUnitStreetName: blockUnitStreetName,
              state: stateName,
              country: countryName,
              pincode: pincode,
            });
            setImagePreview(updatedLead.profile_pic || null);
          }
        }

        setOpenStatusMenu(null);
        setActiveDropdown(null);
        const newStatus = response.data.lead.status;
        // If status changed, remove from editableLeads and show SweetAlert
        if (prevStatus !== newStatus) {
          console.log(
            "[DEBUG] Removing item from editable due to status change:",
            {
              customer_id: editingLead.customer_id,
              prevStatus,
              newStatus,
              lead: response.data.lead,
            }
          );
          setEditableLeads((prev) =>
            prev.filter((l) => l.customer_id !== editingLead.customer_id)
          );
          await Swal.fire({
            icon: "info",
            title: "Item Removed",
            text: "This item is out of view because its status has changed.",
            confirmButtonColor: "#0e4053",
          });
          // After removal, modal navigation is handled by useEffect below
          return true;
        }
        return true; // Return true on success
      } else {
        throw new Error(response.data.message || "Failed to update lead");
      }
    } catch (err) {
      let errorTitle = "Error Updating Lead";
      let errorMessage =
        "An error occurred while updating the lead. Please try again.";

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
      setOpenStatusMenu(null);
      setActiveDropdown(null);
      return false; // Return false on error
    }
  };

  const handleStatusToggle = async (lead) => {
    const newIsApproved = !lead.is_approved;
    try {
      const response = await api.post(`/approval/${lead.customer_id}`, {
        is_approved: newIsApproved ? 1 : 0,
      });
      if (response.data.status || response.data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.customer_id === lead.customer_id
              ? { ...l, is_approved: newIsApproved }
              : l
          )
        );
        await Swal.fire({
          icon: "success",
          title: "Status Updated",
          text:
            response.data.message ||
            `${lead.customer_name} is now ${
              newIsApproved ? "Approved" : "Pending"
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
        title: "Failed to update lead status",
        text: err.message || "An error occurred",
        confirmButtonColor: "#DD6B55",
      });
    }
    setOpenStatusMenu(null);
    setActiveDropdown(null);
  };

  // Replace renderAssignToDropdown with the version from createLeads.jsx
  const renderAssignToDropdown = (currentValue, onValueChange) => (
    <div className="relative" ref={assignToDropdownRef}>
      <button
        type="button"
        onClick={() => setIsAssignToDropdownOpen(!isAssignToDropdownOpen)}
        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] text-left flex items-center justify-between cursor-pointer"
      >
        <span>
          {users.find((user) => user.name === currentValue)?.name ||
            "Select User"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isAssignToDropdownOpen ? "rotate-180" : ""
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
      </button>
      {isAssignToDropdownOpen && (
        <div className="absolute custom-scrollbar top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto cursor-pointer">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onValueChange(user.name); // Pass the user's name
                setIsAssignToDropdownOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
            >
              {user.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Cleanup image preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Function to handle submission of the Create Lead form:

  // New handler for file selection (drag/drop or input)
  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Please upload a CSV file.",
        confirmButtonColor: "#DD6B55",
      });
      setSelectedFile(null);
    }
  };

  // Function to handle the actual CSV file upload
  const uploadCsvFile = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: "error",
        title: "No File Selected",
        text: "Please select a CSV file to import.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    setIsImportModalOpen(false);
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: "Importing Shop Owners...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();
      formData.append("csv_file", selectedFile);

      const response = await api.post("/leads-import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadingAlert.close();
      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Import Successful!",
          text:
            response.data.message ||
            `Successfully imported ${response.data.imported} Shop Owners.`,
          confirmButtonColor: "#0e4053",
        });
        await fetchLeads(); // Instead of page reload
      } else {
        throw new Error(response.data.message || "Failed to import Shop Owners.");
      }
    } catch (err) {
      if (loadingAlert) {
        await loadingAlert.close();
      }
      Swal.fire({
        icon: "error",
        title: "Import Failed",
        text: err.message || "An error occurred during import.",
        confirmButtonColor: "#DD6B55",
      });
    }
    setSelectedFile(null); // Clear the selected file
  };

  // Add handlers for CSV import and export
  const handleImportCsv = () => {
    setSelectedFile(null); // Clear any previously selected file
    setIsImportModalOpen(true);
  };

  const handleExportCsv = async () => {
    setIsCsvDropdownOpen(false);
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: "Exporting Shop Owners...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const response = await api.get("/leads-export", {
        responseType: "blob", // Important for file downloads
      });
      await loadingAlert.close();
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "shop_owners.csv");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        await Swal.fire({
          icon: "success",
          title: "Export Successful!",
          text: "Shop Owners exported to shop_owners.csv.",
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error("Failed to export Shop Owners: No data received.");
      }
    } catch (err) {
      if (loadingAlert) {
        await loadingAlert.close();
      }
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: err.message || "An error occurred during export.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  const handleDownloadSample = async () => {
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: "Downloading Sample...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.get("/leads-sample-download", {
        responseType: "blob", // Important for file downloads
      });

      await loadingAlert.close();

      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "sample_leads.csv");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        await Swal.fire({
          icon: "success",
          title: "Download Successful!",
          text: "Sample Shop Owners CSV downloaded.",
          confirmButtonColor: "#0e4053",
        });
      } else {
        throw new Error("Failed to download sample: No data received.");
      }
    } catch (err) {
      if (loadingAlert) {
        await loadingAlert.close();
      }
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: err.message || "An error occurred during download.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // Place this useEffect after other useEffects
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Debug log for document event
      console.log("Document onMouseDown", event.target);
      if (
        activeDropdown &&
        dropdownNode &&
        !dropdownNode.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dropdownNode]);

  const { user, rolePermissions } = useAuth();
  const location = useLocation();

  // Extract module name from URL (e.g., 'leads' from '/leads/all')
  const pathParts = location.pathname.split("/").filter(Boolean);
  const moduleNameFromUrl = pathParts[0] ? pathParts[0].toLowerCase() : null;

  // Find permissions for the module from rolePermissions
  const permissionsForLeadsModule = useMemo(() => {
    if (rolePermissions === "ALL") return ["view", "create", "edit", "delete"];
    if (!moduleNameFromUrl || !Array.isArray(rolePermissions)) return [];
    const found = rolePermissions.find(
      (perm) => perm.module && perm.module.toLowerCase() === moduleNameFromUrl
    );
    return found ? found.permissions : [];
  }, [rolePermissions, moduleNameFromUrl]);

  // Permission checks for bulk assign and CSV
  const hasBulkAssignPermission =
    rolePermissions === "ALL" || !rolePermissions?.includes("noBulkAssign");
  const hasCsvPermission =
    rolePermissions === "ALL" || !rolePermissions?.includes("noCsv");

  // Bulk Edit state and refs
  const [bulkEditStatusSearch, setBulkEditStatusSearch] = useState("");
  const [isBulkEditStatusDropdownOpen, setIsBulkEditStatusDropdownOpen] =
    useState(false);
  const [bulkEditSelectedStatus, setBulkEditSelectedStatus] = useState(null);
  const bulkEditStatusDropdownRef = useRef(null);
  const bulkEditAssigneeDropdownRef = useRef(null);

  // Add useEffect for bulk edit assignee dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bulkEditAssigneeDropdownRef.current &&
        !bulkEditAssigneeDropdownRef.current.contains(event.target)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for bulk edit status dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bulkEditStatusDropdownRef.current &&
        !bulkEditStatusDropdownRef.current.contains(event.target)
      ) {
        setIsBulkEditStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Utility function for safe appending to FormData (used in bulk edit)
  const safeAppend = (formData, key, value) => {
    formData.append(key, value === null || value === undefined ? "" : value);
  };

  // Bulk Edit: Change Status for selected leads
  const handleBulkChangeStatus = async () => {
    if (!bulkEditSelectedStatus || selectedLeads.length === 0) return;
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Updating Status for ${selectedLeads.length} Shop Owners...`,
        html: "Please wait, this may take a moment.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const successfulUpdates = [];
      const failedUpdates = [];
      for (const leadId of selectedLeads) {
        try {
          const leadToUpdate = leads.find(
            (lead) => lead.customer_id === leadId
          );
          if (!leadToUpdate) {
            failedUpdates.push({
              id: leadId,
              reason: "Lead not found locally.",
            });
            continue;
          }
          const formDataToSend = new FormData();
          safeAppend(
            formDataToSend,
            "customer_name",
            leadToUpdate.customer_name
          );
          safeAppend(formDataToSend, "email", leadToUpdate.email);
          safeAppend(formDataToSend, "contact_number", leadToUpdate.contact);
          safeAppend(formDataToSend, "city", leadToUpdate.city);
          safeAppend(
            formDataToSend,
            "whatsapp_number",
            leadToUpdate.whatsapp_number
          );
          safeAppend(formDataToSend, "requirements", leadToUpdate.requirements);
          safeAppend(formDataToSend, "source", leadToUpdate.source);
          safeAppend(
            formDataToSend,
            "follow_up_date",
            leadToUpdate.follow_up_date
          );
          safeAppend(
            formDataToSend,
            "status",
            bulkEditSelectedStatus.status_name
          );
          safeAppend(
            formDataToSend,
            "status_id",
            bulkEditSelectedStatus.status_id
          );
          safeAppend(formDataToSend, "message", leadToUpdate.message);
          // Ensure assigned_to is always an integer user ID
          let assignedToId = leadToUpdate.assigned_to;
          if (typeof assignedToId === "string" && isNaN(Number(assignedToId))) {
            const userObj = users.find((u) => u.name === assignedToId);
            assignedToId = userObj ? userObj.id : "";
          }
          if (!assignedToId || isNaN(Number(assignedToId))) {
            assignedToId = 0;
          }
          safeAppend(formDataToSend, "assigned_to", parseInt(assignedToId, 10));
          const response = await api.post(
            `/udateleads/${leadId}`,
            formDataToSend,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.data.status || response.data.success) {
            successfulUpdates.push(leadId);
          } else {
            failedUpdates.push({
              id: leadId,
              reason: response.data.message || "Unknown error",
            });
          }
        } catch (err) {
          failedUpdates.push({
            id: leadId,
            reason: err.message || "Network error",
          });
        }
      }
      await loadingAlert.close();
      if (successfulUpdates.length > 0) {
        await Swal.fire({
          icon: "success",
          title: "Bulk Status Update Complete!",
          html: `Successfully updated status for ${
            successfulUpdates.length
          } lead(s).<br/>${
            failedUpdates.length > 0
              ? `<span class=\"text-red-500\">${failedUpdates.length} lead(s) failed to update.</span>`
              : ""
          }`,
          confirmButtonColor: "#0e4053",
        });
      } else if (failedUpdates.length > 0) {
        await Swal.fire({
          icon: "error",
          title: "Bulk Status Update Failed",
          html: `Failed to update status for all Shop Owners. ${failedUpdates.length} lead(s) encountered errors.`,
          confirmButtonColor: "#DD6B55",
        });
      } else {
        await Swal.fire({
          icon: "info",
          title: "No Status Updated",
          text: "No Shop Owners were updated.",
          confirmButtonColor: "#DD6B55",
        });
      }
      await fetchLeads();
      setBulkEditStatusSearch("");
      setBulkEditSelectedStatus(null);
      setIsBulkEditStatusDropdownOpen(false);
      setSelectedLeads([]); // Clear selectedLeads after status change
    } catch (err) {
      if (loadingAlert) {
        await loadingAlert.close();
      }
      Swal.fire({
        icon: "error",
        title: "Bulk Status Update Error",
        text:
          err.message ||
          "An unexpected error occurred during bulk status update.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  const handleBulkDeleteMessage = async () => {
    if (selectedLeads.length === 0) return;
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Deleting Message for ${selectedLeads.length} Shop Owners...`,
        html: "Please wait, this may take a moment.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const successfulUpdates = [];
      const failedUpdates = [];
      for (const leadId of selectedLeads) {
        try {
          const leadToUpdate = leads.find(
            (lead) => lead.customer_id === leadId
          );
          if (!leadToUpdate) {
            failedUpdates.push({
              id: leadId,
              reason: "Lead not found locally.",
            });
            continue;
          }
          const formDataToSend = new FormData();
          safeAppend(
            formDataToSend,
            "customer_name",
            leadToUpdate.customer_name
          );
          safeAppend(formDataToSend, "email", leadToUpdate.email);
          safeAppend(formDataToSend, "contact_number", leadToUpdate.contact);
          safeAppend(formDataToSend, "city", leadToUpdate.city);
          safeAppend(
            formDataToSend,
            "whatsapp_number",
            leadToUpdate.whatsapp_number
          );
          safeAppend(formDataToSend, "requirements", leadToUpdate.requirements);
          safeAppend(formDataToSend, "source", leadToUpdate.source);

          let combinedFollowUpDate = "";
          if (leadToUpdate.follow_up_date_input) {
            const datePart = leadToUpdate.follow_up_date_input;
            const timePart = leadToUpdate.follow_up_time_input || "00:00:00";
            combinedFollowUpDate = `${datePart} ${timePart}:00`;
          }
          safeAppend(formDataToSend, "follow_up_date", combinedFollowUpDate);
          // Do NOT send follow_up_time as a separate field

          safeAppend(formDataToSend, "status", leadToUpdate.status_name);
          safeAppend(formDataToSend, "status_id", leadToUpdate.status_id);
          safeAppend(formDataToSend, "message", ""); // Clear message
          let assignedToId = leadToUpdate.assigned_to;
          if (typeof assignedToId === "string" && isNaN(Number(assignedToId))) {
            const userObj = users.find((u) => u.name === assignedToId);
            assignedToId = userObj ? userObj.id : "";
          }
          if (!assignedToId || isNaN(Number(assignedToId))) {
            assignedToId = 0;
          }
          safeAppend(formDataToSend, "assigned_to", parseInt(assignedToId, 10));
          const response = await api.post(
            `/udateleads/${leadId}`,
            formDataToSend,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          if (response.data.status || response.data.success) {
            successfulUpdates.push(leadId);
          } else {
            failedUpdates.push({
              id: leadId,
              reason: response.data.message || "Unknown error",
            });
          }
        } catch (err) {
          failedUpdates.push({
            id: leadId,
            reason: err.message || "Network error",
          });
        }
      }
      await loadingAlert.close();
      if (successfulUpdates.length > 0) {
        await Swal.fire({
          icon: "success",
          title: "Bulk Message Delete Complete!",
          html: `Successfully deleted message for ${
            successfulUpdates.length
          } lead(s).<br/>${
            failedUpdates.length > 0
              ? `<span class=\"text-red-500\">${failedUpdates.length} lead(s) failed.</span>`
              : ""
          }`,
          confirmButtonColor: "#0e4053",
        });
      } else if (failedUpdates.length > 0) {
        await Swal.fire({
          icon: "error",
          title: "Bulk Message Delete Failed",
          html: `Failed to delete message for all Shop Owners. ${failedUpdates.length} Shop Owner(s) encountered errors.`,
          confirmButtonColor: "#DD6B55",
        });
      }
      const refreshResponse = await api.get("/showlead");
      if (refreshResponse.data.success) {
        setLeads(
          Array.isArray(refreshResponse.data.result)
            ? refreshResponse.data.result
            : []
        );
      } else {
        setLeads([]);
      }
    } catch (err) {
      if (loadingAlert) await loadingAlert.close();
      Swal.fire({
        icon: "error",
        title: "Bulk Message Delete Error",
        text: err.message || "An unexpected error occurred.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  const handleBulkDeleteFollowUpDate = async (isMessageDeleted = false) => {
    if (selectedLeads.length === 0) return;
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Deleting Follow Up Date for ${selectedLeads.length} Shop Owners...`,
        html: "Please wait, this may take a moment.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const successfulUpdates = [];
      const failedUpdates = [];
      for (const leadId of selectedLeads) {
        try {
          const leadToUpdate = leads.find(
            (lead) => lead.customer_id === leadId
          );
          if (!leadToUpdate) {
            failedUpdates.push({
              id: leadId,
              reason: "Lead not found locally.",
            });
            continue;
          }
          const formDataToSend = new FormData();
          safeAppend(
            formDataToSend,
            "customer_name",
            leadToUpdate.customer_name
          );
          safeAppend(formDataToSend, "email", leadToUpdate.email);
          safeAppend(formDataToSend, "contact_number", leadToUpdate.contact);
          safeAppend(formDataToSend, "city", leadToUpdate.city);
          safeAppend(
            formDataToSend,
            "whatsapp_number",
            leadToUpdate.whatsapp_number
          );
          safeAppend(formDataToSend, "requirements", leadToUpdate.requirements);
          safeAppend(formDataToSend, "source", leadToUpdate.source);
          safeAppend(formDataToSend, "follow_up_date", ""); // Clear follow up date
          safeAppend(formDataToSend, "follow_up_time", ""); // Clear follow up time
          safeAppend(formDataToSend, "status", leadToUpdate.status_name);
          safeAppend(formDataToSend, "status_id", leadToUpdate.status_id);
          if (!isMessageDeleted) {
            safeAppend(formDataToSend, "message", leadToUpdate.message);
          }
          let assignedToId = leadToUpdate.assigned_to;
          if (typeof assignedToId === "string" && isNaN(Number(assignedToId))) {
            const userObj = users.find((u) => u.name === assignedToId);
            assignedToId = userObj ? userObj.id : "";
          }
          if (!assignedToId || isNaN(Number(assignedToId))) {
            assignedToId = 0;
          }
          safeAppend(formDataToSend, "assigned_to", parseInt(assignedToId, 10));
          const response = await api.post(
            `/udateleads/${leadId}`,
            formDataToSend,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          if (response.data.status || response.data.success) {
            successfulUpdates.push(leadId);
          } else {
            failedUpdates.push({
              id: leadId,
              reason: response.data.message || "Unknown error",
            });
          }
        } catch (err) {
          failedUpdates.push({
            id: leadId,
            reason: err.message || "Network error",
          });
        }
      }
      await loadingAlert.close();
      if (successfulUpdates.length > 0) {
        await Swal.fire({
          icon: "success",
          title: "Bulk Follow Up Date Delete Complete!",
          html: `Successfully deleted follow up date for ${
            successfulUpdates.length
          } lead(s).<br/>${
            failedUpdates.length > 0
              ? `<span class=\"text-red-500\">${failedUpdates.length} lead(s) failed.</span>`
              : ""
          }`,
          confirmButtonColor: "#0e4053",
        });
      } else if (failedUpdates.length > 0) {
        await Swal.fire({
          icon: "error",
          title: "Bulk Follow Up Date Delete Failed",
          html: `Failed to delete follow up date for all Shop Owners. ${failedUpdates.length} Shop Owner(s) encountered errors.`,
          confirmButtonColor: "#DD6B55",
        });
      }
      const refreshResponse = await api.get("/showlead");
      if (refreshResponse.data.success) {
        setLeads(
          Array.isArray(refreshResponse.data.result)
            ? refreshResponse.data.result
            : []
        );
      } else {
        setLeads([]);
      }
    } catch (err) {
      if (loadingAlert) await loadingAlert.close();
      Swal.fire({
        icon: "error",
        title: "Bulk Follow Up Date Delete Error",
        text: err.message || "An unexpected error occurred.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // Add state for Bulk Edit Modal
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  // Add useEffect for filter dropdowns click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeDropdown === "customerName" &&
        customerNameDropdownRef.current &&
        !customerNameDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      if (
        activeDropdown === "city" &&
        cityFilterDropdownRef.current &&
        !cityFilterDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      if (
        activeDropdown === "source" &&
        sourceFilterDropdownRef.current &&
        !sourceFilterDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      if (
        activeDropdown === "assignedTo" &&
        assignedToFilterDropdownRef.current &&
        !assignedToFilterDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  // Add state for editing lead index
  // const [editingLeadIndex, setEditingLeadIndex] = useState(null);

  // Add navigation handlers for Save and Next
  const handleEditBack = async (e) => {
    const success = await handleSubmit(e, "back");
    if (!success) return; // Only proceed if save was successful

    const currentLeadId = editingLead?.customer_id;
    const currentLeadIndex = filteredLeads.findIndex(
      (l) => l.customer_id === currentLeadId
    );

    console.log("[DEBUG] handleEditBack", { currentLeadIndex, filteredLeads });

    if (currentLeadIndex > 0) {
      const prevLead = filteredLeads[currentLeadIndex - 1];
      console.log("[DEBUG] Navigating to previous lead:", prevLead);
      handleEditWithIndex(prevLead);
    } else {
      closeModal();
    }
  };

  const handleEditNext = async (e) => {
    const success = await handleSubmit(e, "next");
    if (!success) return; // Only proceed if save was successful

    const currentLeadId = editingLead?.customer_id;
    const currentLeadIndex = filteredLeads.findIndex(
      (l) => l.customer_id === currentLeadId
    );

    console.log("[DEBUG] handleEditNext", { currentLeadIndex, filteredLeads });

    if (currentLeadIndex < filteredLeads.length - 1) {
      const nextLead = filteredLeads[currentLeadIndex + 1];
      console.log("[DEBUG] Navigating to next lead:", nextLead);
      handleEditWithIndex(nextLead);
    } else {
      closeModal();
    }
  };

  // Update handleEdit to set editingLeadIndex
  const originalHandleEdit = handleEdit;
  const handleEditWithIndex = (lead) => {
    console.log("[DEBUG] handleEditWithIndex called for lead:", lead);
    originalHandleEdit(lead);
    // Only set editableLeads if modal session not started
    if (!modalSessionStartedRef.current) {
      setEditableLeads([...filteredLeads]);
      modalSessionStartedRef.current = true;
      // No setEditingLeadIndex here!
    }
    // No setEditingLeadIndex here!
    // All index logic is now handled by currentIndex
  };

  // Fix: Assign To dropdown click outside handler
  useEffect(() => {
    if (!isAssignToDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (
        assignToDropdownRef.current &&
        !assignToDropdownRef.current.contains(event.target)
      ) {
        setIsAssignToDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAssignToDropdownOpen]);

  useEffect(() => {
    console.log("CustomLeadManager mounted");
    return () => {
      console.log("CustomLeadManager unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("isBulkAssignModalOpen:", isBulkAssignModalOpen);
  }, [isBulkAssignModalOpen]);

  // Add editableLeads state for modal navigation
  const [editableLeads, setEditableLeads] = useState([]);
  const modalSessionStartedRef = useRef(false); // <-- Fix: add this line

  // Helper useEffect: if current editingLead is not in editableLeads, auto-navigate or close modal
  useEffect(() => {
    if (!isModalOpen || !editingLead) return;
    const stillExists = editableLeads.some(
      (l) => l.customer_id === editingLead.customer_id
    );
    if (!stillExists) {
      console.log("[DEBUG] Current editingLead not found in editableLeads:", {
        editingLead,
        editableLeads,
        currentIndex,
      });
      // Try to move to next, then previous, else close modal
      const idx = currentIndex;
      if (editableLeads.length === 0) {
        closeModal();
      } else if (idx < editableLeads.length) {
        handleEditWithIndex(
          editableLeads[idx] || editableLeads[editableLeads.length - 1]
        );
      } else if (idx > 0) {
        handleEditWithIndex(editableLeads[idx - 1]);
      } else {
        closeModal();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableLeads, isModalOpen, editingLead]);

  // Add closeModal helper
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setEditableLeads([]); // Clear for next session
    modalSessionStartedRef.current = false;
  };

  // Compute currentIndex for navigation and disables
  const currentIndex = editableLeads.findIndex(
    (l) => l.customer_id === editingLead?.customer_id
  );
  console.log(
    "[DEBUG] currentIndex:",
    currentIndex,
    "editable:",
    editableLeads
  );

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading Shop Owners...
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
          {hasBulkAssignPermission &&
            selectedLeads.length > 0 &&
            permissionsForLeadsModule.includes("edit") && (
              <button
                className="hover:bg-Duskwood-500 bg-[#ef7e1b] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center"
                onClick={() => setIsBulkEditModalOpen(true)}
              >
                Bulk Edit
              </button>
            )}
          {hasBulkAssignPermission &&
            selectedLeads.length > 0 &&
            permissionsForLeadsModule.includes("delete") && (
              <button
                className="hover:bg-red-500 bg-[#DD6B55] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center"
                onClick={handleBulkDelete}
              >
                Bulk Delete
              </button>
            )}
          {/* CSV Import/Export Buttons - Permission Controlled */}
          {/* Uncomment and wrap your CSV dropdown here if you want to show/hide based on hasCsvPermission */}
          {/* {hasCsvPermission && (
            <div className="relative" ref={csvDropdownRef}>
              ...CSV Dropdown code...
            </div>
          )} */}
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
      <div
        ref={filterDropdownRef}
        className={`grid grid-cols-2 gap-3 mb-2 ${
          rolePermissions === "ALL"
            ? "md:grid-cols-2 lg:grid-cols-6"
            : "md:grid-cols-2 lg:grid-cols-5"
        }`}
      >
        {/* Customer Name Dropdown */}
        <div className="relative" ref={customerNameDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(
                activeDropdown === "customerName" ? null : "customerName"
              )
            }
          >
            <span className="truncate text-left flex-1">
              {filters.customerName === "all"
                ? "Customers Name"
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
          {activeDropdown === "customerName" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  leads
                    .map((lead) => lead.customer_name)
                    .filter(Boolean)
                    .map((name) => name.toLowerCase().trim())
                )
              ).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    handleFilterChange("customerName", name);
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
        {/* City Dropdown */}
        <div className="relative" ref={cityFilterDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(activeDropdown === "city" ? null : "city")
            }
          >
            <span className="truncate text-left flex-1">
              {filters.city === "all"
                ? "City"
                : filters.city.charAt(0).toUpperCase() + filters.city.slice(1)}
            </span>
            {filters.city !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("city", "all");
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
          {activeDropdown === "city" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  leads
                    .map((lead) => {
                      // Extract city name from the address using helper function
                      return extractCityFromAddress(lead.city)
                        .toLowerCase()
                        .trim();
                    })
                    .filter((city) => city)
                )
              ).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    handleFilterChange("city", city);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                >
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Source Dropdown */}
        <div className="relative" ref={sourceFilterDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(activeDropdown === "source" ? null : "source")
            }
          >
            <span className="truncate text-left flex-1">
              {filters.source === "all" ? "Source" : filters.source}
            </span>
            {filters.source !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("source", "all");
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
          {activeDropdown === "source" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  leads
                    .map((lead) => lead.source)
                    .filter(Boolean)
                    .map((source) => source.toLowerCase().trim())
                )
              ).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => {
                    handleFilterChange("source", source);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                >
                  {source}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Assigned User Dropdown */}
        <div className="relative" ref={assignedToFilterDropdownRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(
                activeDropdown === "assignedTo" ? null : "assignedTo"
              )
            }
          >
            <span className="truncate text-left flex-1">
              {filters.assignedTo === "all"
                ? "Assigned User"
                : filters.assignedTo}
            </span>
            {filters.assignedTo !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("assignedTo", "all");
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
          {activeDropdown === "assignedTo" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Array.from(
                new Set(
                  leads
                    .map((lead) => lead.assigned_to)
                    .filter(Boolean)
                    .map((assigned) => assigned.toLowerCase().trim())
                )
              ).map((assigned) => (
                <button
                  key={assigned}
                  type="button"
                  onClick={() => {
                    handleFilterChange("assignedTo", assigned);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                >
                  {assigned}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* New Follow Up Date Range Filter */}
        <div
          className={`relative ${
            rolePermissions !== "ALL" ? "col-span-2 md:col-span-1" : ""
          }`}
          ref={dateRangeDropdownRef}
        >
          <button
            className="relative
          appearance-none
          h-[36px] md:h-[44px] lg:h-[44px]
          pl-2 pr-10 md:pr-15 lg:pr-15
          w-full md:min-w-[120px] lg:min-w-[120px]
          bg-white border border-[#E9EAEA]
          rounded-[8px]
          cursor-pointer
          text-[#242729] text-[8px] md:text-base lg:text-sm
          focus:outline-none cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              setDateRangeDropdownOpen((open) => !open);
            }}
          >
            <div className="flex items-center">
              {timeRange === "all" && "Follow Up"}
              {timeRange === "7days" && "Last 7 Days"}
              {timeRange === "30days" && "Last 30 Days"}
              {timeRange === "90days" && "Last 90 Days"}
              {timeRange === "custom" && (
                <span className="text-[10px] whitespace-nowrap">
                  {`${formatDateForDisplay(
                    customDateRange.fromDate
                  )} - ${formatDateForDisplay(customDateRange.toDate)}`}
                </span>
              )}
            </div>
            <img
              src="/caret-down.svg"
              alt=""
              aria-hidden="true"
              className="
          pointer-events-none
          absolute right-2 md:right-3 lg:right-3
          top-1/2 -translate-y-1/2
          w-4 h-4
        "
            />
          </button>

          {dateRangeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 cursor-pointer">
              <div className="px-4 pt-3  text-[#4B5563]">
                <p className="text-sm font-medium">Select Range</p>
              </div>

              <div className="p-2">
                {/* Predefined ranges */}
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "all"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("all")}
                >
                  <span>All Dates</span>
                  {timeRange === "all" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "7days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("7days")}
                >
                  <span>Last 7 Days</span>
                  {timeRange === "7days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "30days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("30days")}
                >
                  <span>Last 30 Days</span>
                  {timeRange === "30days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "90days"
                      ? "bg-[#E7EFF8] text-[#ef7e1b]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("90days")}
                >
                  <span>Last 90 Days</span>
                  {timeRange === "90days" && (
                    <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                  )}
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
                          customDateRange.fromDate
                            ? customDateRange.fromDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleCustomDateChange("fromDate", e.target.value)
                        }
                        max={
                          customDateRange.toDate
                            ? customDateRange.toDate.toISOString().split("T")[0]
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
                          customDateRange.toDate
                            ? customDateRange.toDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleCustomDateChange("toDate", e.target.value)
                        }
                        min={
                          customDateRange.fromDate
                            ? customDateRange.fromDate
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <button
                    className="hover:bg-Duskwood-500
        bg-[#ef7e1b] text-white
        h-[44px] px-5
        rounded-[8px]
        flex items-center justify-center
        w-full
      "
                    onClick={applyCustomDateRange}
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* New Created Date Range Filter */}
        {rolePermissions === "ALL" && (
          <div className="relative" ref={createdDateRangeDropdownRef}>
            <button
              className="relative
          appearance-none
          h-[36px] md:h-[44px] lg:h-[44px]
          pl-2 pr-10 md:pr-15 lg:pr-15
          w-full md:min-w-[120px] lg:min-w-[120px]
          bg-white border border-[#E9EAEA]
          rounded-[8px]
          cursor-pointer
          text-[#242729] text-[8px] md:text-base lg:text-sm
          focus:outline-none cursor-pointer"
              onMouseDown={(e) => {
                e.stopPropagation();
                setCreatedDateRangeDropdownOpen((open) => !open);
              }}
            >
              <div className="flex items-center whitespace-nowrap ">
                {createdTimeRange === "all" && "Created"}
                {createdTimeRange === "7days" && "Last 7 Days"}
                {createdTimeRange === "30days" && "Last 30 Days"}
                {createdTimeRange === "90days" && "Last 90 Days"}
                {createdTimeRange === "custom" && (
                  <span className="text-[10px] whitespace-nowrap">
                    {`${formatDateForDisplay(
                      customCreatedDateRange.fromDate
                    )} - ${formatDateForDisplay(
                      customCreatedDateRange.toDate
                    )}`}
                  </span>
                )}
              </div>
              <img
                src="/caret-down.svg"
                alt=""
                aria-hidden="true"
                className="
          pointer-events-none
          absolute right-2 md:right-3 lg:right-3
          top-1/2 -translate-y-1/2
          w-4 h-4
        "
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
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("all")}
                  >
                    <span>All Dates</span>
                    {createdTimeRange === "all" && (
                      <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                    )}
                  </button>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                      createdTimeRange === "7days"
                        ? "bg-[#E7EFF8] text-[#ef7e1b]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("7days")}
                  >
                    <span>Last 7 Days</span>
                    {createdTimeRange === "7days" && (
                      <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                    )}
                  </button>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                      createdTimeRange === "30days"
                        ? "bg-[#E7EFF8] text-[#ef7e1b]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("30days")}
                  >
                    <span>Last 30 Days</span>
                    {createdTimeRange === "30days" && (
                      <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                    )}
                  </button>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                      createdTimeRange === "90days"
                        ? "bg-[#E7EFF8] text-[#ef7e1b]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("90days")}
                  >
                    <span>Last 90 Days</span>
                    {createdTimeRange === "90days" && (
                      <FaCheck className="h-4 w-4 text-[#ef7e1b]" />
                    )}
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
                      className="hover:bg-Duskwood-500
        bg-[#ef7e1b] text-white
        h-[44px] px-5
        rounded-[8px]
        flex items-center justify-center
        w-full
      "
                      onClick={applyCustomCreatedDateRange}
                    >
                      Apply Custom Range
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-[#4B5563]">
          Showing {filteredLeads.length} results for "{searchTerm}"
        </div>
      )}

      {/* Lead List Table */}
      <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <table className="w-full min-w-[1800px] border-collapse">
          <thead>
            <tr className="text-left text-[#4B5563]">
              {/* Bulk Selection Checkbox - Permission Controlled */}
              {hasBulkAssignPermission && (
                <th className="py-4 px-6 font-medium text-sm w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedLeads.length === currentLeads.length &&
                      currentLeads.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer"
                  />
                </th>
              )}
              <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                Shop Owners ID
              </th>
              <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                Shop Owners Name
              </th>
              <th className="py-4 px-6 font-medium text-sm">Email</th>
              <th className="py-4 px-6 font-medium text-sm">Contact</th>
              <th className="py-4 px-6 font-medium text-sm">City</th>
              <th className="py-4 px-6 font-medium text-sm">WhatsApp</th>
              <th className="py-4 px-6 font-medium text-sm">Requirements</th>
              <th className="py-4 px-6 font-medium text-sm">Source</th>
              <th className="py-4 px-6 font-medium text-sm">Status</th>
              <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                Assigned User
              </th>
              <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                Follow Up
              </th>
              {rolePermissions === "ALL" && (
                <th className="py-4 px-6 font-medium text-sm">Created</th>
              )}
              {/* Action Column - Permission Controlled */}
              {(permissionsForLeadsModule.includes("edit") ||
                permissionsForLeadsModule.includes("delete")) && (
                <th className="py-4 px-6 font-medium text-sm">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentLeads.length === 0 ? (
              <tr>
                <td
                  colSpan="14"
                  className="py-8 px-6 text-center text-[#4B5563]"
                >
                  {searchTerm
                    ? "No Shop Owners found matching your search."
                    : "No Shop Owners available."}
                </td>
              </tr>
            ) : (
              currentLeads.map((lead) => {
                const isStatusMenuOpen = openStatusMenu === lead.customer_id;
                return (
                  <tr
                    key={lead.customer_id}
                    className="border-t border-[#E5E7EB]"
                  >
                    {/* Bulk Selection Checkbox - Permission Controlled */}
                    {hasBulkAssignPermission && (
                      <td className="py-4 px-6 w-12">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.customer_id)}
                          onChange={() => toggleLeadSelection(lead.customer_id)}
                          className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer bg-[#E9EAEA]"
                        />
                      </td>
                    )}
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.customer_id}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      <div
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() => handleEditWithIndex(lead)}
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden group-hover:bg-Duskwood-100 group-hover:shadow-md group-hover:shadow-Duskwood-300 transition-all duration-200">
                          {lead.profile_pic ? (
                            <img
                              src={lead.profile_pic}
                              alt={lead.customer_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/dummyavatar.jpeg";
                              }}
                            />
                          ) : (
                            <img
                              src="/dummyavatar.jpeg"
                              alt={lead.customer_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#1F2837] font-medium group-hover:text-Duskwood-600 transition-colors">
                            {lead.customer_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.email}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.contact}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {/* Extract and display only the city name from the full address */}
                      {extractCityFromAddress(lead.city)}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.whatsapp_number}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.requirements}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.source}
                    </td>
                    <td className="py-4 px-6 max-w-xs overflow-hidden truncate">
                      <div className="relative inline-block">
                        <span
                          className={`
                            px-3 py-1 rounded-lg text-sm
                            flex items-center gap-2
                            ${
                              lead.status_name === "Fresh List"
                                ? "bg-[#27AE60] text-white"
                                : lead.status_name === "Follow Up"
                                ? "bg-[#ef7e1b] text-white"
                                : lead.status_name === "Get Call Back Us"
                                ? "bg-[#FFFBEB] text-[#D97706]"
                                : lead.status_name === "Contact In Future"
                                ? "bg-[#FFF8DD] text-[#F1C40F]"
                                : lead.status_name === "Next Day Payments"
                                ? "bg-[#27AE60] text-white"
                                : lead.status_name === "Quote Send"
                                ? "bg-[#ef7e1b] text-white"
                                : lead.status_name === "Call Back"
                                ? "bg-[#FFFBEB] text-[#D97706]"
                                : lead.status_name === "Construction"
                                ? "bg-[#FFF8DD] text-[#F1C40F]"
                                : lead.status_name === "NPC"
                                ? "bg-[#27AE60] text-white"
                                : lead.status_name === "Switch off"
                                ? "bg-[#ef7e1b] text-white"
                                : lead.status_name === "Not Reachable"
                                ? "bg-[#FFFBEB] text-[#D97706]"
                                : lead.status_name === "Quotation"
                                ? "bg-[#FFF8DD] text-[#ff0000]"
                                : lead.status_name === "Converted Client"
                                ? "bg-[#093d6e] text-white"
                                : "bg-[#173f12] text-white"
                            }
                          `}
                        >
                          {lead.status_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.assigned_to}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {formatDateTimeForTable(lead.follow_up_date)}
                    </td>
                    {rolePermissions === "ALL" && (
                      <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                        <div className="flex flex-col">
                          <span>{formatDateTimeForTable(lead.created)}</span>
                        </div>
                      </td>
                    )}
                    {/* Action Buttons - Permission Controlled */}
                    {(permissionsForLeadsModule.includes("edit") ||
                      permissionsForLeadsModule.includes("delete")) && (
                      <td className="py-4 px-6 relative">
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            toggleDropdown(lead.customer_id);
                          }}
                          className="p-2 text-[#4B5563] hover:bg-Duskwood-200 hover:text-white rounded-full transition-colors "
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === lead.customer_id && (
                          <div
                            ref={
                              activeDropdown === lead.customer_id
                                ? setDropdownNode
                                : null
                            }
                            data-dropdown-id={lead.customer_id}
                            className="absolute left-3 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="">
                              {/* Edit Button - Permission Controlled */}
                              {permissionsForLeadsModule.includes("edit") && (
                                <button
                                  onClick={() => handleEditWithIndex(lead)}
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

                              {/* Delete Button - Permission Controlled */}
                              {permissionsForLeadsModule.includes("delete") && (
                                <button
                                  onClick={() => handleDelete(lead.customer_id)}
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
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Lead List Cards for Mobile */}
      <div className="md:hidden w-full space-y-6 pb-24 flex-grow overflow-x-auto">
        {currentLeads.length === 0 ? (
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
                ? "No Shop Owners found matching your search."
                : "No Shop Owners available."}
            </p>
          </div>
        ) : (
          currentLeads.map((lead) => {
            const isStatusMenuOpen = openStatusMenu === lead.customer_id;
            return (
              <div
                key={lead.customer_id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg"
              >
                {/* Header Section */}
                <div className="p-4 sm:p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      {/* Bulk Selection Checkbox - Permission Controlled */}
                      {hasBulkAssignPermission && (
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.customer_id)}
                          onChange={() => toggleLeadSelection(lead.customer_id)}
                          className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500 focus:ring-2"
                        />
                      )}

                      <div
                        className="flex items-center space-x-3 group cursor-pointer"
                        onClick={() => handleEditWithIndex(lead)}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200 group-hover:bg-Duskwood-100 group-hover:shadow-md group-hover:shadow-Duskwood-300 transition-all duration-200">
                          {lead.profile_pic ? (
                            <img
                              src={lead.profile_pic}
                              alt={lead.customer_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/dummyavatar.jpeg";
                              }}
                            />
                          ) : (
                            <img
                              src="/dummyavatar.jpeg"
                              alt={lead.customer_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap group-hover:text-Duskwood-600 transition-colors">
                            {lead.customer_name}
                          </h3>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                          {rolePermissions === "ALL" && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDateTimeForTable(lead.created)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu - Permission Controlled */}
                    {(permissionsForLeadsModule.includes("edit") ||
                      permissionsForLeadsModule.includes("delete")) && (
                      <div className="relative">
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            toggleDropdown(lead.customer_id);
                          }}
                          className="p-1 text-[#4B5563] rounded-full hover:bg-gray-100"
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === lead.customer_id && (
                          <div
                            ref={
                              activeDropdown === lead.customer_id
                                ? setDropdownNode
                                : null
                            }
                            className="absolute right-0 mt-1 w-24 sm:w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div>
                              {/* EDIT button - Permission Controlled */}
                              {permissionsForLeadsModule.includes("edit") && (
                                <button
                                  onClick={() => handleEditWithIndex(lead)}
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

                              {/* DELETE button - Permission Controlled */}
                              {permissionsForLeadsModule.includes("delete") && (
                                <button
                                  onClick={() => handleDelete(lead.customer_id)}
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
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-3 sm:p-4 space-y-3">
                  {/* Contact & WhatsApp Row */}
                  <div className="grid grid-cols-2 gap-2">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 ">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                          Contact
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {lead.contact}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          WhatsApp
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {lead.whatsapp_number}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* City & Source Row */}
                  <div className="grid grid-cols-2 gap-2">
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          City
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {/* Extract and display only the city name from the full address */}
                          {extractCityFromAddress(lead.city)}
                        </p>
                      </div>
                    </div>

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
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          Source
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {lead.source}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned To & Follow Up Row */}
                  <div className="grid grid-cols-2 gap-2">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          Assigned User
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900 whitespace-nowrap">
                          {lead.assigned_to}
                        </p>
                      </div>
                    </div>

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
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                          Follow Up
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900 whitespace-nowrap">
                          {formatDateTimeForTable(lead.follow_up_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Requirements */}
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Requirements
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {lead.requirements}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="px-3 sm:px-4 py-3  border-t border-gray-100 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      Status
                    </span>
                    <span
                      className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${
                    lead.status_name === "Fresh List"
                      ? "bg-emerald-100 text-emerald-800"
                      : lead.status_name === "Follow Up"
                      ? "bg-Duskwood-100 text-Duskwood-800"
                      : lead.status_name === "Get Call Back Us"
                      ? "bg-amber-100 text-amber-800"
                      : lead.status_name === "Contact In Future"
                      ? "bg-yellow-100 text-yellow-800"
                      : lead.status_name === "Next Day Payments"
                      ? "bg-emerald-100 text-emerald-800"
                      : lead.status_name === "Quote Send"
                      ? "bg-Duskwood-100 text-Duskwood-800"
                      : lead.status_name === "Call Back"
                      ? "bg-amber-100 text-amber-800"
                      : lead.status_name === "Construction"
                      ? "bg-yellow-100 text-yellow-800"
                      : lead.status_name === "NPC"
                      ? "bg-emerald-100 text-emerald-800"
                      : lead.status_name === "Switch off"
                      ? "bg-Duskwood-100 text-Duskwood-800"
                      : lead.status_name === "Not Reachable"
                      ? "bg-amber-100 text-amber-800"
                      : lead.status_name === "Quotation"
                      ? "bg-red-100 text-red-800"
                      : lead.status_name === "Converted Client"
                      ? "bg-[#093d6e] text-white"
                      : "bg-[#173f12] text-white"
                  }
                `}
                    >
                      {lead.status_name}
                    </span>
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
            onClick={() => setIsModalOpen(false)}
          />

          {/* Glassmorphism modal container */}
          <div
            className="
       w-11/12 max-w-[1000px] max-h-[90vh] overflow-y-auto p-6 md:p-8
        rounded-2xl
        bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
        shadow-lg
        relative z-10 custom-scrollbar
      "
          >
            {/* Close button */}
            <button
              onClick={closeModal}
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
              {dynamicModalTitle}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Picture Upload */}
                <div className="md:col-span-1 flex flex-col items-center">
                  <label className="block text-[#4B5563] text-[16px] mb-4 w-full">
                    Profile Picture
                  </label>
                  <div className="relative w-32 h-32">
                    <img
                      src={
                        imagePreview ||
                        editingLead?.profile_pic ||
                        "/dummyavatar.jpeg"
                      }
                      alt="Profile Preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <label
                      htmlFor="edit-file-upload"
                      className="absolute bottom-1 right-1 bg-[#ef7e1b] text-white rounded-full p-2 cursor-pointer hover:bg-Duskwood-600 transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                      <input
                        type="file"
                        name="profile_pic"
                        id="edit-file-upload"
                        onChange={handleInputChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>

                {/* Customer Name and Details */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name */}
                  <div className="space-y-2 md:col-start-1 md:row-start-1">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Customers Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        required
                      />
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
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-2 md:col-start-1 md:row-start-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Contact
                    </label>
                    <input
                      type="text"
                      name="phoneno"
                      value={formData.phoneno}
                      onChange={handleInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                      required
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2 md:col-start-2 md:row-start-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2 md:col-start-2 md:row-start-3">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Requirements
                    </label>
                    <input
                      type="text"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>

                  {/* Source */}
                  <div className="space-y-2 md:col-start-1 md:row-start-3">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Source
                    </label>
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>

                  {/* Follow Up */}
                  <div className="space-y-2 md:col-start-1 md:row-start-4">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Follow Up
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="follow_up_date_input"
                        value={formData.follow_up_date_input}
                        onChange={handleInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] placeholder:text-sm"
                      />
                      <input
                        type="time"
                        name="follow_up_time_input"
                        value={formData.follow_up_time_input}
                        onChange={handleInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] placeholder:text-sm"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2 md:col-start-2 md:row-start-4">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Status
                    </label>
                    <div className="relative" ref={statusDropdownRef}>
                      <button
                        type="button"
                        onClick={() =>
                          setIsStatusDropdownOpen(!isStatusDropdownOpen)
                        }
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>
                          {statuses.find(
                            (status) =>
                              status.status_name
                                .toLowerCase()
                                .replace(/\s+/g, "_") === formData.status
                          )?.status_name || "Select Status"}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isStatusDropdownOpen ? "rotate-180" : ""
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
                      </button>
                      {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar cursor-pointer">
                          {statuses.map((status) => (
                            <button
                              key={status.status_id}
                              type="button"
                              onClick={() => {
                                handleInputChange({
                                  target: {
                                    name: "status",
                                    value: status.status_name
                                      .toLowerCase()
                                      .replace(/\s+/g, "_"),
                                  },
                                });
                                setIsStatusDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                            >
                              {status.status_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-2 md:col-span-2 md:row-start-5">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Assigned User
                    </label>
                    {renderAssignToDropdown(formData.assigned_to, (value) =>
                      handleInputChange({
                        target: { name: "assigned_to", value },
                      })
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2 md:col-start-1 md:col-span-2 md:row-start-6">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full min-h-[58px] p-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] resize-none"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1 md:col-span-2 md:row-start-7">
                    <label className="block text-[#4B5563] text-sm font-medium">
                      Address
                    </label>
                    <div className="w-full rounded-[12px]  border border-white/20 flex flex-col">
                      <input
                        type="text"
                        name="blockUnitStreetName"
                        value={formData.blockUnitStreetName}
                        onChange={handleInputChange}
                        className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b  bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-t-[12px]"
                        placeholder="Block/Unit/Street Name"
                      />

                      {/* State and City Dropdowns */}
                      <div className="grid grid-cols-2  w-full">
                        {/* State Dropdown */}
                        <div className="relative" ref={stateDropdownRef}>
                          <input
                            type="text"
                            name="stateSearch"
                            value={formData.state || stateSearchTerm}
                            onChange={handleStateSearchChange}
                            onFocus={() =>
                              countrySearchTerm && setStateDropdownOpen(true)
                            }
                            onBlur={() => setStateDropdownOpen(false)}
                            className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                              !countrySearchTerm
                                ? "bg-gray-300 cursor-not-allowed opacity-60"
                                : "bg-[#E7EFF8]/60"
                            }`}
                            placeholder="Select State"
                            disabled={!countrySearchTerm}
                            readOnly={!countrySearchTerm}
                            autoComplete="off"
                          />
                          {stateDropdownOpen && countrySearchTerm && (
                            <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                              {filteredStates.length > 0 ? (
                                filteredStates.map((state) => (
                                  <div
                                    key={state.isoCode}
                                    className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                    onClick={() => handleStateSelect(state)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {state.name}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-gray-500">
                                  No states found
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* City Dropdown */}
                        <div className="relative" ref={cityDropdownRef}>
                          <input
                            type="text"
                            name="citySearch"
                            value={formData.city || citySearchTerm}
                            onChange={handleCitySearchChange}
                            onFocus={() =>
                              stateSearchTerm && setCityDropdownOpen(true)
                            }
                            onBlur={() => setCityDropdownOpen(false)}
                            className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                              !stateSearchTerm
                                ? "bg-gray-300 cursor-not-allowed opacity-60"
                                : "bg-[#E7EFF8]/60"
                            }`}
                            placeholder="Select City"
                            disabled={!stateSearchTerm}
                            readOnly={!stateSearchTerm}
                            autoComplete="off"
                          />
                          {cityDropdownOpen && stateSearchTerm && (
                            <div className="absolute custom-scrollbar z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city) => (
                                  <div
                                    key={city.name}
                                    className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                    onClick={() => handleCitySelect(city)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {city.name}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-gray-500">
                                  No cities found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pincode and Country */}
                      <div className="grid grid-cols-2  w-full">
                        {/* Pincode Input */}
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 rounded-bl-[12px] outline-none"
                          placeholder="Pincode"
                        />
                        {/* Country Dropdown */}
                        <div className="relative" ref={countryDropdownRef}>
                          <input
                            type="text"
                            name="countrySearch"
                            value={formData.country || countrySearchTerm}
                            onChange={handleCountrySearchChange}
                            onFocus={() => setCountryDropdownOpen(true)}
                            onBlur={() => setCountryDropdownOpen(false)}
                            className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20  outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                            placeholder="Select Country"
                          />
                          {countryDropdownOpen && (
                            <div className="absolute custom-scrollbar z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                  <div
                                    key={country.isoCode}
                                    className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                    onClick={() => handleCountrySelect(country)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {country.name}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-gray-500">
                                  No countries found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="mt-10 flex justify-center gap-2 lg:ml-64 items-center">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={(e) => handleEditBack(e)}
                  className={`flex items-center justify-center w-10 h-[46px] rounded-[10px] border border-gray-300
                    ${
                      currentIndex === 0 ||
                      currentIndex === -1 ||
                      editableLeads.length === 0
                        ? " text-gray-400 cursor-not-allowed border border-gray-300"
                        : "bg-[#ef7e1b] text-white hover:bg-[#ee7f1b] transition-colors"
                    }
                  `}
                  disabled={
                    currentIndex === 0 ||
                    currentIndex === -1 ||
                    editableLeads.length === 0
                  }
                  title="Back"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                {/* Cancel button (existing) */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full md:w-[207px] h-[46px] text-[#ef7e1b] border border-[#0e4053] rounded-[10px] hover:bg-[#ee7f1b] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {/* Save button (existing) */}
                <button
                  type="submit"
                  className="w-full md:w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors cursor-pointer"
                  onClick={(e) => handleSubmit(e, "save")}
                >
                  Save
                </button>
                {/* Save and Next Button */}
                <button
                  type="button"
                  onClick={(e) => handleEditNext(e)}
                  className={`flex items-center justify-center w-14 h-[46px] rounded-[10px]
                    ${
                      currentIndex === -1 ||
                      currentIndex === editableLeads.length - 1 ||
                      editableLeads.length === 0
                        ? " text-gray-400 cursor-not-allowed border border-gray-300"
                        : "bg-[#ef7e1b] text-white hover:bg-[#ee7f1b] transition-colors"
                    }
                  `}
                  title="Save and next"
                  disabled={
                    currentIndex === -1 ||
                    currentIndex === editableLeads.length - 1 ||
                    editableLeads.length === 0
                  }
                >
                  <span className="sr-only">Save and next</span>
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredLeads.length > 0 && (
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
              <span>({filteredLeads.length} total)</span>
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

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => {
              setIsImportModalOpen(false);
              setSelectedFile(null); // Clear selected file on modal close
            }}
          />

          {/* Glassmorphism modal container */}
          <div
            className="
              w-11/12 max-w-[500px] max-h-[90vh] overflow-y-auto p-6 md:p-8
              rounded-2xl
              bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
              shadow-lg
              relative z-10 custom-scrollbar
            "
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setSelectedFile(null); // Clear selected file on modal close
              }}
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
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-6">
              Import Leads from CSV
            </h2>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-[#A0AEC0] rounded-lg p-6 text-center cursor-pointer hover:border-[#0e4053] transition-colors"
              onDragOver={(e) => e.preventDefault()} // Prevent default to allow drop
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e);
              }}
              onClick={() => document.getElementById("csv-file-upload").click()}
            >
              <input
                type="file"
                id="csv-file-upload"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <FiUpload className="mx-auto w-10 h-10 text-[#A0AEC0] mb-3" />
              <p className="text-[#4B5563] text-sm">
                {selectedFile
                  ? `Selected file: ${selectedFile.name}`
                  : "Drag & drop your CSV file here, or click to browse"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Only .csv files are supported
              </p>
            </div>
            <h6 className="text-xs text-right text-[#1F2837] mt-3">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-[#ef7e1b] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e4053] rounded-md px-2 py-1 -mr-2 transition-colors duration-200"
              >
                View Sample File
              </button>
            </h6>
            {/* Submit button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={uploadCsvFile}
                disabled={!selectedFile}
                className={`w-full md:w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] transition-colors ${
                  !selectedFile
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#ee7f1b]"
                }`}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => {
              setIsBulkAssignModalOpen(false);
              setSelectedAssignee("");
              setAssigneeSearchTerm("");
            }}
          />

          {/* Glassmorphism modal container */}
          <div
            className="
              w-11/12 max-w-[700px] max-h-[98vh] p-6 md:p-8
              rounded-2xl
              bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
              shadow-lg
              relative z-10 custom-scrollbar
            "
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsBulkAssignModalOpen(false);
                setSelectedAssignee("");
                setAssigneeSearchTerm("");
              }}
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
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-6">
              Bulk Assign Shop Owners
            </h2>

            {/* Assignee Selection */}
            <div className="space-y-4">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Assign to User:
              </label>
              <div className="relative" ref={assigneeDropdownRef}>
                <input
                  type="text"
                  placeholder="Search and select user..."
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  value={assigneeSearchTerm}
                  onChange={(e) => {
                    setAssigneeSearchTerm(e.target.value);
                    setIsAssigneeDropdownOpen(true); // Open dropdown on type
                  }}
                  onFocus={() => setIsAssigneeDropdownOpen(true)} // Open dropdown on focus
                />
                {isAssigneeDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {users
                      .filter((user) =>
                        user.name
                          .toLowerCase()
                          .includes(assigneeSearchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedAssignee(user.name);
                            setAssigneeSearchTerm(user.name); // Set input value to selected name
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                        >
                          {user.name}
                        </button>
                      ))}
                    {users.filter((user) =>
                      user.name
                        .toLowerCase()
                        .includes(assigneeSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No users found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assign button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleBulkAssign}
                disabled={
                  !selectedAssignee ||
                  selectedLeads.length === 0 ||
                  isBulkAssignLoading
                }
                className={`w-full md:w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] transition-colors ${
                  !selectedAssignee ||
                  selectedLeads.length === 0 ||
                  isBulkAssignLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#ee7f1b]"
                }`}
              >
                {isBulkAssignLoading ? "Assigning..." : "Assign Selected Shop Owners"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => {
              setIsBulkEditModalOpen(false);
              setSelectedAssignee("");
              setAssigneeSearchTerm("");
              setBulkEditStatusSearch("");
              setBulkEditSelectedStatus(null);
              setBulkDeleteMessage(false);
              setBulkDeleteFollowUp(false);
              setBulkAssignUser(false);
              setBulkChangeStatus(false);
            }}
          />
          {/* Glassmorphism modal container */}
          <div className="w-11/12 max-w-[700px] max-h-[98vh] p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10 custom-scrollbar overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => {
                setIsBulkEditModalOpen(false);
                setSelectedAssignee("");
                setAssigneeSearchTerm("");
                setBulkEditStatusSearch("");
                setBulkEditSelectedStatus(null);
                setBulkDeleteMessage(false);
                setBulkDeleteFollowUp(false);
                setBulkAssignUser(false);
                setBulkChangeStatus(false);
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
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-8 text-left">
              Bulk Edit Show Owners
            </h2>
            {/* Bulk Edit Options Section */}
            <div className="rounded-xl p-6 shadow-sm border border-[#E9EAEA] mb-5">
              <h3 className="text-lg font-semibold text-[#ef7e1b] mb-4">
                Bulk Edit Options
              </h3>
              <div className="space-y-4">
                {/* Assign User Option */}
                <div
                  className={`border-2 rounded-lg transition-all duration-300 ${
                    bulkAssignUser
                      ? "border-Duskwood-400 bg-Duskwood-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    selectedLeads.length === 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <label className="flex items-center cursor-pointer p-4">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-Duskwood-600 focus:ring-Duskwood-500"
                      checked={bulkAssignUser}
                      onChange={(e) => setBulkAssignUser(e.target.checked)}
                      disabled={selectedLeads.length === 0}
                    />
                    <span className="ml-4 flex flex-col">
                      <span className="font-semibold text-gray-700">
                        Assign to User
                      </span>
                      <span className="text-sm text-gray-500">
                        Assign selected Shop Owners to a specific user.
                      </span>
                    </span>
                  </label>

                  {/* Configuration section that expands when checkbox is checked */}
                  {bulkAssignUser && (
                    <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                      <label className="block text-[#4B5563] text-[16px] mb-2">
                        Select User:
                      </label>
                      <div
                        className="relative"
                        ref={bulkEditAssigneeDropdownRef}
                      >
                        <input
                          type="text"
                          placeholder="Search and select user..."
                          className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                          value={assigneeSearchTerm}
                          onChange={(e) => {
                            setAssigneeSearchTerm(e.target.value);
                            setIsAssigneeDropdownOpen(true);
                          }}
                          onFocus={() => setIsAssigneeDropdownOpen(true)}
                        />
                        {isAssigneeDropdownOpen && (
                          <div className="absolute custom-scrollbar top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto">
                            {users
                              .filter((user) =>
                                user.name
                                  .toLowerCase()
                                  .includes(assigneeSearchTerm.toLowerCase())
                              )
                              .map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssignee(user.name);
                                    setAssigneeSearchTerm(user.name);
                                    setIsAssigneeDropdownOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                                >
                                  {user.name}
                                </button>
                              ))}
                            {users.filter((user) =>
                              user.name
                                .toLowerCase()
                                .includes(assigneeSearchTerm.toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No users found.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Change Option */}
                <div
                  className={`border-2 rounded-lg transition-all duration-300 ${
                    bulkChangeStatus
                      ? "border-Duskwood-400 bg-Duskwood-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    selectedLeads.length === 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <label className="flex items-center cursor-pointer p-4">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-Duskwood-600 focus:ring-Duskwood-500"
                      checked={bulkChangeStatus}
                      onChange={(e) => setBulkChangeStatus(e.target.checked)}
                      disabled={selectedLeads.length === 0}
                    />
                    <span className="ml-4 flex flex-col">
                      <span className="font-semibold text-gray-700">
                        Change Status
                      </span>
                      <span className="text-sm text-gray-500">
                        Update the status for selected Shop Owners.
                      </span>
                    </span>
                  </label>

                  {/* Configuration section that expands when checkbox is checked */}
                  {bulkChangeStatus && (
                    <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                      <label className="block text-[#4B5563] text-[16px] mb-2">
                        Select Status:
                      </label>
                      <div className="relative" ref={bulkEditStatusDropdownRef}>
                        <input
                          type="text"
                          placeholder="Search and select status..."
                          className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                          value={bulkEditStatusSearch}
                          onChange={(e) => {
                            setBulkEditStatusSearch(e.target.value);
                            setIsBulkEditStatusDropdownOpen(true);
                          }}
                          onFocus={() => setIsBulkEditStatusDropdownOpen(true)}
                        />
                        {isBulkEditStatusDropdownOpen && (
                          <div className="absolute top-full custom-scrollbar left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto">
                            {statuses
                              .filter((status) =>
                                status.status_name
                                  .toLowerCase()
                                  .includes(bulkEditStatusSearch.toLowerCase())
                              )
                              .map((status) => (
                                <button
                                  key={status.status_id}
                                  type="button"
                                  onClick={() => {
                                    setBulkEditSelectedStatus(status);
                                    setBulkEditStatusSearch(status.status_name);
                                    setIsBulkEditStatusDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] ${
                                    bulkEditSelectedStatus &&
                                    bulkEditSelectedStatus.status_id ===
                                      status.status_id
                                      ? "bg-[#E7EFF8] text-[#ef7e1b] font-bold"
                                      : ""
                                  }`}
                                >
                                  {status.status_name}
                                </button>
                              ))}
                            {statuses.filter((status) =>
                              status.status_name
                                .toLowerCase()
                                .includes(bulkEditStatusSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No statuses found.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk Delete Section */}
            <div className="rounded-xl p-6 shadow-sm border border-[#E9EAEA] mt-5">
              <h3 className="text-lg font-semibold text-[#DD6B55] mb-4">
                Bulk Delete Actions
              </h3>
              <div className="space-y-4">
                <label
                  className={`flex items-center cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                    bulkDeleteMessage
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    selectedLeads.length === 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={bulkDeleteMessage}
                    onChange={(e) => setBulkDeleteMessage(e.target.checked)}
                    disabled={selectedLeads.length === 0}
                  />
                  <span className="ml-4 flex flex-col">
                    <span className="font-semibold text-gray-700">
                      Bulk Delete Message
                    </span>
                    <span className="text-sm text-gray-500">
                      Permanently delete messages for selected Shop Owners.
                    </span>
                  </span>
                </label>
                <label
                  className={`flex items-center cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                    bulkDeleteFollowUp
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    selectedLeads.length === 0
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={bulkDeleteFollowUp}
                    onChange={(e) => setBulkDeleteFollowUp(e.target.checked)}
                    disabled={selectedLeads.length === 0}
                  />
                  <span className="ml-4 flex flex-col">
                    <span className="font-semibold text-gray-700">
                      Bulk Delete Follow-up Date
                    </span>
                    <span className="text-sm text-gray-500">
                      Remove the scheduled follow-up dates from selected Shop Owners.
                    </span>
                  </span>
                </label>
              </div>

            </div>
 <button
                onClick={handleBulkActionsSubmit}
                disabled={
                  selectedLeads.length === 0 ||
                  (!bulkDeleteMessage &&
                    !bulkDeleteFollowUp &&
                    !bulkAssignUser &&
                    !bulkChangeStatus)
                }
                className={`mt-6 w-full h-[44px] bg-[#ef7e1b] text-white rounded-[10px] transition-colors text-base font-medium shadow-sm ${
                  selectedLeads.length === 0 ||
                  (!bulkDeleteMessage &&
                    !bulkDeleteFollowUp &&
                    !bulkAssignUser &&
                    !bulkChangeStatus)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#ee7f1b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e4053]"
                }`}
              >
                Apply Selected Actions
              </button>

            {/* Info and spacing at the bottom */}
            <div className="mt-8 text-center text-[#4B5563] text-sm">
              {selectedLeads.length === 0 ? (
                <span>Select Shop Owners to enable bulk actions.</span>
              ) : (
                <span>
                  {selectedLeads.length} Shop Owner
                  {selectedLeads.length > 1 ? "s" : ""} selected.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomLeadManager;

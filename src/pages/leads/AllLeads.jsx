import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { FiChevronDown, FiEdit, FiUpload, FiDownload } from "react-icons/fi";
import { TbDotsVertical } from "react-icons/tb";
import api from "../../api";
import Swal from "sweetalert2";
import { FaCheck } from "react-icons/fa6";
import { FaFileImport } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

import { Country, State, City } from "country-state-city";

import { useAuth } from "../../auth/AuthContext";
import { useLocation } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
  
import "../../styles/scrollbar.css";
import { SidebarContext } from "../../components/Layout";

const CreateLeads = () => {

  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
  const [statuses, setStatuses] = useState([]);

  const [bulkDeleteMessage, setBulkDeleteMessage] = useState(false);
  const [bulkDeleteFollowUp, setBulkDeleteFollowUp] = useState(false);

  const [bulkAssignUser, setBulkAssignUser] = useState(false);
  const [bulkChangeStatus, setBulkChangeStatus] = useState(false);

  const [importFileType, setImportFileType] = useState("csv"); 
  const [exportFileType, setExportFileType] = useState("csv"); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] =
    useState(false);
  const editStatusDropdownRef = useRef(null);
  const [isAssignToDropdownOpen, setIsAssignToDropdownOpen] = useState(false);
  const assignToDropdownRef = useRef(null);
  const [isCsvDropdownOpen, setIsCsvDropdownOpen] = useState(false);
  const csvDropdownRef = useRef(null);
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const dateRangeDropdownRef = useRef(null);
  const [timeRange, setTimeRange] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({
    fromDate: new Date(),
    toDate: new Date(),
  });

 
  const [createdDateRangeDropdownOpen, setCreatedDateRangeDropdownOpen] =
    useState(false);
  const createdDateRangeDropdownRef = useRef(null);
  const [createdTimeRange, setCreatedTimeRange] = useState("all"); 
  const [customCreatedDateRange, setCustomCreatedDateRange] = useState({
    fromDate: new Date(),
    toDate: new Date(),
  });
  


  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);


  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);
  const itemsPerPageDropdownRef = useRef(null);


  const formatDateForDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB");
  };


  const formatDateForTable = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };


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
       <span className="text-[10px] ml-1 text-gray-900 whitespace-nowrap inline-flex flex-col">
  <span>{time}</span>
  <span className="text-[10px] text-gray-600">{date}</span>
</span>
      );
  };

  const { user, rolePermissions } = useAuth();
  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const moduleNameFromUrl = pathParts[0] ? pathParts[0].toLowerCase() : null;


  const permissionsForLeadsModule = useMemo(() => {
    if (rolePermissions === "ALL") {
      return ["create", "edit", "delete", "view"];
    }
    if (!moduleNameFromUrl || !Array.isArray(rolePermissions)) return [];
    const found = rolePermissions.find(
      (perm) => perm.module && perm.module.toLowerCase() === moduleNameFromUrl
    );
    return found ? found.permissions : [];
  }, [rolePermissions, moduleNameFromUrl]);


  const hasBulkAssignPermission =
    rolePermissions === "ALL" || !rolePermissions?.includes("noBulkAssign");
  const hasCsvPermission =
    rolePermissions === "ALL" || !rolePermissions?.includes("noCsv");


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

  const handleBulkActionsSubmit = async () => {
    if (selectedLeads.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Shop Owners Selected",
        text: "Please select shop owners to perform bulk actions.",
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


    if (bulkAssignUser && !selectedAssignee) {
      Swal.fire({
        icon: "error",
        title: "User Not Selected",
        text: "Please select a user to assign shop owners to.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    if (bulkChangeStatus && !bulkEditSelectedStatus) {
      Swal.fire({
        icon: "error",
        title: "Status Not Selected",
        text: "Please select a status to change shop owners to.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Performing bulk actions for ${selectedLeads.length} shop owners...`,
        html: "Please wait, this may take a moment.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const successfulUpdates = [];
      const failedUpdates = [];

 
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
          safeAppend(formDataToSend, "route", leadToUpdate.route);


          

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

  // Handler for predefined time range changes
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setDateRangeDropdownOpen(false);
  };

  // Handler for custom date range input changes
  const handleCustomDateChange = (type, dateString) => {
    setCustomDateRange((prev) => ({
      ...prev,
      [type]: new Date(dateString),
    }));
  };

  // Handler for custom created date range input changes
  const handleCustomCreatedDateChange = (type, dateString) => {
    setCustomCreatedDateRange((prev) => ({
      ...prev,
      [type]: new Date(dateString),
    }));
  };

  // Handler for predefined time range changes for created date
  const handleCreatedTimeRangeChange = (range) => {
    setCreatedTimeRange(range);
    setCreatedDateRangeDropdownOpen(false);
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


  const [branchHierarchy, setBranchHierarchy] = useState([]);
const [selectedBranch, setSelectedBranch] = useState(null);
const [selectedRoute, setSelectedRoute] = useState(null);
const [selectedArea, setSelectedArea] = useState(null);

useEffect(() => {
  const fetchBranchData = async () => {
    try {
      const res = await api.get("/branch-hierarchy");
      if (res.data.status) {
        setBranchHierarchy(res.data.data);
      }
    } catch (err) {
      console.error("Branch hierarchy fetch failed:", err);
    }
  };

  fetchBranchData();
}, []);


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
    statusId: "all",
    assignedTo: "all",
    followUp: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    route:"",
    near_location: "",
  branch_code: "",
  area: "",
  village: "",
  customer_relationship:"",
  source_column:"",
  latitude: "",
  longitude: "",
  Join_date: "",
  shop_image: null,
    follow_up_date_input: "", // Changed from follow_up
    follow_up_time_input: "", // New field for time
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
  const [shopImagePreview, setShopImagePreview] = useState(null);
  
  

  // For create: separate state
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phoneno: "",
    city: "",
    whatsapp: "",
    requirements: "",
    source: "",
    route:"",
    near_location:"",
    branch_code:"",
    area:"",
    village:"",
    customer_relationship:"",
    source_column:"",
    latitude:"",
    longitude:"",
    Join_date:"",
    shop_image:"",
    assigned_to: "",
    follow_up_date_input: "", // Changed from follow_up
    follow_up_time_input: "", // New field for time
    status: "new",
    message: "",
    role: "User",
    is_approved: false,
    profile_pic: null,
    // New address fields
    blockUnitStreetName: "",
    state: "",
    country: "India",
    pincode: "",
    
  });
  const [createImagePreview, setCreateImagePreview] = useState(null);
  const [createShopImagePreview, setCreateShopImagePreview] = useState(null);
  const [shopImageFile, setShopImageFile] = useState(null);


  // Add state for users
  const [users, setUsers] = useState([]);

  // Set filters from navigation state (e.g., from Dashboard user card click)
  useEffect(() => {
    if (location.state && users.length > 0) {
      // Assigned To
      let assignedToName = filters.assignedTo;
      if (location.state.assignedTo) {
        const assignedUser = users.find(
          (u) => u.id === location.state.assignedTo
        );
        if (assignedUser) {
          assignedToName = assignedUser.name.toLowerCase();
        }
      }
      // Only update filters if changed
      if (filters.assignedTo !== assignedToName) {
        setFilters({ ...filters, assignedTo: assignedToName });
      }

      // Only update page if not already 1
      if (currentPage !== 1) setCurrentPage(1);

      // Set updated date filter to today, but only if not already set
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );
      const fromDate = customUpdatedDateRange?.fromDate;
      const toDate = customUpdatedDateRange?.toDate;
      const isAlreadyToday =
        updatedTimeRange === "custom" &&
        fromDate &&
        toDate &&
        fromDate.getTime() === today.getTime() &&
        toDate.getTime() === todayEnd.getTime();
      if (!isAlreadyToday) {
        setUpdatedTimeRange("custom");
        setCustomUpdatedDateRange({
          fromDate: today,
          toDate: todayEnd,
        });
      }
    }
    // eslint-disable-next-line
  }, [location.state, users]);

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

  // Add refs for filter dropdowns
  const customerNameDropdownRef = useRef(null);
  const cityFilterDropdownRef = useRef(null); 
  const assignedToDropdownRef = useRef(null);

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
          // If result is not an array, try to use it directly or set empty array
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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get("/showlead");
      if (response.data.success) {
        setLeads(
          Array.isArray(response.data.result) ? response.data.result : []
        );
      } else {
        setError("Failed to fetch Shop Owners");
        setLeads([]); // Defensive: set to empty array on error
      }
    } catch (err) {
      setError("Error fetching Shop Owners: " + err.message);
      setLeads([]); // Defensive: set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchUsers();
    fetchStatuses(); // Add this line to fetch statuses
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

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
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

  // Add useEffect for assign to dropdown click outside
  useEffect(() => {
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

  // Add useEffect for country dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setCountryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for state dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target)
      ) {
        setStateDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for city dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Add useEffect for status dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        editStatusDropdownRef.current &&
        !editStatusDropdownRef.current.contains(event.target)
      ) {
        setIsEditStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        activeDropdown === "statusId" &&
        statusDropdownFilterRef.current &&
        !statusDropdownFilterRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      if (
        activeDropdown === "assignedTo" &&
        assignedToDropdownRef.current &&
        !assignedToDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      // Add follow up date range dropdown click outside
      if (
        dateRangeDropdownOpen &&
        followUpDateRangeDropdownRef.current &&
        !followUpDateRangeDropdownRef.current.contains(event.target)
      ) {
        setDateRangeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dateRangeDropdownOpen]);

  // Add useEffect for custom pagination dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemsPerPageDropdownRef.current &&
        !itemsPerPageDropdownRef.current.contains(event.target)
      ) {
        setIsItemsPerPageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const [updatedDateRangeDropdownOpen, setUpdatedDateRangeDropdownOpen] =
    useState(false);
  const updatedDateRangeDropdownRef = useRef(null);
  const [updatedTimeRange, setUpdatedTimeRange] = useState("all"); // "all", "7days", "30days", "90days", "custom"
  const [customUpdatedDateRange, setCustomUpdatedDateRange] = useState({
    fromDate: new Date(),
    toDate: new Date(),
  });

  // Handler for custom updated date range input changes
  const handleCustomUpdatedDateChange = (type, dateString) => {
    setCustomUpdatedDateRange((prev) => ({
      ...prev,
      [type]: new Date(dateString),
    }));
  };

  // Handler for predefined time range changes for updated date
  const handleUpdatedTimeRangeChange = (range) => {
    setUpdatedTimeRange(range);
    setUpdatedDateRangeDropdownOpen(false);
  };

  // Handler to apply custom updated date range
  const applyCustomUpdatedDateRange = () => {
    if (customUpdatedDateRange.fromDate && customUpdatedDateRange.toDate) {
      setUpdatedTimeRange("custom");
      setUpdatedDateRangeDropdownOpen(false);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Date Range",
        text: "Please select both a start and end date for the custom range.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // Add useEffect for updated date range dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        updatedDateRangeDropdownRef.current &&
        !updatedDateRangeDropdownRef.current.contains(event.target)
      ) {
        setUpdatedDateRangeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter leads based on search term and filter criteria
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const searchLower = searchTerm.toLowerCase();

        // Parse the address object if it exists and is a string
        let parsedAddress = null;
        if (lead.city && typeof lead.city === "string") {
          try {
            // Only try to parse if it looks like JSON (starts with { or [)
            if (lead.city.trim().startsWith('{') || lead.city.trim().startsWith('[')) {
              parsedAddress = JSON.parse(lead.city);
            } else {
              // If it's just a plain string, treat it as city name
              parsedAddress = { city: lead.city };
            }
          } catch (e) {
            // If parsing fails, treat it as a plain city name
            parsedAddress = { city: lead.city };
          }
        } else if (lead.city && typeof lead.city === "object") {
          // If for some reason it's already an object (e.g., from an older API response or direct setting)
          parsedAddress = lead.city;
        }

        // Search across all relevant fields
        const matchesSearch =
          // Basic info
          lead?.customer_name?.toLowerCase()?.includes(searchLower) ||
          lead?.email?.toLowerCase()?.includes(searchLower) ||
          lead?.contact?.toLowerCase()?.includes(searchLower) ||
          // Check parsedAddress properties for search
          parsedAddress?.blockUnitStreetName
            ?.toLowerCase()
            ?.includes(searchLower) ||
          parsedAddress?.city?.toLowerCase()?.includes(searchLower) || // Check city in parsed address
          parsedAddress?.state?.toLowerCase()?.includes(searchLower) ||
          parsedAddress?.country?.toLowerCase()?.includes(searchLower) ||
          parsedAddress?.pincode?.toLowerCase()?.includes(searchLower) ||
          lead?.whatsapp_number?.toLowerCase()?.includes(searchLower) ||
          lead?.requirements?.toLowerCase()?.includes(searchLower) ||
          lead?.status_name?.toLowerCase()?.includes(searchLower) ||
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
          parsedAddress?.city
            ?.toLowerCase()
            ?.includes(filters.city.toLowerCase()); // Use parsedAddress.city

        const matchesRequirements =
          filters.requirements === "all" ||
          lead?.requirements
            ?.toLowerCase()
            ?.includes(filters.requirements.toLowerCase());

        const matchesStatus =
          filters.statusId === "all" ||
          String(lead?.status_id) === String(filters.statusId);

        const matchesAssignedTo =
          filters.assignedTo === "all" ||
          lead?.assigned_to?.toLowerCase() === filters.assignedTo.toLowerCase();

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

        // New logic for updated date range filtering
        const matchesUpdatedDateRange = () => {
          if (!lead.updated) return false; // Leads without updated date won't match

          // Parse the updated date string (format: "YYYY-MM-DD HH:MM:SS")
          let updatedDateObj;
          if (lead.updated.includes("-")) {
            // Try to parse as ISO or MySQL datetime
            updatedDateObj = new Date(lead.updated.replace(/-/g, "/"));
            if (isNaN(updatedDateObj.getTime())) {
              // fallback: try Date(lead.updated)
              updatedDateObj = new Date(lead.updated);
            }
          } else {
            updatedDateObj = new Date(lead.updated);
          }
          if (isNaN(updatedDateObj.getTime())) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0); // Normalize to start of day

          switch (updatedTimeRange) {
            case "7days": {
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(today.getDate() - 7);
              return updatedDateObj >= sevenDaysAgo && updatedDateObj <= today;
            }
            case "30days": {
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(today.getDate() - 30);
              return updatedDateObj >= thirtyDaysAgo && updatedDateObj <= today;
            }
            case "90days": {
              const ninetyDaysAgo = new Date(today);
              ninetyDaysAgo.setDate(today.getDate() - 90);
              return updatedDateObj >= ninetyDaysAgo && updatedDateObj <= today;
            }
            case "custom": {
              const from = new Date(customUpdatedDateRange.fromDate);
              from.setHours(0, 0, 0, 0);
              const to = new Date(customUpdatedDateRange.toDate);
              to.setHours(23, 59, 59, 999);
              return updatedDateObj >= from && updatedDateObj <= to;
            }
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
          matchesStatus &&
          matchesAssignedTo &&
          matchesFollowUp &&
          matchesFollowUpDateRange() &&
          matchesCreatedDateRange() &&
          matchesUpdatedDateRange() // <-- add this
        );
      }),
    [
      leads,
      searchTerm,
      filters,
      timeRange,
      customDateRange,
      createdTimeRange,
      customCreatedDateRange,
      updatedTimeRange,
      customUpdatedDateRange,
    ]
  );

  // Open create modal: reset createFormData
  const openCreateModal = () => {
    setEditingLead(null);
    // Find India country object
    const india = countries.find((c) => c.name === "India");
    setCreateFormData({
      name: "",
      email: "",
      phoneno: "",
      city: "",
      whatsapp: "",
      requirements: "",
      route:"",
      source: "",
       near_location:"",
    branch_code:"",
    area:"",
    village:"",
    customer_relationship:"",
    source_column:"",
    latitude:"",
    longitude:"",
    Join_date:"",
    shop_image:"",
      assigned_to: "",
      follow_up_date_input: "", // Initialize with empty string
      follow_up_time_input: "", // Initialize with empty string
      status: "new",
      message: "",
      role: "User",
      is_approved: false,
      profile_pic: null,
      // New address fields
      blockUnitStreetName: "",
      state: "",
      country: "India",
      pincode: "",
    });
    if (india) {
      setSelectedCountryObj(india);
      setStates(State.getStatesOfCountry(india.isoCode));
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setCities([]);
      setCountrySearchTerm("India");
      setStateSearchTerm("");
      setCitySearchTerm("");
    } else {
      setSelectedCountryObj(null);
      setStates([]);
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setCities([]);
      setCountrySearchTerm("");
      setStateSearchTerm("");
      setCitySearchTerm("");
    }
    setIsModalOpenCreate(true);
  };

  // Helper function for form validation
  const validateFormData = (data) => {
    const errors = [];

    if (!data.name || data.name.trim() === "") {
      errors.push("Lead Name is required.");
    }
    if (!data.phoneno || data.phoneno.trim() === "") {
      errors.push("Contact is required.");
    }
    return errors;
  };

  // Function to handle submission of the Create Lead form:
 const handleCreateSubmit = async (e) => {
  e.preventDefault();

  const validationErrors = validateFormData(createFormData);
  if (validationErrors.length > 0) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      html: validationErrors.map((err) => `<div>${err}</div>`).join(""),
      confirmButtonColor: "#DD6B55",
    });
    return;
  }

  let loadingAlert;

  try {
    const formData = new FormData();

    // --- assigned_to fix ---
    let assignedToId = 1;

    // --- status fix ---
    const selectedStatus =
      statuses.find(
        (status) =>
          status.status_name.toLowerCase().replace(/\s+/g, "_") ===
          createFormData.status
      ) || { status_name: "", status_id: 1 };

    // --- follow up merge ---
    let combinedFollowUpDate = "";
    if (createFormData.follow_up_date_input) {
      const datePart = createFormData.follow_up_date_input;
      const timePart = createFormData.follow_up_time_input
        ? createFormData.follow_up_time_input + ":00"
        : "00:00:00";

      combinedFollowUpDate = `${datePart} ${timePart}`;
    }

    // --- find village_id ---
    let villageId = 0;

    const branchObj = branchHierarchy.find(
      (b) => b.branch_name === createFormData.branch_code
    );

    const routeObj = branchObj?.routes?.find(
      (r) => r.route_name === createFormData.route
    );

    const areaObj = routeObj?.areas?.find(
      (a) => a.area_name === createFormData.area
    );

    const villageObj = areaObj?.villages?.find(
      (v) => v.village_name === createFormData.village
    );

    villageId = Number(villageObj?.village_id) || 0;

    // --- branchdetail object ---
    const branchDetailObject = {
      branch: createFormData.branch_code || "",
      route: createFormData.route || "",
      area: createFormData.area || "",
      village_id: villageId || "",
    };

    const finalBranchDetail = JSON.stringify(branchDetailObject);

    // --- address object ---
    const addressObject = {
      street: createFormData.blockUnitStreetName || "",
      city: createFormData.city || "",
      state: createFormData.state || "",
      country: createFormData.country || "",
      pincode: createFormData.pincode || "", // ✅ Changed from "pin" to "pincode" to match backend
    };

    const isAddressEmpty =
      !addressObject.street &&
      !addressObject.city &&
      !addressObject.state &&
      (!addressObject.country || addressObject.country === "India") &&
      !addressObject.pincode; // ✅ Changed from "pin" to "pincode"

    const finalAddress = isAddressEmpty ? "" : JSON.stringify(addressObject);

    // --- FINAL PAYLOAD ---
    const formattedData = {
      customer_name: createFormData.name,
      email: createFormData.email,
      contact_number: createFormData.phoneno,
      whatsapp_number: createFormData.whatsapp,

      route: createFormData.route,
      shop_name: createFormData.requirements || "",
      source: createFormData.source,

      assigned_to: 1,

      near_location: createFormData.near_location,
      branch_code: createFormData.branch_code,
      area: createFormData.area,

      village: villageId,
      village_id: villageId,

      customer_relationship: createFormData.customer_relationship,
      source_column: createFormData.source_column,
      Join_date: createFormData.Join_date,

      shop_image: createFormData.shop_image,
      profile_image: createFormData.profile_pic,

      follow_up_date: combinedFollowUpDate,
      category: selectedStatus.status_name,
      status_id: selectedStatus.status_id,

      message: createFormData.message,

      vilage_assigned_to: 1 || "",

      // ⭐ CORRECT JSON STRINGS
     address: finalAddress,
     branchdetail: finalBranchDetail,
    };

    // ⭐ LATITUDE & LONGITUDE - Only add if values exist
    if (createFormData.latitude) {
      formattedData.latitude = createFormData.latitude;
    }
    if (createFormData.longitude) {
      formattedData.longitude = createFormData.longitude;
    }

    console.log(formattedData);

    // If not admin, force own assignment
    if (user?.role !== "admin") {
      formattedData.assigned_to = user.id;
    }

    formattedData.assigned_to = Number(formattedData.assigned_to);

    // Append fields
    Object.keys(formattedData).forEach((key) => {
      if (key === "profile_image" && formattedData[key]) {
        formData.append("profile_image", formattedData[key]);
      } else {
        formData.append(key, formattedData[key] ?? "");
      }
    });

    // Loader
    loadingAlert = Swal.fire({
      title: "Creating Shop Owner...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

      const response = await api.post("/addcustomer", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status || response.data.success) {
        const newLead = response.data.data;
        setLeads((prev) =>
          Array.isArray(prev) ? [...prev, newLead] : [newLead]
        );
        setIsModalOpenCreate(false);

        await loadingAlert.close();

        await Swal.fire({
          icon: "success",
          title: "Shop Owner Created Successfully",
          text:  `Shop Owner has been added to the system.`,
          confirmButtonColor: "#0e4053",
        });

        // Fetch leads again instead of reloading the page
        await fetchLeads();

        setCreateFormData({
          name: "",
          email: "",
          phoneno: "",
          city: "",
          whatsapp: "",
          requirements: "",
          source: "",
          route:"",
           near_location:"",
    branch_code:"",
    area:"",
    village:"",
    customer_relationship:"",
    source_column:"",
    latitude:"",
    longitude:"",
    Join_date:"",
    shop_image:"",
          assigned_to: "",
          follow_up_date_input: "", // Changed from follow_up
          follow_up_time_input: "", // New field for time
          status: "new",
          message: "",
          role: "User",
          is_approved: false,
          profile_pic: null,
          // New address fields
          blockUnitStreetName: "",
          state: "",
          country: "India",
          pincode: "",
        });
        if (createImagePreview) {
          URL.revokeObjectURL(createImagePreview);
        }
        setCreateImagePreview(null);
        if (createShopImagePreview) {
          URL.revokeObjectURL(createShopImagePreview);
        }
        setCreateShopImagePreview(null);

        // Clear address fields
        clearAddressFields();
      } else {
        throw new Error(response.data.message || "Failed to create shop owner.");
      }
    } catch (err) {
      if (loadingAlert) {
        await loadingAlert.close();
      }

      let errorTitle = "Error Creating Shop Owners";
      let errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "An error occurred while creating the shop owner. Please try again.";

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
  };

  // New handler for file selection (drag/drop or input)
  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (importFileType === "csv") {
      // Accept only .csv files
      if (
        file.name.toLowerCase().endsWith(".csv") &&
        (file.type === "text/csv" ||
          file.type === "application/vnd.ms-excel" ||
          file.type === "")
      ) {
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
    } else if (importFileType === "xls") {
      // Accept only .xls or .xlsx files
      if (
        file.name.toLowerCase().endsWith(".xls") ||
        file.name.toLowerCase().endsWith(".xlsx")
      ) {
        setSelectedFile(file);
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid File Type",
          text: "Please upload an XLS or XLSX file.",
          confirmButtonColor: "#DD6B55",
        });
        setSelectedFile(null);
      }
    }
  };

  // Function to handle the actual CSV file upload
  const uploadCsvFile = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: "error",
        title: "No File Selected",
        text: "Please select a file to import.",
        confirmButtonColor: "#DD6B55",
      });
      return;
    }

    setIsImportModalOpen(false);
    let loadingAlert;
    try {
      loadingAlert = Swal.fire({
        title: `Importing Shop Owners from ${importFileType.toUpperCase()}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();
      formData.append(
        importFileType === "csv" ? "csv_file" : "file",
        selectedFile
      );

      let response;
      if (importFileType === "xls") {
        // Use the XLS import API
        response = await api.post("/import-xls", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Default to CSV import API
        response = await api.post("/leads-import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await loadingAlert.close();
      if (response.data.success) {
        // Prepare duplicate info
        const imported = response.data.imported || 0;
        const duplicateSkipped = response.data.duplicate_skipped || 0;
        const duplicateRecords =
          response.data.duplicate_records || response.data.dup_records || [];
        // Only show these fields in the table
        const displayFields = [
          "customer_name",
          "email",
          "contact_number",
          "city",
          "whatsapp_number",

        ];
        // If records are objects, get keys for table header
        let tableHeaders = [];
        if (
          duplicateRecords.length > 0 &&
          typeof duplicateRecords[0] === "object"
        ) {
          tableHeaders = Object.keys(duplicateRecords[0]);
        }
        // Table HTML (only displayFields)
        let duplicateTableHtml = "";
        if (duplicateRecords.length > 0) {
          const visibleHeaders = displayFields.filter((h) =>
            tableHeaders.includes(h)
          );
          duplicateTableHtml = `
            <div style="max-height:250px;overflow:auto;border:1px solid #eee;margin-top:10px;margin-bottom:10px;">
              <table style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead>
                  <tr>
                    ${visibleHeaders
                      .map(
                        (h) =>
                          `<th style='border:1px solid #eee;padding:2px;background:#f8f8f8;'>${h}</th>`
                      )
                      .join("")}
                  </tr>
                </thead>
                <tbody>
                  ${duplicateRecords
                    .map(
                      (row) =>
                        `<tr>${visibleHeaders
                          .map(
                            (h) =>
                              `<td style='border:1px solid #eee;padding:2px;'>${
                                row[h] ?? ""
                              }</td>`
                          )
                          .join("")}</tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            <button id="copy-duplicates-btn" style="margin-bottom:10px;padding:6px 12px;background:#0e4053;color:#fff;border:none;border-radius:4px;cursor:pointer;">Copy Table to Clipboard (CSV)</button>
          `;
        }
        // Main HTML
        const html = `
          <div style='text-align:left;'>
            <div><b>Imported:</b> ${imported}</div>
            <div><b>Duplicates Skipped:</b> ${duplicateSkipped}</div>
            ${
              duplicateRecords.length > 0
                ? `<div style='margin-top:10px;'><b>Duplicate Records:</b>${duplicateTableHtml}</div>`
                : ""
            }
          </div>
        `;
        await Swal.fire({
          icon: "success",
          title: "Import Result",
          html,
          confirmButtonColor: "#0e4053",
          didOpen: () => {
            if (duplicateRecords.length > 0) {
              const btn = document.getElementById("copy-duplicates-btn");
              if (btn) {
                btn.onclick = () => {
                  // Convert table to CSV for clipboard (all fields)
                  const csv = [
                    tableHeaders.join(","),
                    ...duplicateRecords.map((row) =>
                      tableHeaders
                        .map(
                          (h) =>
                            `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`
                        )
                        .join(",")
                    ),
                  ].join("\n");
                  copyToClipboard(csv);
                };
              }
            }
          },
        });
        // Refresh leads after import
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
        title: `Exporting Shop Owners as ${exportFileType.toUpperCase()}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let response;
      if (exportFileType === "xls") {
        // Use the XLS export API
        response = await api.get("/export-xls", {
          responseType: "blob",
        });
      } else {
        // Default to CSV export API
        response = await api.get("/leads-export", {
          responseType: "blob",
        });
      }

      await loadingAlert.close();
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          exportFileType === "csv" ? "leads.csv" : "leads.xls"
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        await Swal.fire({
          icon: "success",
          title: "Export Successful!",
          text: `Leads exported to ${
            exportFileType === "csv" ? "leads.csv" : "leads.xls"
          }.`,
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

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Check if the search term looks like a mobile number (10 digits)
    const mobileNumberPattern = /^\d{10}$/;
    if (mobileNumberPattern.test(value.trim())) {
      try {
        setLoading(true);
        const response = await api.get(`/leads/search?contact_number=${value.trim()}`);
        
        // Show SweetAlert based on response status
        if (response.data.status === false) {
          Swal.fire({
            icon: "error",
            title: "Not Found",
            text: response.data.message || "Shop owner not found",
            confirmButtonColor: "#DD6B55",
          });
          setLeads([]);
        } else if (response.data.status === true || (response.data.success && response.data.result)) {
          Swal.fire({
            icon: "success",
            title: "Found",
            text: response.data.message || "Shop owner found successfully",
            confirmButtonColor: "#0e4053",
            timer: 2000,
            showConfirmButton: false,
          });
          // Update leads with search results
          setLeads(Array.isArray(response.data.result) ? response.data.result : [response.data.result]);
        } else {
          // If no results found, show empty array
          setLeads([]);
        }
      } catch (err) {
        console.error("Error searching by mobile number:", err);
        Swal.fire({
          icon: "message",
          title: "Search ",
          text: "Shop owner not found. Please Create first .",
          confirmButtonColor: "#DD6B55",
        });
        // On error, fetch all leads again
        await fetchLeads();
      } finally {
        setLoading(false);
      }
    } else if (value.trim() === "") {
      // If search is cleared, fetch all leads
      await fetchLeads();
    }
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
          Array.isArray(prev)
            ? prev.filter((lead) => !selectedLeads.includes(lead.customer_id))
            : []
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

  const getVillageName = (villageId) => {
    if (!villageId) return "";

    for (const branch of branchHierarchy) {
      for (const route of branch.routes || []) {
        for (const area of route.areas || []) {
          const village = area.villages?.find(
            (v) => v.village_id == villageId
          );
          if (village) return village.village_name;
        }
      }
    }

    return "";
  };

const handleEdit = (lead) => {
  console.log("🔍 Editing lead:", lead);
  console.log("🏠 Address data (lead.city):", lead.city);
  console.log("🏠 Address data (lead.address):", lead.address);

  setEditingLead(lead);

  // reset dropdown states
  setSelectedCountryObj(null);
  setSelectedStateObj(null);
  setSelectedCityObj(null);
  setCountries(Country.getAllCountries());
  setStates([]);
  setCities([]);
  setCountrySearchTerm("");
  setStateSearchTerm("");
  setCitySearchTerm("");

  // ✅ Parse address - handle both backend formats
  // Backend may return address in "city" or "address" field
  let parsedAddress = {};
  const addressData = lead.address || lead.city;
  
  if (addressData) {
    if (typeof addressData === "string" && addressData.startsWith("{")) {
      try {
        const parsed = JSON.parse(addressData);
        console.log("📦 Parsed address from JSON:", parsed);
        // Backend may return "street" or "name" or "address", "pincode" or "pin"
        parsedAddress = {
          name: parsed.name || parsed.street || parsed.address || "",
          city: parsed.city || "",
          state: parsed.state || "",
          country: parsed.country || "",
          pin: parsed.pin || parsed.pincode || "",
        };
        console.log("✅ Normalized address:", parsedAddress);
      } catch (err) {
        console.warn("❌ Error parsing address JSON:", err);
      }
    } else if (typeof addressData === "object") {
      // If already an object, normalize the field names
      parsedAddress = {
        name: addressData.name || addressData.street || "",
        city: addressData.city || "",
        state: addressData.state || "",
        country: addressData.country || "",
        pin: addressData.pin || addressData.pincode || "",
      };
      console.log("✅ Normalized address from object:", parsedAddress);
    } else {
      // If it's just a string, treat it as city name
      parsedAddress = { city: addressData };
      console.log("📝 Address is plain string:", parsedAddress);
    }
  } else {
    console.log("⚠️ No address data (both lead.city and lead.address are null/undefined)");
  }

  // Date/time split
  let followUpDate = "", followUpTime = "", joinDate = "";
  if (lead.follow_up_date && !isNaN(new Date(lead.follow_up_date))) {
    const dateObj = new Date(lead.follow_up_date);
    followUpDate = dateObj.toISOString().split("T")[0];
    followUpTime = dateObj.toTimeString().slice(0, 5);
  }

  if (lead.Join_date && !isNaN(new Date(lead.Join_date))) {
    const joinDateObj = new Date(lead.Join_date);
    joinDate = joinDateObj.toISOString().split("T")[0];
  }

  // ✅ FIX: Find the matching status from statuses array
  // Backend returns: status: "Kirana store", status_id: 1
  // We need to convert to: status: "kirana_store" (for form), status_name: "Kirana store", status_id: 1
  let statusForForm = "";
  let statusName = "";
  let statusId = lead.status_id || "";

  // Try to find status by status_id first (most reliable)
  if (lead.status_id) {
    const matchedStatus = statuses.find((s) => s.status_id === lead.status_id);
    if (matchedStatus) {
      statusForForm = matchedStatus.status_name.toLowerCase().replace(/\s+/g, "_");
      statusName = matchedStatus.status_name;
      statusId = matchedStatus.status_id;
    }
  }
  
  // Fallback: try to match by status name
  if (!statusForForm && lead.status) {
    const matchedStatus = statuses.find(
      (s) => s.status_name.toLowerCase() === lead.status.toLowerCase()
    );
    if (matchedStatus) {
      statusForForm = matchedStatus.status_name.toLowerCase().replace(/\s+/g, "_");
      statusName = matchedStatus.status_name;
      statusId = matchedStatus.status_id;
    } else {
      // If no match found, use the raw status value
      statusForForm = lead.status.toLowerCase().replace(/\s+/g, "_");
      statusName = lead.status;
    }
  }

  // Fill form with correct data + ID
  // ✅ Handle both web format (branch_name) and mobile format (numeric branch_code)
  let branchCodeForForm = lead.branch_code || "";
  let routeForForm = lead.route || "";
  let areaForForm = lead.area || "";
  let villageForForm = getVillageName(lead.village) || "";

  // If branch_code is numeric, find the branch_name
  if (branchCodeForForm && !isNaN(branchCodeForForm)) {
    const branch = branchHierarchy.find(
      (b) => String(b.branch_code) === String(branchCodeForForm) || 
             String(b.branch_id) === String(branchCodeForForm)
    );
    if (branch) {
      console.log("🔄 Converting numeric branch_code to branch_name:", branchCodeForForm, "→", branch.branch_name);
      branchCodeForForm = branch.branch_name;
      
      // Also convert route if numeric
      if (routeForForm && !isNaN(routeForForm)) {
        const route = branch.routes?.find(
          (r) => String(r.route_code) === String(routeForForm) || 
                 String(r.route_id) === String(routeForForm)
        );
        if (route) {
          console.log("🔄 Converting numeric route to route_name:", routeForForm, "→", route.route_name);
          routeForForm = route.route_name;
          
          // Also convert area if needed
          if (areaForForm) {
            const area = route.areas?.find((a) => a.area_name === areaForForm);
            if (area) {
              areaForForm = area.area_name;
            }
          }
        }
      }
    }
  }

  console.log("📝 Form data being set:", { branchCodeForForm, routeForForm, areaForForm, villageForForm });

  setFormData({
    id: lead.customer_id || "", // ✅ Critical: use customer_id for update API
    name: lead.customer_name || lead.name || "",
    email: lead.email || "",
    phoneno: lead.contact || lead.phoneno || "",
    whatsapp: lead.whatsapp_number || lead.whatsapp || "",
    requirements: lead.requirements || "",
    source: lead.source || "",
    route: routeForForm,
    near_location: lead.near_location || "",
    branch_code: branchCodeForForm,
    area: areaForForm,
    village: villageForForm,
    customer_relationship: lead.customer_relationship || "",
    source_column: lead.source_column || "",
    latitude: lead.latitude || "",
    longitude: lead.longitude || "",
    Join_date: lead.Join_date || "",
    shop_image: lead.shop_image || "",
    assigned_to: lead.assigned_to || "",
    follow_up_date_input: followUpDate,
    follow_up_time_input: followUpTime,
    status: statusForForm, // ✅ Fixed: use "status" not "category", in correct format
    status_name: statusName, // ✅ Added: store the display name
    status_id: statusId, // ✅ Added: store the status ID
    message: lead.message || "",
    role: lead.role || "User",
    is_approved: lead.is_approved || false,
    profile_pic: null,
    blockUnitStreetName: parsedAddress.name || "",
    city: parsedAddress.city || "",
    state: parsedAddress.state || "",
    country: parsedAddress.country || "",
    pincode: parsedAddress.pin || "",
  });

  setImagePreview(lead.profile_pic || null);
  setShopImagePreview(lead.shop_image || null);
  setIsModalOpen(true);
  setActiveDropdown(null);

  // Track editing index
  const idx = filteredLeads.findIndex(
    (l) => l.customer_id === lead.customer_id
  );
  setEditingLeadIndex(idx);
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
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
    }
  } else if (name === "shop_image") {
    const file = files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        shop_image: file,
      }));
      if (shopImagePreview) URL.revokeObjectURL(shopImagePreview);
      setShopImagePreview(URL.createObjectURL(file));
    }
  } else {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };

      // Reset dependent dropdowns
      if (name === "branch_code") {
        updated = { ...updated, route: "", area: "", village: "" };
        const branch = branchHierarchy.find((b) => b.branch_name === value);
        setSelectedBranch(branch || null);
        setSelectedRoute(null);
        setSelectedArea(null);
      }
      if (name === "route") {
        updated = { ...updated, area: "", village: "" };
        const route = selectedBranch?.routes.find((r) => r.route_name === value);
        setSelectedRoute(route || null);
        setSelectedArea(null);
      }
      if (name === "area") {
        updated = { ...updated, village: "" };
        const area = selectedRoute?.areas.find((a) => a.area_name === value);
        setSelectedArea(area || null);
      }

      return updated;
    });
  }
};


  const handleCreateInputChange = (e) => {
  const { name, value } = e.target;

  setCreateFormData((prev) => {
    let updatedForm = { ...prev, [name]: value };

    // 🔹 If branch changes → reset route, area, village
    if (name === "branch_code") {
      updatedForm = {
        ...updatedForm,
        route: "",
        area: "",
        village: "",
      };
    }

    // 🔹 If route changes → reset area, village
    if (name === "route") {
      updatedForm = {
        ...updatedForm,
        area: "",
        village: "",
      };
    }

    // 🔹 If area changes → reset village
    if (name === "area") {
      updatedForm = {
        ...updatedForm,
        village: "",
      };
    }

    return updatedForm;
  });
};



  // Add this function after handleCreateInputChange
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCreateFormData((prev) => ({
        ...prev,
        profile_pic: file,
      }));
      if (createImagePreview) {
        URL.revokeObjectURL(createImagePreview);
      }
      setCreateImagePreview(URL.createObjectURL(file));
    }
  };
const handleShopImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setCreateFormData((prev) => ({
      ...prev,
      shop_image: file, // this key will go to backend
    }));

    if (createShopImagePreview) {
      URL.revokeObjectURL(createShopImagePreview);
    }

    setCreateShopImagePreview(URL.createObjectURL(file));
    setShopImageFile(file);
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
      setCreateFormData((prev) => ({
        ...prev,
        country: "",
        state: "",
        city: "",
      }));
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
    setCreateFormData((prev) => ({
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
      setCreateFormData((prev) => ({ ...prev, state: "", city: "" }));
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
    setCreateFormData((prev) => ({ ...prev, state: state.name, city: "" }));
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
    // Prevent city search if no state is selected
    if (!stateSearchTerm) {
      return;
    }

    const value = e.target.value;
    setCitySearchTerm(value);
    setCityDropdownOpen(true);

    if (value === "") {
      setFormData((prev) => ({ ...prev, city: "" }));
      setCreateFormData((prev) => ({ ...prev, city: "" }));
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCityObj(city);
    setCitySearchTerm(city.name);
    setCityDropdownOpen(false);
    setFormData((prev) => ({ ...prev, city: city.name }));
    setCreateFormData((prev) => ({ ...prev, city: city.name }));
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

  // Helper for safe FormData appending (null/undefined -> "")
  const safeAppend = (formData, key, value) => {
    formData.append(key, value === null || value === undefined ? "" : value);
  };

  // Handle Bulk Assign
  const handleBulkAssign = async () => {
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

    // Do not close the modal here; let the user close it manually

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
          safeAppend(formDataToSend, "Shop Name", leadToUpdate.requirements);
          safeAppend(formDataToSend,  "route", leadToUpdate.route);
          safeAppend(formDataToSend, "near_location", leadToUpdate.near_location);
          safeAppend(formDataToSend, "branch_code", leadToUpdate.branch_code);
          safeAppend(formDataToSend, "area", leadToUpdate.area);
          safeAppend(formDataToSend, "village", leadToUpdate.village);
          safeAppend(formDataToSend, "customer_relationship", leadToUpdate.customer_relationship);
        safeAppend(formDataToSend, "source_column", leadToUpdate.source_column);
          safeAppend(formDataToSend, "latitude", leadToUpdate.latitude);
          safeAppend(formDataToSend, "longitude", leadToUpdate.longitude);
          safeAppend(formDataToSend, "shop_image", leadToUpdate.shop_image);
          safeAppend(
  formDataToSend,
  "Join_date",
  leadToUpdate.Join_date ? leadToUpdate.Join_date : ""
);
          safeAppend(
            formDataToSend,
            "follow_up_date",
            leadToUpdate.follow_up_date_input
          );
          safeAppend(
            formDataToSend,
            "follow_up_time",
            leadToUpdate.follow_up_time_input
          );
          safeAppend(formDataToSend, "category", leadToUpdate.status_name);
          safeAppend(formDataToSend, "status_id",  1);
          safeAppend(formDataToSend, "message", leadToUpdate.message);
          safeAppend(formDataToSend, "assigned_to", assigneeId);

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
              ? `<span class="text-red-500">${failedAssignments.length} lead(s) failed to assign.</span>`
              : ""
          }`,
          confirmButtonColor: "#0e4053",
        });
      } else if (failedAssignments.length > 0) {
        await Swal.fire({
          icon: "error",
          title: "Bulk Assignment Failed",
          html: `Failed to assign all Shop Owners. ${failedAssignments.length} lead(s) encountered errors.`, // You might show more details here if needed
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
      setSelectedAssignee("");
      setAssigneeSearchTerm("");
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
          setLeads((prev) =>
            Array.isArray(prev) ? prev.filter((l) => l.customer_id !== id) : []
          );
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
          title: "Delete Lead Failed",
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

  if (!formData.id) {
    return Swal.fire({
      icon: "error",
      title: "Missing ID",
      text: "Cannot update shop owner because no ID was found.",
      confirmButtonColor: "#DD6B55",
    });
  }

  let loadingAlert;

  try {
    loadingAlert = Swal.fire({
      title: "Updating Shop Owner...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const fd = new FormData();
    const safeAppend = (k, v) => fd.append(k, v ?? "");

    // -------------------------------
    // ⭐ MATCH EXACTLY LIKE CREATE
    // -------------------------------

    safeAppend("customer_name", formData.name);
    safeAppend("email", formData.email);
    safeAppend("contact_number", formData.phoneno);
    safeAppend("whatsapp_number", formData.whatsapp);

    // SHOP NAME (requirements)
    safeAppend("shop_name", formData.requirements);

    safeAppend("source", formData.source);
    safeAppend("route", formData.route);
    safeAppend("near_location", formData.near_location);
    safeAppend("branch_code", formData.branch_code);
    safeAppend("area", formData.area);

    // ---------- VILLAGE ----------
    // safeAppend("village", Number(formData.village_id));
// ------------------------------
// ⭐ FIND VILLAGE ID (same as CREATE)
// ------------------------------
let villageId = 0;

const branchObj = branchHierarchy.find(
  (b) => b.branch_name === formData.branch_code
);

const routeObj = branchObj?.routes?.find(
  (r) => r.route_name === formData.route
);

const areaObj = routeObj?.areas?.find(
  (a) => a.area_name === formData.area
);

const villageObj = areaObj?.villages?.find(
  (v) => v.village_name === formData.village
);

villageId = Number(villageObj?.village_id) || 0;

// Fallback to existing village_id if calculation fails
if (villageId === 0 && formData.village_id) {
  villageId = Number(formData.village_id);
}

// Validate village_id before proceeding
if (!villageId || villageId === 0) {
  await Swal.fire({
    icon: "warning",
    title: "Village Required",
    text: "Please select a valid Branch, Route, Area, and Village before updating.",
    confirmButtonColor: "#003A72",
  });
  return;
}

safeAppend("village", villageId);


    safeAppend("customer_relationship", formData.customer_relationship);
    safeAppend("source_column", formData.source_column);

    safeAppend("Join_date", formData.Join_date);

    // ---------- LATITUDE & LONGITUDE ----------
    if (formData.latitude) {
      safeAppend("latitude", formData.latitude);
    }
    if (formData.longitude) {
      safeAppend("longitude", formData.longitude);
    }

    // ---------- STATUS ----------
    safeAppend("category", formData.status_name || "");
    safeAppend("status_id", Number(formData.status_id) || 1);

    safeAppend("message", formData.message);

    // ---------- ASSIGNED TO ----------
    safeAppend("assigned_to", 1);

    // ---------- FOLLOW UP ----------
    const mergedFollowup = formData.follow_up_date_input
      ? `${formData.follow_up_date_input} ${(formData.follow_up_time_input || "00:00")}:00`
      : "";

    safeAppend("follow_up_date", mergedFollowup);

    // ---------- IMAGES ----------
    if (formData.profile_pic instanceof File) {
      fd.append("profile_image", formData.profile_pic);
    }

    if (formData.shop_image instanceof File) {
      fd.append("shop_image", formData.shop_image);
    }

    // ---------- ADDRESS JSON ----------
    const addressJSON = JSON.stringify({
      street: formData.blockUnitStreetName || "",
      city: formData.city || "",
      state: formData.state || "",
      country: formData.country || "",
      pincode: formData.pincode || "",
    });

    safeAppend("address", addressJSON);

    // ---------- BRANCHDETAIL JSON ----------
    const branchDetailJSON = JSON.stringify({
      branch_code: formData.branch_code || "",
      route: formData.route || "",
      area: formData.area || "",
      village_id:villageId || "",
    });

    safeAppend("branchdetail", branchDetailJSON);

    // ---------- VILLAGE ASSIGNED ----------
    safeAppend("village_assigned_to", formData.village_assigned_to || 1);

    // -----------------------------------
    // API CALL
    // -----------------------------------
    const response = await api.post(
      `/udateshopowner/${formData.id}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    await loadingAlert.close();

    if (response.data.status || response.data.success) {
      await Swal.fire({
        icon: "success",
        title: "Shop Owner Updated",
        confirmButtonColor: "#0e4053",
      });

      setIsModalOpen(false);
      await fetchLeads();
    } else {
      throw new Error(response.data.message);
    }

  } catch (err) {
    if (loadingAlert) await loadingAlert.close();

    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: err.response?.data?.message || err.message,
      confirmButtonColor: "#DD6B55",
    });
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

  // Update the status dropdown in the create form
  // ✅ Updated to accept parameters for reusability (create vs edit)
  const renderStatusDropdown = (isEditMode = false) => {
    const currentStatus = isEditMode ? formData.status : createFormData.status;
    const isDropdownOpen = isEditMode ? isEditStatusDropdownOpen : isStatusDropdownOpen;
    const setDropdownOpen = isEditMode ? setIsEditStatusDropdownOpen : setIsStatusDropdownOpen;
    const dropdownRef = isEditMode ? editStatusDropdownRef : statusDropdownRef;
    const handleChange = isEditMode ? handleInputChange : handleCreateInputChange;

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!isDropdownOpen)}
          className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] text-left flex items-center justify-between cursor-pointer"
        >
          <span>
            {statuses.find(
              (status) =>
                status.status_name.toLowerCase().replace(/\s+/g, "_") ===
                currentStatus
            )?.status_name || "Select Categories"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
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
        {isDropdownOpen && (
          <div className="absolute top-full custom-scrollbar left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto cursor-pointer">
            {statuses.map((status) => (
              <button
                key={status.status_id}
                type="button"
                onClick={() => {
                  handleChange({
                    target: {
                      name: "status",
                      value: status.status_name
                        .toLowerCase()
                        .replace(/\s+/g, "_"),
                    },
                  });
                  // Also update status_name and status_id for edit mode
                  if (isEditMode) {
                    setFormData((prev) => ({
                      ...prev,
                      status_name: status.status_name,
                      status_id: status.status_id,
                    }));
                  }
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
              >
                {status.status_name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Modified to accept props for reusability
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
      if (createImagePreview) {
        URL.revokeObjectURL(createImagePreview);
      }
      if (createShopImagePreview) {
        URL.revokeObjectURL(createShopImagePreview);
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      if (shopImagePreview) {
        URL.revokeObjectURL(shopImagePreview);
      }
    };
  }, [createImagePreview, createShopImagePreview, imagePreview, shopImagePreview]);
  

  // 2. Add state to track the index of the currently edited lead in filteredLeads
  const [editingLeadIndex, setEditingLeadIndex] = useState(null);

  // 3. Add navigation handlers
  const handleEditBack = async (e) => {
    await handleSubmit(e, "back");
    if (editingLeadIndex > 0) {
      const prevLead = filteredLeads[editingLeadIndex - 1];
      handleEdit(prevLead);
    }
  };
  const handleEditNext = async (e) => {
    await handleSubmit(e, "next");
    if (editingLeadIndex < filteredLeads.length - 1) {
      const nextLead = filteredLeads[editingLeadIndex + 1];
      handleEdit(nextLead);
    }
  };

  // Add ref for follow up date range dropdown
  const followUpDateRangeDropdownRef = useRef(null);

  // Add ref for status filter dropdown
  const statusDropdownFilterRef = useRef(null);

  const [bulkEditStatusSearch, setBulkEditStatusSearch] = useState("");
  const [isBulkEditStatusDropdownOpen, setIsBulkEditStatusDropdownOpen] =
    useState(false);
  const [bulkEditSelectedStatus, setBulkEditSelectedStatus] = useState(null);

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
              reason: "Shop Owner not found locally.",
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
            leadToUpdate.follow_up_date_input
          );
          safeAppend(
            formDataToSend,
            "follow_up_time",
            leadToUpdate.follow_up_time_input
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
      // Refresh leads and reset state
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
      setBulkEditStatusSearch("");
      setBulkEditSelectedStatus(null);
      setIsBulkEditStatusDropdownOpen(false);
      // Do not clear selectedLeads so user can perform more actions
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
useEffect(() => {
  if (isModalOpen && formData.branch_code && branchHierarchy.length > 0) {
    const branch = branchHierarchy.find(
      (b) => b.branch_name === formData.branch_code
    );
    setSelectedBranch(branch || null);

    const route = branch?.routes?.find(
      (r) => r.route_name === formData.route
    );
    setSelectedRoute(route || null);

    const area = route?.areas?.find(
      (a) => a.area_name === formData.area
    );
    setSelectedArea(area || null);
  }
}, [isModalOpen, formData, branchHierarchy]);
  // Add refs for bulk edit dropdowns
  const bulkEditAssigneeDropdownRef = useRef(null);
  const bulkEditStatusDropdownRef = useRef(null);

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

  // New state for Updated date range filter
  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading Shop Owners...
      </div>
    );
  }

  // Add these handlers near other bulk handlers
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
              reason: "Shop Owner not found locally.",
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
            leadToUpdate.follow_up_date_input
          );
          safeAppend(
            formDataToSend,
            "follow_up_time",
            leadToUpdate.follow_up_time_input
          );
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
          html: `Failed to delete message for all Shop Owners. ${failedUpdates.length} lead(s) encountered errors.`,
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

  const handleBulkDeleteFollowUpDate = async () => {
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
          safeAppend(formDataToSend, "message", leadToUpdate.message);
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
          html: `Failed to delete follow up date for all Shop Owners. ${failedUpdates.length} lead(s) encountered errors.`,
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

  // Clipboard helper for duplicate table
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "Duplicate records copied to clipboard.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Copy Failed",
        text: "Failed to copy to clipboard.",
      });
    }
  };

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
          All Shop Owners 
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
          hover:bg-gray-50 transition-colors cursor-pointer
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
          {permissionsForLeadsModule.includes("create") && (
            <button
              className="hover:bg-Duskwood-500 bg-[#003A72] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center cursor-pointer"
              onClick={openCreateModal}
            >
              Create Shop Owners      
            </button>
          )}

          {/* {hasBulkAssignPermission &&
            selectedLeads.length > 0 &&
            permissionsForLeadsModule.includes("edit") && (
              <button
                className="hover:bg-Duskwood-500 bg-[#003A72] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center cursor-pointer"
                onClick={() => setIsBulkAssignModalOpen(true)}
              >
                Bulk Edit
              </button>
            )} */}
          {hasBulkAssignPermission &&
            selectedLeads.length > 0 &&
            permissionsForLeadsModule.includes("delete") && (
              <button
                className="hover:bg-red-500 bg-[#DD6B55] text-white h-[44px] px-5 rounded-[8px] flex items-center justify-center cursor-pointer"
                onClick={handleBulkDelete}
              >
                Bulk Delete
              </button>
            )}

          {hasCsvPermission && (
            <div className="relative" ref={csvDropdownRef}>
              <button
                onClick={() => setIsCsvDropdownOpen(!isCsvDropdownOpen)}
                className={`
                  ${isMobile ? "w-10 h-10 rounded-[6px]" : "p-2 rounded-full"}
                  flex items-center justify-center cursor-pointer
                  hover:bg-gray-100 transition-colors
                `}
              >
                <FaFileImport className="w-6 h-6 text-[#727A90]" />
              </button>
              {isCsvDropdownOpen && (
                <div
                  className={`absolute left-0 mt-2 ${
                    isMobile ? "w-24" : "w-40"
                  } rounded-md shadow-lg bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden`}
                >
                  <button
                    onClick={handleImportCsv}
                    className="group flex items-center px-2 lg:px-3 py-2 text-xs text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors first:rounded-t-md cursor-pointer"
                  >
                    <FiUpload className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors" />
                    <span className="group-hover:text-white transition-colors whitespace-nowrap">
                      Import Shop Owners
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
                    onClick={() => {
                      setIsExportModalOpen(true);
                      setIsCsvDropdownOpen(false);
                    }}
                    className="group flex items-center px-2 lg:px-3 py-2 text-xs text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors last:rounded-b-md cursor-pointer"
                  >
                    <FiDownload className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors" />
                    <span className="group-hover:text-white transition-colors whitespace-nowrap">
                      Export Shop Owners
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

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
                        ? "bg-[#E7EFF8] font-bold text-[#003A72]"
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
        className={`grid grid-cols-2 gap-3 mb-2  ${
          rolePermissions === "ALL"
            ? "md:grid-cols-2 lg:grid-cols-6"
            : "md:grid-cols-2 lg:grid-cols-5"
        } `}
      >
        {" "}
        {/* changed from 6 to 7 */}
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
                ? "Shop Owners"
                : filters.customerName}
            </span>
            {/* Cross to clear filter */}
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
        {/* Status Dropdown (replaces Source) */}
        <div className="relative" ref={statusDropdownFilterRef}>
          <button
            type="button"
            className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center cursor-pointer"
            onClick={() =>
              setActiveDropdown(
                activeDropdown === "statusId" ? null : "statusId"
              )
            }
          >
            <span className="truncate text-left flex-1">
              {filters.statusId === "all"
                ? "Status"
                : statuses.find(
                    (s) => String(s.status_id) === String(filters.statusId)
                  )?.status_name || "Status"}
            </span>
            {/* Cross to clear filter */}
            {filters.statusId !== "all" && (
              <button
                type="button"
                className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 text-lg font-bold focus:outline-none"
                style={{ padding: 0, lineHeight: 1 }}
                tabIndex={-1}
                title="Clear filter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange("statusId", "all");
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
          {activeDropdown === "statusId" && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
              {statuses.map((status) => (
                <button
                  key={status.status_id}
                  type="button"
                  onClick={() => {
                    handleFilterChange("statusId", status.status_id);
                    setActiveDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] ${
                    String(filters.statusId) === String(status.status_id)
                      ? "bg-[#E7EFF8] text-[#003A72] font-bold"
                      : ""
                  }`}
                >
                  {status.status_name}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Assigned User Dropdown */}
        <div className="relative" ref={assignedToDropdownRef}>
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
            {/* Cross to clear filter */}
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
        <div className="relative" ref={followUpDateRangeDropdownRef}>
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
            <div className="flex items-center whitespace-nowrap">
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
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("all")}
                >
                  <span>All Dates</span>
                  {timeRange === "all" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "7days"
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("7days")}
                >
                  <span>Last 7 Days</span>
                  {timeRange === "7days" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "30days"
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("30days")}
                >
                  <span>Last 30 Days</span>
                  {timeRange === "30days" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    timeRange === "90days"
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleTimeRangeChange("90days")}
                >
                  <span>Last 90 Days</span>
                  {timeRange === "90days" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
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
        bg-[#003A72] text-white
        h-[44px] px-5
        rounded-[8px]
        flex items-center justify-center cursor-pointer
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
                        ? "bg-[#E7EFF8] text-[#003A72]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("all")}
                  >
                    <span>All Dates</span>
                    {createdTimeRange === "all" && (
                      <FaCheck className="h-4 w-4 text-[#003A72]" />
                    )}
                  </button>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                      createdTimeRange === "7days"
                        ? "bg-[#E7EFF8] text-[#003A72]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("7days")}
                  >
                    <span>Last 7 Days</span>
                    {createdTimeRange === "7days" && (
                      <FaCheck className="h-4 w-4 text-[#003A72]" />
                    )}
                  </button>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                      createdTimeRange === "30days"
                        ? "bg-[#E7EFF8] text-[#003A72]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("30days")}
                  >
                    <span>Last 30 Days</span>
                    {createdTimeRange === "30days" && (
                      <FaCheck className="h-4 w-4 text-[#003A72]" />
                    )}
                  </button>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                      createdTimeRange === "90days"
                        ? "bg-[#E7EFF8] text-[#003A72]"
                        : "hover:bg-gray-100"
                    } cursor-pointer`}
                    onClick={() => handleCreatedTimeRangeChange("90days")}
                  >
                    <span>Last 90 Days</span>
                    {createdTimeRange === "90days" && (
                      <FaCheck className="h-4 w-4 text-[#003A72]" />
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
        bg-[#003A72] text-white
        h-[44px] px-5
        rounded-[8px]
        flex items-center justify-center cursor-pointer
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
        {/* New Updated Date Range Filter */}
        <div
          className={`relative ${
            rolePermissions !== "ALL" ? "col-span-2 md:col-span-1" : ""
          }`}
          ref={updatedDateRangeDropdownRef}
        >
          <button
            className="relative
          appearance-none
          h-[36px] md:h-[44px] lg:h-[44px]
          pl-2 pr-10 md:pr-15 lg:pr-15
          w-full md:min-w-[120px] lg:min-w-[120px]
          bg-white border border-[#E9EAEA]
          rounded-[8px]
          text-[#242729] text-[8px] md:text-base lg:text-sm
          focus:outline-none cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              setUpdatedDateRangeDropdownOpen((open) => !open);
            }}
          >
            <div className="flex items-center whitespace-nowrap ">
              {updatedTimeRange === "all" && "Updated"}
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
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleUpdatedTimeRangeChange("all")}
                >
                  <span>All Dates</span>
                  {updatedTimeRange === "all" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "7days"
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleUpdatedTimeRangeChange("7days")}
                >
                  <span>Last 7 Days</span>
                  {updatedTimeRange === "7days" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "30days"
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleUpdatedTimeRangeChange("30days")}
                >
                  <span>Last 30 Days</span>
                  {updatedTimeRange === "30days" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
                  )}
                </button>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md ${
                    updatedTimeRange === "90days"
                      ? "bg-[#E7EFF8] text-[#003A72]"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                  onClick={() => handleUpdatedTimeRangeChange("90days")}
                >
                  <span>Last 90 Days</span>
                  {updatedTimeRange === "90days" && (
                    <FaCheck className="h-4 w-4 text-[#003A72]" />
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
                    className="hover:bg-Duskwood-500
        bg-[#003A72] text-white
        h-[44px] px-5
        rounded-[8px]
        flex items-center justify-center cursor-pointer
        w-full
      "
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
          Showing {filteredLeads.length} results for "{searchTerm}"
        </div>
      )}

      {/* Lead List Table */}
      <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar ">
        <table className="w-full min-w-[1800px] border-collapse">
          <thead>
            <tr className="text-left text-[#4B5563]">
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
                   <th className="py-4 px-6 font-medium text-sm">Village Name</th>
               <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                 Village Assigned
              </th>
              {/* <th className="py-4 px-6 font-medium text-sm">City</th> */}
              <th className="py-4 px-6 font-medium text-sm">WhatsApp</th>
              <th className="py-4 px-6 font-medium text-sm">Shop Name</th>
              {/* <th className="py-4 px-6 font-medium text-sm">Categories</th> */}
              {/* <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                Assigned Member
              </th> */}
              {rolePermissions === "ALL" && (
                <th className="py-4 px-6 font-medium text-sm">Created</th>
              )}
              <th className="py-4 px-6 font-medium text-sm">Updated</th>
              {/* <th className="py-4 px-6 font-medium text-sm whitespace-nowrap">
                Follow Up
              </th> */}
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
                  colSpan="15"
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
                        onClick={() => handleEdit(lead)}
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
                      {getVillageName(lead.village)}
                    </td>
                     <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.village_assigned_member}
                    </td>
                    {/* <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {(() => {
                        let parsedAddress = null;
                        if (lead.city && typeof lead.city === "string") {
                          try {
                            // Only try to parse if it looks like JSON
                            if (lead.city.trim().startsWith('{') || lead.city.trim().startsWith('[')) {
                              parsedAddress = JSON.parse(lead.city);
                            } else {
                              // If it's just a plain string, treat it as city name
                              parsedAddress = { city: lead.city };
                            }
                          } catch (e) {
                            // If parsing fails, treat it as a plain city name
                            parsedAddress = { city: lead.city };
                          }
                        } else if (lead.city && typeof lead.city === "object") {
                          parsedAddress = lead.city;
                        }
                        // Only show city if present and not empty
                        if (
                          parsedAddress &&
                          parsedAddress.city &&
                          parsedAddress.city.trim() !== ""
                        ) {
                          return parsedAddress.city;
                        }
                        // If not a JSON, but a plain string (legacy), show only if not empty and not a JSON string
                        if (
                          lead.city &&
                          typeof lead.city === "string" &&
                          lead.city.trim() !== "" &&
                          !lead.city.trim().startsWith("{")
                        ) {
                          return lead.city;
                        }
                      })()}
                    </td> */}
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.whatsapp_number}
                    </td>
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.requirements}
                    </td> 
                    {/* <td className="py-4 px-6 max-w-xs overflow-hidden truncate">
                      <div className="relative inline-block">
                        <span
                          className={`
                            px-3 py-1 rounded-lg text-sm
                            flex items-center gap-2
                            ${
                              lead.status_name === "Fresh List"
                                ? "bg-[#27AE60] text-white"
                                : lead.status_name === "Follow Up"
                                ? "bg-[#003A72] text-white"
                                : lead.status_name === "Get Call Back Us"
                                ? "bg-[#FFFBEB] text-[#D97706]"
                                : lead.status_name === "Contact In Future"
                                ? "bg-[#FFF8DD] text-[#F1C40F]"
                                : lead.status_name === "Next Day Payments"
                                ? "bg-[#27AE60] text-white"
                                : lead.status_name === "Quote Send"
                                ? "bg-[#003A72] text-white"
                                : lead.status_name === "Call Back"
                                ? "bg-[#FFFBEB] text-[#D97706]"
                                : lead.status_name === "Construction"
                                ? "bg-[#FFF8DD] text-[#F1C40F]"
                                : lead.status_name === "NPC"
                                ? "bg-[#27AE60] text-white"
                                : lead.status_name === "Switch off"
                                ? "bg-[#003A72] text-white"
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
                    </td> */}
                
                    {/* <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.assigned_to}
                    </td> */}
                    {rolePermissions === "ALL" && (
                      <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                        {formatDateTimeForTable(lead.created)}
                      </td>
                    )}
                    <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {formatDateTimeForTable(lead.updated)}
                    </td>
                    {/* <td className="py-4 px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {formatDateTimeForTable(lead.follow_up_date)}
                    </td> */}
                    {(permissionsForLeadsModule.includes("edit") ||
                      permissionsForLeadsModule.includes("delete")) && (
                      <td className="py-4 px-6 relative">
                        <button
                          onClick={() => toggleDropdown(lead.customer_id)}
                          className="p-2 text-[#4B5563] hover:bg-Duskwood-200  rounded-full transition-colors cursor-pointer"
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === lead.customer_id && (
                          <div className="relative">
                            <div
                              data-dropdown-id={lead.customer_id}
                              className="absolute left-3 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden"
                            >
                              <div className="">

                                {/* Create New Order */}
{/* <button
  onClick={() => handleCreateOrder(lead.customer_id)}
  className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors cursor-pointer"
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
      d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 11h3v-2h-3V8h-2v3H8v2h3v3h2z"
    />
  </svg>
  <h3 className="group-hover:text-white transition-colors ">
    NewOrder
  </h3>
</button> */}
{/* Create Return */}
{/* <button
  onClick={() => handleCreateReturn(lead.customer_id)}
  className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors cursor-pointer"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="24"
    viewBox="0 0 24 24"
    className="mr-2 w-3 h-3 fill-current text-[#4B5563] group-hover:text-white transition-colors"
  >
    <path
      fill="currentColor"
      d="M12 5V1L7 6l5 5V7c3.86 0 7 3.14 7 7a7 7 0 0 1-7 7c-2.73 0-5.1-1.53-6.32-3.78l-1.74.98A8.977 8.977 0 0 0 12 22a9 9 0 0 0 0-18z"
    />
  </svg>
  <span className="group-hover:text-white transition-colors"> Return</span>
</button> */}
{/* Create Exchange */}
{/* <button
  onClick={() => handleCreateExchange(lead.customer_id)}
  className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors last:rounded-b-md cursor-pointer"
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
      d="M4 7h13l-2.29 2.29L16 11l5-5l-5-5l-1.29 1.71L17 5H4v2zm16 10H7l2.29-2.29L8 13l-5 5l5 5l1.29-1.71L7 19h13v-2z"
    />
  </svg>
  <span className="group-hover:text-white transition-colors">
     Exchange
  </span>
</button> */}
                                {permissionsForLeadsModule.includes("edit") && (
                                  <button
                                    onClick={() => handleEdit(lead)}
                                    className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors first:rounded-t-md cursor-pointer"
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

                                {permissionsForLeadsModule.includes(
                                  "delete"
                                ) && (
                                  <button
                                    onClick={() =>
                                      handleDelete(lead.customer_id)
                                    }
                                    className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors last:rounded-b-md cursor-pointer"
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

      {/* Lead List Cards for    */}
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
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg cursor-pointer"
              >
                {/* Header Section */}
                <div className="p-4 sm:p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
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
                        onClick={() => handleEdit(lead)}
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
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-block px-2 py-0.5 rounded bg-Duskwood-50 text-Duskwood-700 text-[11px] font-medium">
                                  Created
                                </span>
                                <span className=" text-[10px] text-gray-500 font-mono ">
                                  {formatDateTimeForTable(lead.created)}
                                </span>
                              </div>
                              {lead.updated &&
                                lead.updated !== lead.created && (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-medium">
                                      Updated
                                    </span>
                                    <span className=" text-[10px] text-gray-500 font-mono">
                                      {formatDateTimeForTable(lead.updated)}
                                    </span>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    {(permissionsForLeadsModule.includes("edit") ||
                      permissionsForLeadsModule.includes("delete")) && (
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(lead.customer_id)}
                          className="p-1 text-[#4B5563] rounded-full hover:bg-gray-100 cursor-pointer"
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === lead.customer_id && (
                          <div className="absolute right-0 mt-1 w-24 sm:w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden">
                            <div>
                              {/* EDIT button */}
                              {permissionsForLeadsModule.includes("edit") && (
                                <button
                                  onClick={() => handleEdit(lead)}
                                  className="group flex items-center px-3 py-2 text-xs text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors first:rounded-t-md cursor-pointer"
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

                              {/* DELETE button */}
                              {permissionsForLeadsModule.includes("delete") && (
                                <button
                                  onClick={() => handleDelete(lead.customer_id)}
                                  className="group flex items-center px-3 py-2 text-xs text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors last:rounded-b-md cursor-pointer"
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
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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

                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                  {/* <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                          {(() => {
                            let parsedAddress = null;
                            if (
                              lead.city &&
                              typeof lead.city === "string" &&
                              lead.city.trim().startsWith("{")
                            ) {
                              try {
                                parsedAddress = JSON.parse(lead.city);
                              } catch (e) {
                                // ignore
                              }
                            } else if (
                              lead.city &&
                              typeof lead.city === "object"
                            ) {
                              parsedAddress = lead.city;
                            }
                            // Only show city if present and not empty
                            if (
                              parsedAddress &&
                              parsedAddress.city &&
                              parsedAddress.city.trim() !== ""
                            ) {
                              return parsedAddress.city;
                            }
                            // If not a JSON, but a plain string (legacy), show only if not empty and not a JSON string
                            if (
                              lead.city &&
                              typeof lead.city === "string" &&
                              lead.city.trim() !== "" &&
                              !lead.city.trim().startsWith("{")
                            ) {
                              return lead.city;
                            }
                            return "";
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                  </div> */}

                  {/* Assigned To & Follow Up Row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                    </div> */}

                    {/* <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                    </div> */}
                  </div>
                  {/* Requirements */}
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                        Shop name
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {lead.requirements}
                      </p>
                    </div>
                  </div>

                  {/* Village Name */}
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Village Name
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {getVillageName(lead.village)}
                      </p>
                    </div>
                  </div>

                  {/* Village Assigned */}
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Village Assigned
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {lead.village_assigned_member}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="px-3 sm:px-4 py-3  border-t border-gray-100 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    {/* <span className="text-xs font-medium text-gray-600">
                      Status
                    </span> */}
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
{/* ✅ EDIT MODAL (Now 100% identical to Create Modal) */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
      onClick={() => setIsModalOpen(false)}
    />

    {/* Glassmorphism Container */}
    <div
      className="w-11/12 max-w-[1000px] max-h-[90vh] overflow-y-auto p-6 md:p-8
                 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
                 shadow-lg relative z-10 custom-scrollbar"
    >
      {/* Close Button */}
      <button
        onClick={() => setIsModalOpen(false)}
        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center 
                   rounded-full hover:bg-white/20 transition-colors cursor-pointer"
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

      {/* Title */}
      <h2 className="text-[24px] sm:text-[29px] font-medium text-[#1F2837] mb-8">
        Edit Shop Owner
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Picture */}
          <div className="md:col-span-1 flex flex-col items-center">
            <label className="block text-[#4B5563] text-[16px] mb-4 w-full">
              Profile Picture
            </label>
            <div className="relative w-32 h-32">
              <img
                src={imagePreview || formData.profile_pic || "/dummyavatar.jpeg"}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md"
              />
              <label
                htmlFor="edit-file-upload"
                className="absolute bottom-1 right-1 bg-[#003A72] text-white 
                           rounded-full p-2 cursor-pointer hover:bg-[#0e4053] transition-colors"
              >
                <FiEdit className="w-4 h-4" />
                <input
                  id="edit-file-upload"
                  name="profile_pic"
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>

          {/* Right Section */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Owner Name */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Shop Owner Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Contact
              </label>
              <input
                type="text"
                name="phoneno"
                value={formData.phoneno}
                onChange={handleInputChange}
                required
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              />
            </div>

            {/* Shop Name */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Shop Name
              </label>
              <input
                type="text"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              >
                <option value="">Select...</option>
                <option value="On call">On call</option>
                <option value="Visit">Visit</option>
                <option value="Reference">Reference</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Join Date */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Join Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="follow_up_date_input"
                  value={formData.follow_up_date_input}
                  onChange={handleInputChange}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                             border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                             outline-none text-[#545454]"
                />
                <input
                  type="time"
                  name="follow_up_time_input"
                  value={formData.follow_up_time_input}
                  onChange={handleInputChange}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                             border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                             outline-none text-[#545454]"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Categories
              </label>
              {renderStatusDropdown(true)}
            </div>

            {/* Assign To (Admin Only) */}
            {/* {user?.role === "admin" && (
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[#4B5563] text-[16px] mb-2">
                  Assign To
                </label>
                <select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleInputChange}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                             border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                             outline-none text-[#545454]"
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )} */}

            {/* Address Section */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[#4B5563] text-sm font-medium">
                Address
              </label>
              <div className="w-full rounded-[12px] border border-white/20 flex flex-col">
                <input
                  type="text"
                  name="blockUnitStreetName"
                  value={formData.blockUnitStreetName}
                  onChange={handleInputChange}
                  className="w-full h-[44px] px-3 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] rounded-t-[12px]"
                  placeholder="Block/Unit/Street Name"
                />
                <div className="grid grid-cols-2 w-full">
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454]"
                    placeholder="Country"
                  />
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454]"
                    placeholder="State"
                  />
                </div>
                <div className="grid grid-cols-2 w-full">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454]"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454]"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>

            {/* Branch - Route - Area - Village */}
            {/* Branch */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">Branch</label>
              <select
                name="branch_code"
                value={formData.branch_code}
                onChange={(e) => {
                  const branch = branchHierarchy.find(
                    (b) => b.branch_name === e.target.value
                  );
                  setSelectedBranch(branch || null);
                  setSelectedRoute(null);
                  setSelectedArea(null);
                  handleInputChange(e);
                }}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 
                           focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
              >
                <option value="">Select Branch</option>
                {branchHierarchy.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_name}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Route */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">Route</label>
              <select
                name="route"
                value={formData.route}
                onChange={(e) => {
                  const route = selectedBranch?.routes.find(
                    (r) => r.route_name === e.target.value
                  );
                  setSelectedRoute(route || null);
                  setSelectedArea(null);
                  handleInputChange(e);
                }}
                disabled={!selectedBranch}
                className={`w-full h-[48px] px-3 rounded-[12px] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] ${
                  !selectedBranch
                    ? "bg-gray-300 cursor-not-allowed opacity-60"
                    : "bg-[#E7EFF8]"
                }`}
              >
                <option value="">Select Route</option>
                {selectedBranch?.routes.map((route) => (
                  <option key={route.route_id} value={route.route_name}>
                    {route.route_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">Area</label>
              <select
                name="area"
                value={formData.area}
                onChange={(e) => {
                  const area = selectedRoute?.areas.find(
                    (a) => a.area_name === e.target.value
                  );
                  setSelectedArea(area || null);
                  handleInputChange(e);
                }}
                disabled={!selectedRoute}
                className={`w-full h-[48px] px-3 rounded-[12px] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] ${
                  !selectedRoute
                    ? "bg-gray-300 cursor-not-allowed opacity-60"
                    : "bg-[#E7EFF8]"
                }`}
              >
                <option value="">Select Area</option>
                {selectedRoute?.areas.map((area) => (
                  <option key={area.area_id} value={area.area_name}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Village */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">Village</label>
              <select
                name="village"
                value={formData.village}
                onChange={handleInputChange}
                disabled={!selectedArea}
                className={`w-full h-[48px] px-3 rounded-[12px] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] ${
                  !selectedArea
                    ? "bg-gray-300 cursor-not-allowed opacity-60"
                    : "bg-[#E7EFF8]"
                }`}
              >
                <option value="">Select Village</option>
                {selectedArea?.villages.map((village) => (
                  <option key={village.village_id} value={village.village_name}>
                    {village.village_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Map Location */}
            <div className="space-y-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Map Location
              </label>
              <input
                type="text"
                name="near_location"
                value={formData.near_location}
                onChange={handleInputChange}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454]"
              />
              {/* Hidden fields for latitude and longitude */}
              <input type="hidden" name="latitude" value={formData.latitude || ""} onChange={handleInputChange} />
              <input type="hidden" name="longitude" value={formData.longitude || ""} onChange={handleInputChange} />
            </div> 
            <div className="space-y-2 md:col-start-1 md:row-start-10">
  <label className="block text-[#4B5563] text-[16px] mb-2">
    Customer Relationship
  </label>
  <select
    name="customer_relationship"
    value={formData.customer_relationship}
    onChange={handleInputChange}
    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 
    focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
  >
    <option value="">Select...</option>
    <option value="New Customer">New Customer</option>
    <option value="Poor">Poor</option>
    <option value="Good">Good</option>
    <option value="Very Good">Very Good</option>
    <option value="Excellent">Excellent</option>
  </select>
</div>
            {/* Shop Image */}
            <div className="md:col-span-1 flex flex-col w-full">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Shop Image
              </label>
              {shopImagePreview && (
                <div className="mb-3">
                  <img
                    src={shopImagePreview}
                    alt="Shop Preview"
                    className="w-32 h-32 object-cover rounded-md border-2 border-gray-300"
                  />
                </div>
              )}
              <label
                htmlFor="shop-image-upload"
                className="flex items-center justify-between w-full px-4 py-2 bg-[#f1f5f9]
                           text-gray-600 rounded-md cursor-pointer border border-gray-300
                           hover:bg-gray-100 transition"
              >
                <span>Choose an image (PNG, JPG, GIF up to 10MB)</span>
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#003A72]"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </label>
              <input
                id="shop-image-upload"
                name="shop_image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Message */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="2"
                className="w-full min-h-[58px] p-3 rounded-[12px] bg-[#E7EFF8]
                           border border-white/20 focus:ring-2 focus:ring-[#0e4053]
                           outline-none text-[#545454] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="w-full md:w-[207px] h-[46px] text-[#003A72] border border-[#0e4053]
                       rounded-[10px] hover:bg-[#004B8D] hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full md:w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px]
                       hover:bg-[#004B8D] transition-colors cursor-pointer ml-4"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Create Modal */}
      {isModalOpenCreate && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => setIsModalOpenCreate(false)}
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
              onClick={() => setIsModalOpenCreate(false)}
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
            <h2 className="text-[24px] sm:text-[29px] font-medium text-[#1F2837] mb-8">
              Create Shop Owners
            </h2>

            {/* Form */}
            <form onSubmit={handleCreateSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Picture Upload */}
                <div className="md:col-span-1 flex flex-col items-center">
                  <label className="block text-[#4B5563] text-[16px] mb-4 w-full">
                    Profile Picture
                  </label>
                  <div className="relative w-32 h-32">
                    <img
                      alt="Profile Preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md"
                      src={createImagePreview || "/dummyavatar.jpeg"}
                    />
                    <label
                      htmlFor="file-upload"
                      className="absolute bottom-1 right-1 bg-[#003A72] text-white rounded-full p-2 cursor-pointer hover:bg-Duskwood-600 transition-colors"
                    >
                      <svg
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      <input
                        id="file-upload"
                        className="hidden"
                        accept="image/*"
                        type="file"
                        onChange={handleProfilePictureChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>

                {/* Customer Name */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name */}
                  <div className="space-y-2 md:col-start-1 md:row-start-1">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Shop Owners Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={createFormData.name}
                        onChange={handleCreateInputChange}
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
                      value={createFormData.email}
                      onChange={handleCreateInputChange}
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
                      value={createFormData.phoneno}
                      onChange={handleCreateInputChange}
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
                      value={createFormData.whatsapp}
                      onChange={handleCreateInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2 md:col-start-2 md:row-start-3">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Shop name
                    </label>
                    <input
                      type="text"
                      name="requirements"
                      value={createFormData.requirements}
                      onChange={handleCreateInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>

                  {/* Source */}
 <div className="space-y-2 md:col-start-1 md:row-start-3"> 
                 <label className="block text-[#4B5563] text-[16px] mb-2"> Source </label>
           <select
  name="source"
  value={createFormData.source}
  onChange={handleCreateInputChange}
  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
>
  <option value="">Select...</option>
  <option value="On call">On call</option>
  <option value="Visit">Visit</option>
  <option value="Reference">Reference</option>
  <option value="Other">Other</option>
</select>
 </div>

                  {/* Follow Up */}
                  <div className="space-y-2 md:col-start-1 md:row-start-4">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Join Date
                    </label>
                    <div className="flex gap-2">
                      {" "}
                      {/* Added flex container */}
                      <input
                        type="date"
                        name="follow_up_date_input"
                        value={createFormData.follow_up_date_input}
                        onChange={handleCreateInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] placeholder:text-sm"
                      />
                      <input
                        type="time"
                        name="follow_up_time_input"
                        value={createFormData.follow_up_time_input}
                        onChange={handleCreateInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] placeholder:text-sm"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2 md:col-start-2 md:row-start-4">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Catogories
                    </label>
                    {renderStatusDropdown()}
                  </div>
                  

                  {/* Assign To */}
                  {/* {user?.role === "admin" && (
                    <div className="space-y-2 md:col-span-2 md:row-start-5">
                      <label className="block text-[#4B5563] text-[16px] mb-2">
                        Assign To
                      </label>
                      <div className="relative" ref={assignToDropdownRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setIsAssignToDropdownOpen(!isAssignToDropdownOpen)
                          }
                          className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] text-left flex items-center justify-between cursor-pointer"
                        >
                          <span>
                            {users.find(
                              (user) => user.name === createFormData.assigned_to
                            )?.name || "Select User"}
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
                          <div className="absolute custom-scrollbar top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto">
                            {users.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  handleCreateInputChange({
                                    target: {
                                      name: "assigned_to",
                                      value: user.name,
                                    },
                                  });
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
                    </div>
                  )} */}

                  {/* Message */}
                  <div className="space-y-2 md:col-start-1 md:col-span-2 md:row-start-6">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={createFormData.message}
                      onChange={handleCreateInputChange}
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
                        value={createFormData.blockUnitStreetName}
                        onChange={handleCreateInputChange}
                        className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b  bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-t-[12px]"
                        placeholder="Block/Unit/Street Name"
                      />
    {/* Pincode and Country */}
                      <div className="grid grid-cols-2  w-full">
                      
                        {/* Country Dropdown */}
                        <div className="relative" ref={countryDropdownRef}>
                          <input
                            type="text"
                            name="countrySearch"
                            value={createFormData.country || countrySearchTerm}
                            onChange={handleCountrySearchChange}
                            onFocus={() => setCountryDropdownOpen(true)}
                            onBlur={() => setCountryDropdownOpen(false)}
                            className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20  outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                            placeholder="Select Country"
                            autoComplete="off"
                          />
                          {countryDropdownOpen && (
                            <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
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

                         {/* State Dropdown */}
                        <div className="relative" ref={stateDropdownRef}>
                          <input
                            type="text"
                            name="stateSearch"
                            value={createFormData.state || stateSearchTerm}
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
                            <div className="absolute custom-scrollbar z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
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
                          
                      </div>

                      {/* State and City Dropdowns */}
                      <div className="grid grid-cols-2  w-full">
                        {/* City Dropdown */}
                        <div className="relative" ref={cityDropdownRef}>
                          <input
                            type="text"
                            name="citySearch"
                            value={createFormData.city || citySearchTerm}
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

                        {/* Pincode Input */}
                        <input
                          type="text"
                          name="pincode"
                          value={createFormData.pincode}
                          onChange={handleCreateInputChange}
                          className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 rounded-bl-[12px] outline-none"
                          placeholder="Pincode"
                        />
                      </div>

                  
                    </div>
                  </div>


 {/* Branch Code */}
<div className="space-y-2 md:col-start-1 md:row-start-8">
  <label className="block text-[#4B5563] text-[16px] mb-2">Branch</label>
  <select
    name="branch_code"
    value={createFormData.branch_code}
    onChange={(e) => {
      const branch = branchHierarchy.find(b => b.branch_name === e.target.value);
      setSelectedBranch(branch || null);
      setSelectedRoute(null);
      setSelectedArea(null);
      handleCreateInputChange(e);
    }}
    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 
               focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
  >
    <option value="">Select Branch</option>
    {branchHierarchy.map(branch => (
      <option key={branch.branch_id} value={branch.branch_name}>
        {branch.branch_name}
      </option>
    ))}
  </select>
</div>

{/* Route */}
<div className="space-y-2 md:col-start-2 md:row-start-8">
  <label className="block text-[#4B5563] text-[16px] mb-2">Route</label>
  <select
    name="route"
    value={createFormData.route}
    onChange={(e) => {
      const route = selectedBranch?.routes.find(r => r.route_name === e.target.value);
      setSelectedRoute(route || null);
      setSelectedArea(null);
      handleCreateInputChange(e);
    }}
    disabled={!selectedBranch} // 🔒 Disable until branch selected
    className={`w-full h-[48px] px-3 rounded-[12px] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] ${
      !selectedBranch ? "bg-gray-300 cursor-not-allowed opacity-60" : "bg-[#E7EFF8]"
    }`}
  >
    <option value="">Select Route</option>
    {selectedBranch?.routes.map(route => (
      <option key={route.route_id} value={route.route_name}>
        {route.route_name}
      </option>
    ))}
  </select>
</div>

{/* Area */}
<div className="space-y-2 md:col-start-1 md:row-start-9">
  <label className="block text-[#4B5563] text-[16px] mb-2">Area</label>
  <select
    name="area"
    value={createFormData.area}
    onChange={(e) => {
      const area = selectedRoute?.areas.find(a => a.area_name === e.target.value);
      setSelectedArea(area || null);
      handleCreateInputChange(e);
    }}
    disabled={!selectedRoute} // 🔒 Disable until route selected
    className={`w-full h-[48px] px-3 rounded-[12px] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] ${
      !selectedRoute ? "bg-gray-300 cursor-not-allowed opacity-60" : "bg-[#E7EFF8]"
    }`}
  >
    <option value="">Select Area</option>
    {selectedRoute?.areas.map(area => (
      <option key={area.area_id} value={area.area_name}>
        {area.area_name}
      </option>
    ))}
  </select>
</div>

{/* Village */}
<div className="space-y-2 md:col-start-2 md:row-start-9">
  <label className="block text-[#4B5563] text-[16px] mb-2">Village</label>
  <select
    name="village"
    value={createFormData.village}
    onChange={handleCreateInputChange}
    disabled={!selectedArea} // 🔒 Disable until area selected
    className={`w-full h-[48px] px-3 rounded-[12px] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] ${
      !selectedArea ? "bg-gray-300 cursor-not-allowed opacity-60" : "bg-[#E7EFF8]"
    }`}
  >
    <option value="">Select Village</option>
    {selectedArea?.villages.map(village => (
      <option key={village.village_id} value={village.village_name}>
        {village.village_name}
      </option>
    ))}
  </select>
</div>



{/* Map Location */}
<div className="space-y-2 md:col-start-1 md:row-start-10">
  <label className="block text-[#4B5563] text-[16px] mb-2">
    Map Location
  </label>
  <input
    type="text"
    name="near_location"
   value={createFormData.near_location}
    onChange={handleCreateInputChange}
    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 
               focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
  />
  {/* Hidden fields for latitude and longitude */}
  <input type="hidden" name="latitude" value={createFormData.latitude || ""} onChange={handleCreateInputChange} />
  <input type="hidden" name="longitude" value={createFormData.longitude || ""} onChange={handleCreateInputChange} />
</div>



{/* Source */} 
<div className="space-y-2 md:col-start-2 md:row-start-10">
  <label className="block text-[#4B5563] text-[16px] mb-2">
    Customer Relationship
  </label>
  <select
    name="customer_relationship"
    value={createFormData.customer_relationship}
    onChange={handleCreateInputChange}
    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 
    focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
  >
    <option value="">Select...</option>
    <option value="New Customer">New Customer</option>
    <option value="Poor">Poor</option>
    <option value="Good">Good</option>
    <option value="Very Good">Very Good</option>
    <option value="Excellent">Excellent</option>
  </select>
</div>


<div className="md:col-span-1 flex flex-col w-full">
   <label className="block text-[#4B5563] text-[16px] mb-2"> Shop image </label>
    <label htmlFor="shop-image-upload" className="flex items-center justify-between w-full px-4 py-2 bg-[#f1f5f9] text-gray-600 rounded-md cursor-pointer border border-gray-300 hover:bg-gray-100 transition" >
       <span id="shop-file-name" className="truncate"> Choose an image (PNG, JPG, GIF up to 10MB) </span> 
       <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#003A72]" xmlns="http://www.w3.org/2000/svg" > 
       <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path> 
       <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path> </svg> </label> 
       <input id="shop-image-upload" className="hidden" accept="image/*" type="file" onChange={handleShopImageChange} /> 
       {createShopImagePreview && (
         <div className="mt-2">
           <img src={createShopImagePreview} alt="Shop Preview" className="w-32 h-32 object-cover rounded-md border-2 border-gray-300" />
         </div>
       )}
       </div>
                </div>
              </div>
            
              {/* Save button */}
              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-full md:w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors lg:mr-20 cursor-pointer"
                >
                  Save
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
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-6">
              Import Shop Owners
            </h2>

            {/* File Type Radio Buttons */}
            <div className="flex items-center gap-6 mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="importFileType"
                  value="csv"
                  checked={importFileType === "csv"}
                  onChange={() => setImportFileType("csv")}
                  className="accent-[#0e4053]"
                />
                <span>CSV</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="importFileType"
                  value="xls"
                  checked={importFileType === "xls"}
                  onChange={() => setImportFileType("xls")}
                  className="accent-[#0e4053]"
                />
                <span>XLS</span>
              </label>
            </div>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-[#A0AEC0] rounded-lg p-6 text-center cursor-pointer hover:border-[#0e4053] transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e);
              }}
              onClick={() =>
                document.getElementById("import-file-upload").click()
              }
            >
              <input
                type="file"
                id="import-file-upload"
                accept={importFileType === "csv" ? ".csv" : ".xls"}
                className="hidden"
                onChange={handleFileChange}
              />
              <FiUpload className="mx-auto w-10 h-10 text-[#A0AEC0] mb-3" />
              <p className="text-[#4B5563] text-sm">
                {selectedFile
                  ? `Selected file: ${selectedFile.name}`
                  : `Drag & drop your ${importFileType.toUpperCase()} file here, or click to browse`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Only {importFileType === "csv" ? ".csv" : ".xls"} files are
                supported
              </p>
            </div>
            <h6 className="text-xs text-right text-[#1F2837] mt-3">
              <button
                type="button"
                onClick={
                  importFileType === "csv"
                    ? handleDownloadSample
                    : async () => {
                        let loadingAlert;
                        try {
                          loadingAlert = Swal.fire({
                            title: "Downloading Sample...",
                            allowOutsideClick: false,
                            didOpen: () => {
                              Swal.showLoading();
                            },
                          });

                          const response = await api.get(
                            "/leadssample-downloadxls",
                            {
                              responseType: "blob", // Important for file downloads
                            }
                          );

                          await loadingAlert.close();

                          if (response.data) {
                            const url = window.URL.createObjectURL(
                              new Blob([response.data])
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute("download", "sample_leads.xls");
                            document.body.appendChild(link);
                            link.click();
                            link.parentNode.removeChild(link);
                            await Swal.fire({
                              icon: "success",
                              title: "Download Successful!",
                              text: "Sample Shop Owners XLS downloaded.",
                              confirmButtonColor: "#0e4053",
                            });
                          } else {
                            throw new Error(
                              "Failed to download sample: No data received."
                            );
                          }
                        } catch (err) {
                          if (loadingAlert) {
                            await loadingAlert.close();
                          }
                          Swal.fire({
                            icon: "error",
                            title: "Download Failed",
                            text:
                              err.message ||
                              "An error occurred during download.",
                            confirmButtonColor: "#DD6B55",
                          });
                        }
                      }
                }
                className="text-[#003A72] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e4053] rounded-md px-2 py-1 -mr-2 transition-colors duration-200 cursor-pointer"
              >
                {importFileType === "csv"
                  ? "View Sample File CSV"
                  : "View Sample File XLS"}
              </button>
            </h6>

            {/* Submit button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={uploadCsvFile}
                disabled={!selectedFile}
                className={`w-full md:w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] transition-colors ${
                  !selectedFile
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#004B8D]"
                }`}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export CSV Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Frosted overlay */}
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => setIsExportModalOpen(false)}
          />

          {/* Glassmorphism modal container */}
          <div
            className="
        w-11/12 max-w-[400px] max-h-[90vh] overflow-y-auto p-6 md:p-8
        rounded-2xl
        bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
        shadow-lg
        relative z-10 custom-scrollbar
      "
          >
            {/* Close button */}
            <button
              onClick={() => setIsExportModalOpen(false)}
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
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-6">
              Export Shop Owners
            </h2>

            {/* File Type Radio Buttons */}
            <div className="flex items-center gap-6 mb-8">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exportFileType"
                  value="csv"
                  checked={exportFileType === "csv"}
                  onChange={() => setExportFileType("csv")}
                  className="accent-[#0e4053]"
                />
                <span>CSV</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exportFileType"
                  value="xls"
                  checked={exportFileType === "xls"}
                  onChange={() => setExportFileType("xls")}
                  className="accent-[#0e4053]"
                />
                <span>XLS</span>
              </label>
            </div>

            {/* Export Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={async () => {
                  setIsExportModalOpen(false);
                  await handleExportCsv();
                }}
                className="w-full md:w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
              >
                Export
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
              setBulkEditStatusSearch("");
              setBulkEditSelectedStatus(null);
              setBulkDeleteMessage(false);
              setBulkDeleteFollowUp(false);
              setBulkAssignUser(false);
              setBulkChangeStatus(false);
            }}
          />

          {/* Glassmorphism modal container */}
          <div
            className="
              w-11/12 max-w-[700px] max-h-[98vh]  p-6 md:p-8
              rounded-2xl
              bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF]
              shadow-lg
              relative z-10 custom-scrollbar overflow-y-auto

            "
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsBulkAssignModalOpen(false);
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
              Bulk Edit Shop Owners
            </h2>

            {/* Bulk Edit Options Section */}
            <div className="rounded-xl p-6 shadow-sm border border-[#E9EAEA] mb-5">
              <h3 className="text-lg font-semibold text-[#003A72] mb-4">
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
                        Assign to Member
                      </span>
                      <span className="text-sm text-gray-500">
                        Assign selected Shop Owners to a specific member.
                      </span>
                    </span>
                  </label>

                  {/* Configuration section that expands when checkbox is checked */}
                  {bulkAssignUser && (
                    <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                      <label className="block text-[#4B5563] text-[16px] mb-2">
                        Select Member:
                      </label>
                      <div
                        className="relative"
                        ref={bulkEditAssigneeDropdownRef}
                      >
                        <input
                          type="text"
                          placeholder="Search and select Member..."
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
                        Change Categories
                      </span>
                      <span className="text-sm text-gray-500">
                        Update the Categories for selected shop owners.
                      </span>
                    </span>
                  </label>

                  {/* Configuration section that expands when checkbox is checked */}
                  {bulkChangeStatus && (
                    <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                      <label className="block text-[#4B5563] text-[16px] mb-2">
                        Select Categories:
                      </label>
                      <div className="relative" ref={bulkEditStatusDropdownRef}>
                        <input
                          type="text"
                          placeholder="Search and select Categories..."
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
                                      ? "bg-[#E7EFF8] text-[#003A72] font-bold"
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
                      Permanently delete messages for selected shop owners.
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
              className={`mt-6 w-full h-[44px] bg-[#003A72] text-white rounded-[10px] transition-colors text-base font-medium shadow-sm ${
                selectedLeads.length === 0 ||
                (!bulkDeleteMessage &&
                  !bulkDeleteFollowUp &&
                  !bulkAssignUser &&
                  !bulkChangeStatus)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#004B8D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e4053]"
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

export default CreateLeads;

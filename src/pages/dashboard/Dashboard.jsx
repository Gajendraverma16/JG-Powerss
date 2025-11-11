import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Container1 from "./Container1";
import {
  BsCardChecklist,
  BsFillTelephoneOutboundFill,
  BsFillPersonCheckFill,
  BsFillClockFill,
  BsFillFileEarmarkTextFill,
  BsFillReplyFill,
  BsFillPersonLinesFill,
  BsFillBuildingFill,
} from "react-icons/bs";
// import AvgLeads from "./AvgLeads";
// import Quotation from "./Quotation";

import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const LEAD_STATUS_CARDS = [
  // {
  //   id: 2,
  //   label: "Follow Ups",
  //   icon: <BsCardChecklist />,
  // },
  // {
  //   id: 3,
  //   label: "Get Call Back Us",
  //   icon: <BsFillTelephoneOutboundFill />,
  // },
  // {
  //   id: 4,
  //   label: "Contact In Future",
  //   icon: <BsFillPersonCheckFill />,
  // },
  // {
  //   id: 5,
  //   label: "Next Day Payments",
  //   icon: <BsFillClockFill />,
  // },
  // {
  //   id: 6,
  //   label: "Quote Send",
  //   icon: <BsFillFileEarmarkTextFill />,
  // },
  // {
  //   id: 7,
  //   label: "Call Back",
  //   icon: <BsFillReplyFill />,
  // },
  // {
  //   id: 8,
  //   label: "Construction",
  //   icon: <BsFillBuildingFill />,
  // },
];



const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);

  // New: Ref for the items per page dropdown
  const itemsPerPageDropdownRef = useRef(null);

  // New: State for lead counts by status
  const [leadCounts, setLeadCounts] = useState({});

  // New: State for users and their today leads
  const [users, setUsers] = useState([]);
  const [userTodayLeads, setUserTodayLeads] = useState({}); // for created today
  const [userUpdatedLeads, setUserUpdatedLeads] = useState({}); // for updated today

  
  const { user, rolePermissions } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await api.get("/customeren/1");
        const data = response.data;
        if (data.success && Array.isArray(data.result)) {
          setLeads(data.result);
        }
      } catch (error) {
        // Optionally handle error
        console.error("Failed to fetch leads:", error);
      }
    };
    fetchLeads();
  }, []);

  // Fetch all lead counts for the status cards
  useEffect(() => {
    const fetchLeadCounts = async () => {
      try {
        const results = await Promise.all(
          LEAD_STATUS_CARDS.map((status) => api.get(`/leadscount/${status.id}`))
        );
        const counts = {};
        results.forEach((res, idx) => {
          counts[LEAD_STATUS_CARDS[idx].id] = res.data?.total_leads || 0;
        });
        setLeadCounts(counts);
      } catch (err) {
        console.error("Error fetching lead counts:", err);
      }
    };
    fetchLeadCounts();
  }, []);

  // Fetch all users and their todaycreated and todayupdated leads
  useEffect(() => {
    const fetchUsersAndTodayLeads = async () => {
      try {
        if (rolePermissions === "ALL") {
          // Existing logic for ALL
          const usersRes = await api.get("/allusers");
          if (usersRes.data.success && Array.isArray(usersRes.data.result)) {
            let filteredUsers = usersRes.data.result.filter(
              (user) => user.role !== "admin"
            );
            const roleOrder = { sales_manager: 1, manager: 2, user: 3 };
            filteredUsers.sort(
              (a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99)
            );
            setUsers(filteredUsers);

            const todayLeadsResults = await Promise.all(
              filteredUsers.map(async (user) => {
                const created = await api
                  .get(`/todaycreated/${user.id}`)
                  .then((res) => res.data.total_leads || 0)
                  .catch(() => 0);
                const updated = await api
                  .get(`/todayupdated/${user.id}`)
                  .then((res) => res.data.total_leads || 0)
                  .catch(() => 0);
                return {
                  id: user.id,
                  name: user.name || user.username, // fallback to username
                  role: user.role,
                  today_leads: created,
                  updated_leads: updated,
                };
              })
            );
            const todayLeadsMap = {};
            const updatedLeadsMap = {};
            todayLeadsResults.forEach((item) => {
              todayLeadsMap[item.id] = {
                today_leads: item.today_leads,
                role: item.role,
                name: item.name,
              };
              updatedLeadsMap[item.id] = {
                updated_leads: item.updated_leads,
              };
            });
            setUserTodayLeads(todayLeadsMap);
            setUserUpdatedLeads(updatedLeadsMap);
          }
        } else if (user && user.id) {
          // Only fetch for the current user
          setUsers([user]);
          const created = await api
            .get(`/todaycreated/${user.id}`)
            .then((res) => res.data.total_leads || 0)
            .catch(() => 0);
          const updated = await api
            .get(`/todayupdated/${user.id}`)
            .then((res) => res.data.total_leads || 0)
            .catch(() => 0);

          setUserTodayLeads({
            [user.id]: {
              today_leads: created,
              role: user.role,
              name: user.name || user.username, // fallback to username
            },
          });
          setUserUpdatedLeads({
            [user.id]: {
              updated_leads: updated,
            },
          });
        }
      } catch (err) {
        console.error("Error fetching users/today Shop Owners:", err);
      }
    };
    fetchUsersAndTodayLeads();
  }, [rolePermissions, user]);


  // Filtering and pagination logic
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (lead.customer_name && lead.customer_name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.contact && lead.contact.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  const handleItemsPerPageChange = (num) => {
    setItemsPerPage(num);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemsPerPageDropdownRef.current &&
        !itemsPerPageDropdownRef.current.contains(event.target)
      ) {
        setIsItemsPerPageDropdownOpen(false);
      }
    };

    if (isItemsPerPageDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isItemsPerPageDropdownOpen]);

  // Helper for date formatting
  const formatDateTimeForTable = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleString();
  };

  // Helper for role formatting
  const formatRole = (role) => {
    if (role === "sales_manager") return "Sales Manager";
    if (role === "manager") return "Manager";
    if (role === "user") return "User";
    return role;
  };
  
  //seperator

  const [dashboardData, setDashboardData] = useState({});
  const [error, setError] = useState(null);
  

 useEffect(() => {
  const fetchLeadStatuses = async () => {
    try {
      const response = await api.get("/showleadstatus");
      const data = response.data;

      if (data.success && Array.isArray(data.data)) {
        setLeadStatuses(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    }
  };

  fetchLeadStatuses();
}, []);


  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please login.");
        return;
      }

      const [leadsByStatusRes] = await Promise.all([
        api.get("/totalleads", {}),
      ]);

      setDashboardData({
        leadsByStatus: leadsByStatusRes.data,
      });
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      setError("Failed to load dashboard data.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []); 
  
//  console.log(leadStatuses);
  
  
  return (
    <div className="box-border max-w-7xl w-full md:w-[95vw]  lg:max-w-[1180px] md:mx-auto px-2 sm:px-4 lg:px-0 overflow-x-hidden ">
      {/* Top Lead Status Cards */}
      <div className="flex flex-wrap justify-between md:justify-start gap-2 md:gap-7 sm:gap-4 mb-4 w-full lg:max-w-[85vw] custom-1322 custom-1400 ">
        {/* Total Leads card at the very start */}
        <Container1
          leads={dashboardData?.leadsByStatus?.total_leads || 0}
          icon={<BsFillPersonLinesFill />}
          totalLeadsLabel="Total Shop Owners" 
        />
        {/* Render a Container1 for each status */}
        {LEAD_STATUS_CARDS.map((status) => (
          <Container1
            key={status.id}
            leads={leadCounts[status.id] || 0}
            icon={status.icon}
            totalLeadsLabel={status.label}
          />
        ))}
      </div>

      {/* User Activity Today Section */}
    <div>
          <div className="text-[#727A90] text-sm font-medium mb-2 ml-1">    
        {/* Categories */}
          </div>
        <div className="flex flex-wrap gap-4 w-full min-w-0 justify-center md:justify-start ">
          {leadStatuses.map((item) => (
//             <div
//                   key={item.status_id}
//                   className="flex flex-col items-center  justify-center bg-gradient-to-br from-white to-[#E7F4FF] rounded-[12px] shadow-[0_2px_8px_rgba(24,95,235,0.06)] px-2 sm:px-3 md:px-5 py-3 sm:py-4 min-w-[100px] sm:min-w-[120px] md:min-w-[150px] max-w-[120px] sm:max-w-[150px] md:max-w-[170px] border border-[#E9EAEA] cursor-pointer hover:shadow-lg transition w-full sm:w-auto mb-2 sm:mb-0 box-border overflow-hidden"
//                   onClick={() =>
//        navigate(`/leads/${item.status_id}/${item.status_name}`, {
//      state: { assignedTo: user.id, updatedBy: user.id },
//   })
// }
                  
//                 >
//                   {/* Avatar */}
//                   {/* <div className="w-8 h-8 rounded-full bg-[#e3e9f7] flex items-center justify-center text-sm font-semibold text-[#ef7e1b] mb-2 shadow-sm border border-[#d1e3fa]">
//                     {initials}
//                   </div> */}
//                   {/* Name */}
//                   <div className="text-[15px] font-semibold text-[#1F2837] mb-0.5 truncate w-full text-center max-w-full">
//                     {item.status_name}
//                   </div>
//                   {/* Role badge */}
//                   {/* <div
//                     className={`text-[11px] font-normal px-2 py-0.5 rounded-full border ${roleColor} mb-2 capitalize w-fit mx-auto`}
//                   >
//                     {formatRole(todayData.role || user.role)}
//                   </div> */}
//                   {/* Divider */}
//                   {/* <div className="w-full h-px bg-[#F0F4F8] my-1" /> */}
//                   {/* Today's Leads and Updated Leads Today */}
//                   {/* <div className="flex flex-col items-center mt-1 gap-1 w-full">
//                     <div className="flex flex-row justify-between items-center w-full"></div>
//                     <div className="flex flex-row justify-between items-center w-full">
//                       <span className="text-[10px] text-[#727A90] mt-0.5 text-left ">
//                         Today's <br></br>Updated Shop Owners
//                       </span>
//                       <span className="text-2xl font-bold text-[#ef7e1b] leading-none text-right">
//                         {updatedData.updated_leads ?? 0}
//                       </span>
//                     </div>
//                   </div> */}
//                 </div>
          <div/>
          ))}
        </div>
    </div>

      {/* Customer Enquiry Section */}
      {/* <div
        className={`min-h-[797px] p-2 sm:p-4 md:p-6 mt-8 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full box-border overflow-x-auto md:w-11/12 lg:max-w-[75vw] xl:w-full  `}
      > */}
        {/* Header Section */}
        {/* <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-8 w-full min-w-0">
          <h1 className="text-[18px] sm:text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap truncate max-w-full   ">
            Shop Owners 
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4">
            <span className="text-[#727A90] text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
              Show
            </span>
            <div
              className="relative min-w-[56px] sm:min-w-[72px] md:min-w-[88px] lg:min-w-[88px] max-w-full"
              ref={itemsPerPageDropdownRef}
            >
              <button
                type="button"
                className="relative appearance-none h-[32px] sm:h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-8 sm:pr-10 md:pr-15 lg:pr-15 w-full min-w-[56px] sm:min-w-[72px] md:min-w-[88px] lg:min-w-[88px] bg-white border border-[#E9EAEA] rounded-[8px]  text-[#242729] text-[10px] sm:text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center box-border"
                onClick={() => setIsItemsPerPageDropdownOpen((open) => !open)}
              >
                <span className="truncate text-left flex-1">
                  {itemsPerPage}
                </span>
                <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
              </button>
              {isItemsPerPageDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar box-border">
                  {[5, 10, 20, 50].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        handleItemsPerPageChange(option);
                        setIsItemsPerPageDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-xs sm:text-sm md:text-base lg:text-base ${
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
        </div> */}

        {/* Lead List Table */}
        {/* <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar box-border">
          <table className="min-w-full border-collapse text-xs sm:text-sm md:text-base box-border">
            <thead>
              <tr className="text-left text-[#4B5563]">
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[120px]">
                  Shop Owners ID
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[180px]">
                  Shop Owners Name
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[160px]">
                  Email
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  Contact
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  City
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  WhatsApp
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[180px]">
                  Shop name
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[180px]">
                  Message
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  Source
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[120px]">
                  Categories
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[120px]">
                  Assigned Member
                </th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="py-8 px-6 text-center text-[#4B5563]"
                  >
                    {searchTerm
                      ? "No Shop Owners found matching your search."
                      : "Shop Owners available."}
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr
                    key={lead.customer_id}
                    className="border-t border-[#E5E7EB]"
                  >
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.customer_id}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      <div className="flex items-center gap-3 ">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={lead.profile_pic || "/dummyavatar.jpeg"}
                            alt={lead.customer_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/dummyavatar.jpeg";
                            }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#1F2837] font-medium">
                            {lead.customer_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.email}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.contact}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
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
                        return "-";
                      })()}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.whatsapp_number || "-"}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.requirements}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.message}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.source}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 max-w-xs overflow-hidden truncate">
                      <span
                        className={`
                        px-3 py-1 rounded-lg text-sm flex items-center gap-2
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
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.assigned_to}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div> */}

        {/* Lead List Cards for Mobile */}
        {/* <div className="md:hidden w-full space-y-4 sm:space-y-6 pb-20 sm:pb-24 flex-grow overflow-x-auto">
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
            currentLeads.map((lead) => (
              <div
                key={lead.customer_id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg p-2 sm:p-4 "
              >
                {/* Header Section */}
                {/* <div className="p-4 sm:p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center space-x-3 ">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
                          <img
                            src={lead.profile_pic || "/dummyavatar.jpeg"}
                            alt={lead.customer_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/dummyavatar.jpeg";
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">
                            {lead.customer_name}
                          </h3>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
                {/* Details Section */}
                {/* <div className="p-3 sm:p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                          {lead.whatsapp_number || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                            return "-";
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                        <p className="text-[7px] sm:text-xs ml-1 text-gray-900 whitespace-nowrap">
                          {formatDateTimeForTable(lead.follow_up_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                        Message
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {lead.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
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
                        Categories
                      </p>
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
              </div>
            ))
          )}
        </div> */} 
        {/* Pagination Controls */}
        {/* {filteredLeads.length > 0 && (
          <div className="flex justify-center pt-4 sm:pt-7 mt-auto">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`w-[44px] h-[44px] lg:w-[52px] lg:h-[52px]
          rounded-full border border-[#0e4053]
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
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base text-[#4B5563]">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <span>({filteredLeads.length} total)</span>
              </div>
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
        )} */}
      </div> 
  );
};

export default Dashboard;

import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import api from "../../api";
import Swal from "sweetalert2";
import { SidebarContext } from "../../components/Layout";
import { useAuth } from "../../auth/AuthContext";
import "../../styles/scrollbar.css";

const Villagees = () => {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedVillages, setSelectedVillages] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
 const { isCollapsed } = useContext(SidebarContext);
const { user } = useAuth();
const assigneeDropdownRef = useRef(null);

const [users, setUsers] = useState([]);
const [selectedAssignee, setSelectedAssignee] = useState("");
const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

// Edit Shop Count Modal States
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editingVillage, setEditingVillage] = useState(null);
const [editTotalShops, setEditTotalShops] = useState(0);
const [editActiveShops, setEditActiveShops] = useState(0);
const [editInactiveShops, setEditInactiveShops] = useState(0);
const [isUpdating, setIsUpdating] = useState(false);




   
  // ✅ Fetch Villages
  const fetchVillages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/villages");
      if (response.data && Array.isArray(response.data)) {
        setVillages(response.data);
      } else {
        setVillages([]);
      }
    } catch (err) {
      console.error("Error fetching villages:", err);
      setVillages([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Users/Salesman
  const fetchUsers = async () => {
    try {
      const response = await api.get("/userlist");
      const userData = response.data?.result || response.data?.data || response.data;
      
      if (userData && Array.isArray(userData)) {
        setUsers(userData);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  // ✅ Open Edit Modal
  const handleOpenEditModal = (village) => {
    setEditingVillage(village);
    setEditTotalShops(village.total_shops || 0);
    setEditActiveShops(village.active_shops || 0);
    setEditInactiveShops(village.inactive_shops || 0);
    setIsEditModalOpen(true);
  };

  // ✅ Update Shop Counts
  const handleUpdateShopCounts = async () => {
    if (!editingVillage) return;

    try {
      setIsUpdating(true);

      // TODO: Replace with actual API endpoint when provided
      await api.post(`/villages/${editingVillage.id}/update-shop-counts`, {
        total_shops: editTotalShops,
        active_shops: editActiveShops,
        inactive_shops: editInactiveShops,
      });

      // Update the village in the list
      setVillages((prev) =>
        prev.map((v) =>
          v.id === editingVillage.id
            ? {
                ...v,
                total_shops: editTotalShops,
                active_shops: editActiveShops,
                inactive_shops: editInactiveShops,
              }
            : v
        )
      );

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Shop counts updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating shop counts:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.message || "Could not update shop counts.",
        confirmButtonColor: "#ef7e1b",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchVillages();
    fetchUsers();
  }, []);

  // ✅ Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsSearchExpanded(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(e.target)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Filter Logic
  const filteredVillages = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return villages.filter(
      (v) =>
        v.village_name?.toLowerCase().includes(search) ||
        v.route?.route_name?.toLowerCase().includes(search) ||
        v.area?.area_name?.toLowerCase().includes(search) ||
        v.branch?.branch_name?.toLowerCase().includes(search)
    );
  }, [villages, searchTerm]);

  const totalPages = Math.ceil(filteredVillages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVillages = filteredVillages.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ✅ Selection Handlers
  const toggleVillageSelection = (id) => {
    setSelectedVillages((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVillages.length === currentVillages.length) {
      setSelectedVillages([]);
    } else {
      setSelectedVillages(currentVillages.map((v) => v.id));
    }
  };



  // ✅ Pagination controls
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleBulkAssign = async () => {
    if (selectedVillages.length === 0) {
      Swal.fire("No Villages Selected", "Please select villages first.", "info");
      return;
    }
    if (!selectedAssignee) {
      Swal.fire("Select Salesman", "Please choose a salesman.", "warning");
      return;
    }

    try {
      // Find the selected user's ID
      const selectedUser = users.find(u => u.name === selectedAssignee);
      if (!selectedUser) {
        Swal.fire("Error", "Selected user not found.", "error");
        return;
      }

      // Show loading
      Swal.fire({
        title: "Assigning Villages...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Assign multiple villages to the user in single API call
      const response = await api.post("/villages/assign-multiple", {
        user_id: selectedUser.id,
        village_ids: selectedVillages,
      });

      Swal.fire({
        icon: "success",
        title: "Villages Assigned!",
        text: response.data?.message || `${selectedVillages.length} villages assigned to ${selectedAssignee}.`,
        confirmButtonColor: "#ef7e1b",
      });

      // Refresh villages list
      fetchVillages();

      setIsBulkAssignModalOpen(false);
      setSelectedAssignee("");
      setAssigneeSearchTerm("");
      setSelectedVillages([]);
    } catch (error) {
      console.error("Error assigning villages:", error);
      Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: error.response?.data?.message || "Failed to assign villages.",
        confirmButtonColor: "#ef7e1b",
      });
    }
  };



  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading Villages...
      </div>
    );
  }

  return (
    <div
      className={`min-h-[797px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full ${
        isCollapsed
          ? "lg:max-w-[85vw] md:w-[85vw]"
          : "lg:max-w-[75vw] md:w-[80vw]"
      } md:mx-auto`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between  mb-8">
        <h1 className="text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap">
          Villages
        </h1>

        {/* Search Bar */}
        <div className="flex-1 max-w-[400px] mx-1">
          {isMobile && !isSearchExpanded ? (
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="w-10 h-10 flex items-center rounded-[6px] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <path
                  d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
                  stroke="#787374"
                  strokeWidth="1.5"
                />
                <path
                  d="M18.3333 18.3333L20.1667 20.1667"
                  stroke="#787374"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : (
            <div className="relative w-full">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path
                    d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
                    stroke="#787374"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M18.3333 18.3333L20.1667 20.1667"
                    stroke="#787374"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search by village Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => isMobile && setIsSearchExpanded(false)}
                className="w-full h-[44px] pl-12 pr-4 bg-[#E9F1F9] rounded-[6px] text-[#787374] placeholder-[#787374] focus:outline-none text-sm md:text-base"
              />
            </div>
          )}
        </div>

        {/* Bulk Edit */}
        {selectedVillages.length > 0 && (user?.role === "admin" || user?.role === "superadmin") && (
          <button
            className="bg-[#ef7e1b] hover:bg-[#e86d00] text-white h-[44px] px-5 rounded-[8px]"
            onClick={() => setIsBulkAssignModalOpen(true)}
          >
           Assigned Villages
          </button>
        )}
      </div>

      {/* Table */}
      <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[#4B5563]">
              <th className="py-4 px-6 w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedVillages.length === currentVillages.length &&
                    currentVillages.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer"
                />
              </th>
              <th className="py-4 px-6 text-sm font-medium">Village ID</th>
              <th className="py-4 px-6 text-sm font-medium">Village Name</th>
              <th className="py-4 px-6 text-sm font-medium">Assigned Member</th>
              <th className="py-4 px-6 text-sm font-medium">Total Shops</th>
              <th className="py-4 px-6 text-sm font-medium">Active Shops</th>
              <th className="py-4 px-6 text-sm font-medium">Inactive Shops</th>
              <th className="py-4 px-6 text-sm font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentVillages.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 px-6 text-center text-[#4B5563]">
                  {searchTerm ? "No Villages found." : "No Villages available."}
                </td>
              </tr>
            ) : (
              currentVillages.map((village) => (
                <tr key={village.id} className="border-t border-[#E5E7EB]">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedVillages.includes(village.id)}
                      onChange={() => toggleVillageSelection(village.id)}
                      className="w-4 h-4 rounded border-[#E9EAEA] cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6 text-sm text-[#4B5563]">{village.id}</td>
                  <td className="py-4 px-6 text-sm text-[#4B5563]">
                    {village.village_name}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#4B5563]">
                    {village.user?.name || "Not Assigned"}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#4B5563]">
                    {village.total_shops || 0}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#4B5563]">
                    {village.active_shops || 0}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#4B5563]">
                    {village.inactive_shops || 0}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <button
                      onClick={() => handleOpenEditModal(village)}
                      className="bg-[#ef7e1b] hover:bg-[#e86d00] text-white px-3 py-1 rounded-md text-xs"
                    >
                      Edit Count
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        {/* Mobile View */}
      <div className="md:hidden w-full space-y-4">
        {currentVillages.map((village) => (
          <div
            key={village.id}
            className="p-4 bg-white rounded-xl shadow border border-gray-100"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold text-[#1F2837]">
                  {village.village_name}
                </h3>
                <p className="text-sm text-gray-500">ID: {village.id}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedVillages.includes(village.id)}
                onChange={() => toggleVillageSelection(village.id)}
                className="w-5 h-5 rounded border-gray-300 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Total Shops: <span className="font-medium">{village.total_shops || 0}</span>
              </p>
              <p className="text-sm text-gray-600">
                Active Shops: <span className="font-medium">{village.active_shops || 0}</span>
              </p>
              <p className="text-sm text-gray-600">
                Inactive Shops: <span className="font-medium">{village.inactive_shops || 0}</span>
              </p>
              <p className="text-sm text-gray-600">
                Assigned Member:{" "}
                <span className="font-medium">
                  {village.user?.name || "Not Assigned"}
                </span>
              </p>
              <button
                onClick={() => handleOpenEditModal(village)}
                className="mt-2 bg-[#ef7e1b] hover:bg-[#e86d00] text-white px-3 py-2 rounded-md text-xs"
              >
                Edit Count
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredVillages.length > 0 && (
        <div className="flex justify-center pt-7 mt-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="w-[44px] h-[44px] rounded-full border border-[#7E7B7B]"
            >
              &lt;
            </button>
            <span className="text-sm text-[#4B5563]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="w-[44px] h-[44px] rounded-full border border-[#7E7B7B]"
            >
              &gt;
            </button>
          </div>
        </div>
      )}



      {/* Edit Shop Count Modal */}
      {isEditModalOpen && editingVillage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-3">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="w-full max-w-[500px] p-6 rounded-2xl bg-gradient-to-br from-white to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-lg font-bold hover:text-[#ef7e1b]"
            >
              ✕
            </button>
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-6 text-left">
              Edit Shop Counts - {editingVillage.village_name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[#4B5563] text-[14px] mb-2">
                  Total Shops:
                </label>
                <input
                  type="number"
                  value={editTotalShops}
                  onChange={(e) => setEditTotalShops(parseInt(e.target.value) || 0)}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[14px] mb-2">
                  Active Shops:
                </label>
                <input
                  type="number"
                  value={editActiveShops}
                  onChange={(e) => setEditActiveShops(parseInt(e.target.value) || 0)}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[14px] mb-2">
                  Inactive Shops:
                </label>
                <input
                  type="number"
                  value={editInactiveShops}
                  onChange={(e) => setEditInactiveShops(parseInt(e.target.value) || 0)}
                  className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                  min="0"
                />
              </div>

              <button
                onClick={handleUpdateShopCounts}
                disabled={isUpdating}
                className="w-full h-[44px] bg-[#ef7e1b] text-white rounded-[10px] transition-colors text-base font-medium shadow-sm hover:bg-[#e86d00] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update Counts"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-3">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={() => setIsBulkAssignModalOpen(false)}
          />
          <div className="w-full max-w-[700px] p-6 rounded-2xl bg-gradient-to-br from-white to-[#E6F4FF] shadow-lg relative z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBulkAssignModalOpen(false)}
              className="absolute top-6 right-6 text-lg font-bold"
            >
              ✕
            </button>
            <h2 className="text-[24px] font-medium text-[#1F2837] mb-6 text-left">
              Bulk Assign Villages
            </h2>

            <div ref={assigneeDropdownRef} className="relative mb-6">
              <label className="block text-[#4B5563] text-[16px] mb-2">
                Select Salesman:
              </label>
              <input
                type="text"
                placeholder="Search salesman..."
                value={assigneeSearchTerm}
                onFocus={() => setIsAssigneeDropdownOpen(true)}
                onChange={(e) => {
                  setAssigneeSearchTerm(e.target.value);
                  setIsAssigneeDropdownOpen(true);
                }}
                className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
              {isAssigneeDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto">
                  {(() => {
                    if (users.length === 0) {
                      return <div className="px-3 py-2 text-[#545454]">Loading users...</div>;
                    }

                    const filteredUsers = users.filter((user) => {
                      const userName = user.name || user.username || user.full_name || "";
                      return userName
                        .toLowerCase()
                        .includes(assigneeSearchTerm.toLowerCase());
                    });

                    if (filteredUsers.length === 0) {
                      return <div className="px-3 py-2 text-[#545454]">No matching users</div>;
                    }

                    return filteredUsers.map((user) => {
                      const displayName = user.name || user.username || user.full_name || "Unknown";
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedAssignee(displayName);
                            setAssigneeSearchTerm(displayName);
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454]"
                        >
                          {displayName}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <button
              onClick={handleBulkAssign}
              className="w-full h-[44px] bg-[#ef7e1b] text-white rounded-[10px] transition-colors text-base font-medium shadow-sm hover:bg-[#e86d00]"
            >
              Assign Villages
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Villagees;

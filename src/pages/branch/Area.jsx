import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical, TbSearch } from "react-icons/tb";
import Swal from "sweetalert2";
import api from "../../api";

const Area = () => {
  const [areas, setAreas] = useState([]);
  const [branches, setBranches] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    branch_id: "",
    route_id: "",
    area_name: "",
  });

  // Fetch all areas
  const fetchAreas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/areas");
      if (Array.isArray(res.data)) setAreas(res.data);
      else if (res.data.data) setAreas(res.data.data);
    } catch (err) {
      console.error("Error fetching areas:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get("/branches");
      if (res.data.status) setBranches(res.data.data);
    } catch (err) {
      console.error("Error fetching branches:", err.message);
    }
  }, []);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      const res = await api.get("/routes");
      if (res.data?.data) setRoutes(res.data.data);
      else if (Array.isArray(res.data)) setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    fetchRoutes();
    fetchAreas();
  }, [fetchBranches, fetchRoutes, fetchAreas]);

  // Filter routes by branch
  useEffect(() => {
    if (formData.branch_id) {
      const filtered = routes.filter(
        (route) => String(route.branch_id) === String(formData.branch_id)
      );
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes([]);
    }
  }, [formData.branch_id, routes]);

  // Helper functions
  const getBranchName = (id) => {
    const branch = branches.find((b) => b.id === id);
    return branch ? branch.branch_name : "N/A";
  };

  const getRouteName = (id) => {
    const route = routes.find((r) => r.id === id);
    return route ? route.route_name : "N/A";
  };

  // Search filter
  const filteredAreas = areas.filter((area) => {
    const query = searchQuery.toLowerCase();
    return (
      area.area_name?.toLowerCase().includes(query) ||
      getBranchName(area.branch_id)?.toLowerCase().includes(query) ||
      getRouteName(area.route_id)?.toLowerCase().includes(query)
    );
  });

  // Pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentData = filteredAreas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAreas.length / rowsPerPage);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({ branch_id: "", route_id: "", area_name: "" });
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch_id || !formData.route_id || !formData.area_name) {
      Swal.fire("Warning", "Please fill all fields", "warning");
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await api.put(`/areas/${editId}`, formData);
        Swal.fire("Updated!", "Area updated successfully!", "success");
      } else {
        await api.post("/areas", formData);
        Swal.fire("Created!", "New area added successfully!", "success");
      }
      await fetchAreas();
      handleCancel();
    } catch (err) {
      Swal.fire("Error", "Failed to save area", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (area) => {
    setFormData({
      branch_id: area.branch_id,
      route_id: area.route_id,
      area_name: area.area_name,
    });
    setEditId(area.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the area.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.delete(`/areas/${id}`);
        await fetchAreas();
        Swal.fire("Deleted!", "Area has been removed.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete area", "error");
      } finally {
        setLoading(false);
      }
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading areas...
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto flex min-h-[440px] max-w-5xl flex-col rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E7F4FF] p-6 shadow-[0px_20px_45px_rgba(20,84,182,0.08)] md:p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Areas
            </span>
          </h1>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search areas..."
                className="h-[44px] pl-10 pr-4 rounded-[10px] border border-gray-300 bg-white focus:ring-2 focus:ring-[#0e4053] outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
          {/* Pagination Top */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#4B5563]">Show</label>
            <select
              className="border border-gray-300 rounded-md text-sm px-2 py-1"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
        
          </div>

              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setIsEditing(false);
                  setFormData({ branch_id: "", route_id: "", area_name: "" });
                }}
                className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] hover:bg-[#ee7f1b]"
              >
                Add Area
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="hidden md:block flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
            <div>Branch</div>
            <div>Route</div>
            <div>Area ID</div>
            <div>Area Name</div>
            <div>Actions</div>
          </div>

          <div className="pb-6">
            {areas.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No areas available.
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No areas found matching "{searchQuery}"
              </div>
            ) : (
              currentData.map((area) => (
                <div
                  key={area.id}
                  className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center"
                >
                  <div>{getBranchName(area.branch_id)}</div>
                  <div>{getRouteName(area.route_id)}</div>
                  <div>{area.id}</div>
                  <div>{area.area_name}</div>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(area.id)}
                      className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                    >
                      <TbDotsVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === area.id && (
                      <div className="absolute left-0 w-24 rounded-md shadow-md bg-white z-10">
                        <button
                          onClick={() => handleEdit(area)}
                          className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(area.id)}
                          className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {currentData.map((area) => (
            <div
              key={area.id}
              className="p-4 rounded-[12px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm"
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-[#1F2837] text-lg">
                  {area.area_name}
                </h3>
                <button
                  onClick={() => toggleDropdown(area.id)}
                  className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                >
                  <TbDotsVertical className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Branch: {getBranchName(area.branch_id)}
              </p>
              <p className="text-sm text-gray-600">
                Route: {getRouteName(area.route_id)}
              </p>
              <p className="text-sm text-gray-600">ID: {area.id}</p>

              {activeDropdown === area.id && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(area)}
                    className="px-3 py-1 text-sm rounded-md bg-[#ef7e1b] text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="px-3 py-1 text-sm rounded-md bg-gray-300 text-[#1F2837]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Bottom */}
        {filteredAreas.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="text-sm text-gray-600 mb-3 md:mb-0">
              Showing {indexOfFirst + 1} to{" "}
              {Math.min(indexOfLast, filteredAreas.length)} of {filteredAreas.length} entries
              {searchQuery && ` (filtered from ${areas.length} total)`}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 border-white/30">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={handleCancel}
          />
          <div className="w-11/12 max-w-[600px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ✕
            </button>

            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              {isEditing ? "Edit Area" : "Add New Area"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                {/* Branch */}
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Select Branch
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) =>
                      handleInputChange("branch_id", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>

                  {/* Route */}
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Select Route
                  </label>
                  <select
                    value={formData.route_id}
                    onChange={(e) =>
                      handleInputChange("route_id", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    required
                  >
                    <option value="">Select Route</option>
                    {filteredRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name}
                      </option>
                    ))}
                  </select>

                  {/* Area Name */}
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Area Name
                  </label>
                  <input
                    type="text"
                    value={formData.area_name}
                    onChange={(e) =>
                      handleInputChange("area_name", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    placeholder="Enter area name"
                    required
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                >
                  {isEditing ? "Save changes" : "Add Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Area;

import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical, TbSearch } from "react-icons/tb";
import Swal from "sweetalert2";
import api from "../../api";

const Routee = ({ branchId = null }) => {
  const [routes, setRoutes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [formData, setFormData] = useState({
    branch_id: "",
    route_name: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/routes");
      if (res.data?.data) setRoutes(res.data.data);
      else if (Array.isArray(res.data)) setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes:", err.message);
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

  useEffect(() => {
    fetchBranches();
    fetchRoutes();
  }, [fetchBranches, fetchRoutes]);

  const getBranchName = (id) => {
    const branch = branches.find((b) => b.id === id);
    return branch ? branch.branch_name : "N/A";
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({ branch_id: "", route_name: "" });
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch_id || !formData.route_name) {
      Swal.fire("Warning", "Please fill all fields", "warning");
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await api.put(`/routes/${editId}`, formData);
        Swal.fire("Updated!", "Route updated successfully!", "success");
      } else {
        await api.post("/routes", formData);
        Swal.fire("Created!", "New route added successfully!", "success");
      }
      await fetchRoutes();
      handleCancel();
    } catch (err) {
      Swal.fire("Error", "Failed to save route", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (route) => {
    setFormData({
      branch_id: route.branch_id,
      route_name: route.route_name,
    });
    setEditId(route.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the route.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.delete(`/routes/${id}`);
        await fetchRoutes();
        Swal.fire("Deleted!", "Route has been removed.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete route", "error");
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

  // Search filter
  const filteredRoutes = routes.filter((route) => {
    const query = searchQuery.toLowerCase();
    return (
      route.route_name?.toLowerCase().includes(query) ||
      getBranchName(route.branch_id)?.toLowerCase().includes(query)
    );
  });

  // Pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentData = filteredRoutes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRoutes.length / rowsPerPage);

  

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading routes...
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto flex min-h-[440px] max-w-5xl flex-col rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E7F4FF] p-6 shadow-[0px_20px_45px_rgba(20,84,182,0.08)] md:p-8">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Routes
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
                placeholder="Search routes..."
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
                  setFormData({ branch_id: "", route_name: "" });
                }}
                className="h-[44px] rounded-[10px] bg-[#003A72] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(0,58,114,0.4)] hover:bg-[#004B8D]"
              >
                Add Route
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        {/* Table */} 
        <div className="hidden md:block flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] p-4">
          <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
            <div>Branch</div>
            <div>Route ID</div>
            <div>Route Name</div>
            <div>Actions</div>
          </div>

          <div className="pb-6">
            {routes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No routes available.
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No routes found matching "{searchQuery}"
              </div>
            ) : (
              currentData.map((route) => (
                <div
                  key={route.id}
                  className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center"
                >
                  <div>{getBranchName(route.branch_id)}</div>
                  <div>{route.id}</div>
                  <div>{route.route_name}</div>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(route.id)}
                      className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                    >
                      <TbDotsVertical className="w-4 h-4" />
                    </button>

                    {activeDropdown === route.id && (
                      <div className="absolute left-0 w-24 rounded-md shadow-md bg-white z-10">
                        <button
                          onClick={() => handleEdit(route)}
                          className="px-2 py-1 text-sm hover:bg-[#004B8D] hover:text-white w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="px-2 py-1 text-sm hover:bg-[#004B8D] hover:text-white  w-full text-left"
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
          {
            currentData.map((route) => (
              <div
                key={route.id}
                className="p-4 rounded-[12px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm"
              >
                <div className="flex justify-between ">
               <h3 className="font-medium text-[#1F2837] text-lg">
                      {route.route_name}
                    </h3>
                     <button
                   onClick={() => toggleDropdown(route.id)}
                                      className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                                    >
                                      <TbDotsVertical className="w-5 h-5" />
                                    </button>
                                      </div>
                  <p className="text-sm text-gray-600 mt-1">
                      Branch: {getBranchName(route.branch_id)}
                    </p>
                   <p className="text-sm text-gray-600">ID: {route.id}</p>
                                

                  {activeDropdown === route.id && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(route)}
                           className="px-3 py-1 text-sm rounded-md bg-[#003A72] text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                            className="px-3 py-1 text-sm rounded-md bg-[#003A72] text-white"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                
        </div>
          ))}
        </div>

        {/* Bottom Pagination */}
        {filteredRoutes.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="text-sm text-gray-600 mb-3 md:mb-0">
              Showing {indexOfFirst + 1} to{" "}
              {Math.min(indexOfLast, filteredRoutes.length)} of {filteredRoutes.length} entries
              {searchQuery && ` (filtered from ${routes.length} total)`}
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
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ✕
            </button>

            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              {isEditing ? "Edit Route" : "Add New Route"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
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

                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={formData.route_name}
                    onChange={(e) =>
                      handleInputChange("route_name", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    placeholder="Enter route name"
                    required
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
                >
                  {isEditing ? "Save changes" : "Add Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routee;

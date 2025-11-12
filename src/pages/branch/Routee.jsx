import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical } from "react-icons/tb";
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Pagination logic
  const totalPages = Math.ceil(routes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRoutes = routes.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

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
        <div className="mb-8 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Routes
            </span>
          </h1>

          {/* Pagination Top Control */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded px-2 py-1 text-sm focus:ring-[#0e4053]"
            >
              {[5, 10, 25].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
                   </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setFormData({ branch_id: "", route_name: "" });
            }}
            className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] hover:bg-[#ee7f1b]"
          >
            Add Route
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
            <div>Branch</div>
            <div>Route ID</div>
            <div>Route Name</div>
            <div>Actions</div>
          </div>

          <div className="pb-4">
            {routes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No routes available.
              </div>
            ) : (
              currentRoutes.map((route) => (
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
                          className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
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
        <div className="block md:hidden space-y-4 mt-4">
          {routes.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No routes available.
            </div>
          ) : (
            currentRoutes.map((route) => (
              <div
                key={route.id}
                className="p-4 rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#1F2837]">
                      {route.route_name}
                    </h3>
                    <p className="text-sm text-[#4B5563]">
                      Branch: {getBranchName(route.branch_id)}
                    </p>
                    <p className="text-sm text-[#4B5563]">ID: {route.id}</p>
                  </div>

                  <button
                    onClick={() => toggleDropdown(route.id)}
                    className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                  >
                    <TbDotsVertical className="w-5 h-5" />
                  </button>

                  {activeDropdown === route.id && (
                    <div className="absolute right-4 top-10 w-24 rounded-md shadow-md bg-white z-10">
                      <button
                        onClick={() => handleEdit(route)}
                        className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
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

        {/* Bottom Pagination */}
        {routes.length > 0 && (
          <div className="flex justify-between items-center mt-4 px-2">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, routes.length)} of{" "}
              {routes.length} entries
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="text-sm px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="text-sm px-3 py-1 border rounded disabled:opacity-40"
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
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
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

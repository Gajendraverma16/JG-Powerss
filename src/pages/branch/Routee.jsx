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

  // ✅ Fetch Routes
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

  // ✅ Fetch Branches
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

  // Helper
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
        <div className="mb-8 flex flex-row gap-3 items-center justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Routes
            </span>
          </h1>

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

        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          <div className="hidden md:block">
            <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
              <div>Branch</div>
              <div>Route ID</div>
              <div>Route Name</div>
              <div>Actions</div>
            </div>

            <div className="pb-20">
              {routes.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No routes available.
                </div>
              ) : (
                routes.map((route) => (
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
        </div>
      </div>

      {/*  Modal  */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
    <div className="relative bg-white rounded-2xl p-6 w-[400px] shadow-lg">
      {/* ✖ Close Button (same as Area) */}
      <button
        onClick={handleCancel}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl leading-none"
      >
        &times;
      </button>

      <h2 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Route" : "Add Route"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branch select */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Branch</label>
          <select
            value={formData.branch_id}
            onChange={(e) => handleInputChange("branch_id", e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
          </select>
        </div>

        {/* Route name */}
        <div>
          <label className="block text-sm font-medium mb-1">Route Name</label>
          <input
            type="text"
            value={formData.route_name}
            onChange={(e) => handleInputChange("route_name", e.target.value)}
            placeholder="Enter route name"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[#ef7e1b] text-white hover:bg-[#ee7f1b]"
          >
            {isEditing ? "Update" : "Save"}
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

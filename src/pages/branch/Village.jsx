import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical } from "react-icons/tb";
import Swal from "sweetalert2";
import api from "../../api";

const Village = () => {
  const [villages, setVillages] = useState([]);
  const [branches, setBranches] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    branch_id: "",
    route_id: "",
    area_id: "",
    village_name: "",
  });

  // Filter routes by selected branch
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

  // Filter areas by selected route
  useEffect(() => {
    if (formData.route_id) {
      const filtered = areas.filter(
        (area) => String(area.route_id) === String(formData.route_id)
      );
      setFilteredAreas(filtered);
    } else {
      setFilteredAreas([]);
    }
  }, [formData.route_id, areas]);

  // Fetch Villages
  const fetchVillages = useCallback(async () => {
  try {
    setLoading(true);
    const res = await api.get("/villages");
    const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setVillages(data);
  } catch (err) {
    console.error("Error fetching villages:", err.response?.data || err.message);
    Swal.fire("Error", "Failed to fetch villages", "error");
  } finally {
    setLoading(false);
  }
}, []);



  // Fetch Branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get("/branches");
      if (res.data.status) setBranches(res.data.data);
    } catch (err) {
      console.error("Error fetching branches:", err.message);
    }
  }, []);

  // Fetch Routes
  const fetchRoutes = useCallback(async () => {
    try {
      const res = await api.get("/routes");
      if (res.data?.data) setRoutes(res.data.data);
      else if (Array.isArray(res.data)) setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes:", err.message);
    }
  }, []);

  // Fetch Areas
  const fetchAreas = useCallback(async () => {
    try {
      const res = await api.get("/areas");
      if (res.data?.data) setAreas(res.data.data);
      else if (Array.isArray(res.data)) setAreas(res.data);
    } catch (err) {
      console.error("Error fetching areas:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    fetchRoutes();
    fetchAreas();
    fetchVillages();
  }, [fetchBranches, fetchRoutes, fetchAreas, fetchVillages]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      branch_id: "",
      route_id: "",
      area_id: "",
      village_name: "",
    });
    setEditId(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const { branch_id, route_id, area_id, village_name } = formData;

  if (!branch_id || !route_id || !area_id || !village_name) {
    Swal.fire("Warning", "Please fill all fields", "warning");
    return;
  }

  try {
    setLoading(true);

    const payload = {
      branch_id: Number(branch_id),
      route_id: Number(route_id),
      area_id: Number(area_id),
      village_name: village_name.trim(),
    };

    if (isEditing) {
      await api.put(`/villages/${editId}`, payload);
      Swal.fire("Updated!", "Village updated successfully!", "success");
    } else {
      await api.post("/villages", payload);
      Swal.fire("Created!", "Village created successfully!", "success");
    }

    await fetchVillages();
    handleCancel();
  } catch (err) {
    console.error("Error saving village:", err.response?.data || err.message);
    Swal.fire("Error", "Failed to save village", "error");
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (village) => {
    setFormData({
      branch_id: village.branch_id,
      route_id: village.route_id,
      area_id: village.area_id,
      village_name: village.village_name,
    });
    setEditId(village.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the village.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.delete(`/villages/${id}`);
        await fetchVillages();
        Swal.fire("Deleted!", "Village has been removed.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete village", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  if (loading)
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading villages...
      </div>
    );

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto flex min-h-[440px] max-w-5xl flex-col rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E7F4FF] p-6 shadow-[0px_20px_45px_rgba(20,84,182,0.08)] md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-row gap-3 items-center justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Village
            </span>
          </h1>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setFormData({
                branch_id: "",
                route_id: "",
                area_id: "",
                village_name: "",
              });
            }}
            className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] transition-colors hover:bg-[#ee7f1b]"
          >
            Add Village
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
            <div>Branch</div>
            <div>Route</div>
            <div>Area</div>
            <div>Village ID</div>
            <div>Village Name</div>
            <div>Actions</div>
          </div>

          <div className="pb-20">
            {villages.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No villages available.
              </div>
            ) : (
              villages.map((v, index) => (
                <div
                  key={v.id}
                  className="grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center"
                >
                  <div>{v.branch?.branch_name || "N/A"}</div>
                  <div>{v.route?.route_name || "N/A"}</div>
                  <div>{v.area?.area_name || "N/A"}</div>
                  <div>{index + 1}</div>
                  <div>{v.village_name}</div>
                  <div className="relative text-left">
                    <button
                      onClick={() => toggleDropdown(v.id)}
                      className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full transition-colors"
                    >
                      <TbDotsVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === v.id && (
                      <div className="absolute left-0 w-24 rounded-md shadow-md bg-white z-10">
                        <button
                          onClick={() => handleEdit(v)}
                          className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
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
          {villages.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No villages available.
            </div>
          ) : (
            villages.map((v, index) => (
              <div
                key={v.id}
                className="p-4 rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#1F2837]">
                      {v.village_name}
                    </h3>
                    <p className="text-sm text-[#4B5563]">
                      Branch: {v.branch?.branch_name || "N/A"}
                    </p>
                    <p className="text-sm text-[#4B5563]">
                      Route: {v.route?.route_name || "N/A"}
                    </p>
                    <p className="text-sm text-[#4B5563]">
                      Area: {v.area?.area_name || "N/A"}
                    </p>
                    <p className="text-sm text-[#4B5563]">
                      ID: {index + 1}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleDropdown(v.id)}
                    className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                  >
                    <TbDotsVertical className="w-5 h-5" />
                  </button>

                  {activeDropdown === v.id && (
                    <div className="absolute right-4 top-10 w-24 rounded-md shadow-md bg-white z-10">
                      <button
                        onClick={() => handleEdit(v)}
                        className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
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

            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              {isEditing ? "Edit Village" : "Add New Village"}
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

                  {/* Area */}
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Select Area
                  </label>
                  <select
                    value={formData.area_id}
                    onChange={(e) =>
                      handleInputChange("area_id", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    required
                  >
                    <option value="">Select Area</option>
                    {filteredAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.area_name}
                      </option>
                    ))}
                  </select>

                  {/* Village Name */}
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Village Name
                  </label>
                  <input
                    type="text"
                    value={formData.village_name}
                    onChange={(e) =>
                      handleInputChange("village_name", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    placeholder="Enter village name"
                    required
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                >
                  {isEditing ? "Save changes" : "Add Village"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Village;

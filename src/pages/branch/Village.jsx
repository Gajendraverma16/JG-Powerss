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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchVillages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/villages");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setVillages(data);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch villages", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get("/branches");
      if (res.data.status) setBranches(res.data.data);
    } catch (err) {
      console.error("Error fetching branches:", err.message);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await api.get("/routes");
      if (res.data?.data) setRoutes(res.data.data);
      else if (Array.isArray(res.data)) setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes:", err.message);
    }
  }, []);

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

  // Filters
  useEffect(() => {
    if (formData.branch_id) {
      setFilteredRoutes(
        routes.filter(
          (r) => String(r.branch_id) === String(formData.branch_id)
        )
      );
    } else setFilteredRoutes([]);
  }, [formData.branch_id, routes]);

  useEffect(() => {
    if (formData.route_id) {
      setFilteredAreas(
        areas.filter((a) => String(a.route_id) === String(formData.route_id))
      );
    } else setFilteredAreas([]);
  }, [formData.route_id, areas]);

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
      Swal.fire("Error", "Failed to save village", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (v) => {
    setFormData({
      branch_id: v.branch_id,
      route_id: v.route_id,
      area_id: v.area_id,
      village_name: v.village_name,
    });
    setEditId(v.id);
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
      } catch {
        Swal.fire("Error", "Failed to delete village", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  // Pagination logic
  const totalPages = Math.ceil(villages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVillages = villages.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
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
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837] mb-3 md:mb-0">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Villages
            </span>
          </h1>

          {/* Rows per page */}
          {villages.length > 0 && (
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
          )}

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
            className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] hover:bg-[#ee7f1b]"
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
              <div className="text-center py-6 text-gray-500">No villages available.</div>
            ) : (
              currentVillages.map((v, index) => (
                <div
                  key={v.id}
                  className="grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center"
                >
                  <div>{v.branch?.branch_name || "N/A"}</div>
                  <div>{v.route?.route_name || "N/A"}</div>
                  <div>{v.area?.area_name || "N/A"}</div>
                  <div>{startIndex + index + 1}</div>
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
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {currentVillages.map((village) => (
            <div
              key={village.id}
              className="p-4 rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm relative"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-[#1F2837] text-[18px]">
                    {village.village_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Code: {village.vilalge_code}
                  </p>
                </div>
                <button
                  onClick={() => toggleDropdown(village.id)}
                  className="p-1 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                >
                  <TbDotsVertical className="w-5 h-5" />
                </button>
                {activeDropdown === village.id && (
                  <div className="absolute top-10 right-4 w-24 rounded-md shadow-md bg-white z-10">
                    <button
                      onClick={() => handleEdit(village)}
                      className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(village.id)}
                      className="px-2 py-1 text-sm hover:bg-[#ee7f1b] w-full text-left"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">ID: {village.id}</div>
            </div>
          ))}
        </div>


        {/* Bottom Pagination */}
        {villages.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-4 text-sm text-gray-600 px-2">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, villages.length)} of {villages.length} entries
            </span>

            <div className="flex items-center gap-3 mt-2 md:mt-0">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Village;

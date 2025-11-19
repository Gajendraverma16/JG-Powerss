  import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical, TbSearch } from "react-icons/tb";
import Swal from "sweetalert2";
import api from "../../api";

const Branch = () => {
  const [branches, setBranches] = useState([]);
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
    branch_code: "",
    branch_name: "",
  });

  // Fetch all branches
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/branches");
      if (res.data?.data) setBranches(res.data.data);
      else if (Array.isArray(res.data)) setBranches(res.data);
    } catch (err) {
      console.error("Error fetching branches:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Search filter
  const filteredBranches = branches.filter((branch) => {
    const query = searchQuery.toLowerCase();
    return (
      branch.branch_name?.toLowerCase().includes(query) ||
      branch.branch_code?.toLowerCase().includes(query)
    );
  });

  // pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentData = filteredBranches.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredBranches.length / rowsPerPage);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({ branch_code: "", branch_name: "" });
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch_code || !formData.branch_name) {
      Swal.fire("Warning", "Please fill all fields", "warning");
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await api.put(`/branches/${editId}`, formData);
        Swal.fire("Updated!", "Branch updated successfully!", "success");
      } else {
        await api.post("/branches", formData);
        Swal.fire("Created!", "New branch added successfully!", "success");
      }
      await fetchBranches();
      handleCancel();
    } catch (err) {
      Swal.fire("Error", "Failed to save branch", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setFormData({
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
    });
    setEditId(branch.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the branch.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.delete(`/branches/${id}`);
        await fetchBranches();
        Swal.fire("Deleted!", "Branch has been removed.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete branch", "error");
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
        Loading branches...
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
              Branches
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
                placeholder="Search branches..."
                className="h-[44px] pl-10 pr-4 rounded-[10px] border border-gray-300 bg-white focus:ring-2 focus:ring-[#0e4053] outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
          {/* Pagination top */}
          <div className="flex items-center gap-2 ">
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
                  setFormData({ branch_code: "", branch_name: "" });
                }}
                className="h-[44px] rounded-[10px] bg-[#003A72] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(0,58,114,0.4)] hover:bg-[#004B8D]"
              >
                Add Branch
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]  p-4">
          <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
            <div>Branch Code</div>
            <div>Branch Name</div>
            <div>Branch ID</div>
            <div>Actions</div>
          </div>

          <div className="pb-6">
            {branches.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No branches available.
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No branches found matching "{searchQuery}"
              </div>
            ) : (
              currentData.map((branch) => (
                <div
                  key={branch.id}
                  className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center"
                >
                  <div>{branch.branch_code}</div>
                  <div>{branch.branch_name}</div>
                  <div>{branch.id}</div>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(branch.id)}
                      className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                    >
                      <TbDotsVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === branch.id && (
                      <div className="absolute left-0 w-24 rounded-md shadow-md bg-white z-10">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="px-2 py-1 text-sm hover:bg-[#004B8D] w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="px-2 py-1 text-sm hover:bg-[#004B8D] w-full text-left"
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
          {currentData.map((branch) => (
            <div
              key={branch.id}
              className="p-4 rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm relative"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-[#1F2837] text-[18px]">
                    {branch.branch_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Code: {branch.branch_code}
                  </p>
                </div>
                <button
                  onClick={() => toggleDropdown(branch.id)}
                  className="p-1 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                >
                  <TbDotsVertical className="w-5 h-5" />
                </button>
                {activeDropdown === branch.id && (
                    <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="px-3 py-1 text-sm rounded-md bg-[#003A72] text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="px-3 py-1 text-sm rounded-md bg-gray-300 text-[#1F2837]"
                  >
                    Delete
                  </button>
                </div>
                
                )}
              </div>
              <div className="text-sm text-gray-600">ID: {branch.id}</div>
            </div>
          ))}
        </div>

        {/* Pagination bottom */}
        {filteredBranches.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="text-sm text-gray-600 mb-3 md:mb-0">
              Showing {indexOfFirst + 1} to{" "}
              {Math.min(indexOfLast, filteredBranches.length)} of {filteredBranches.length} entries
              {searchQuery && ` (filtered from ${branches.length} total)`}
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
              {isEditing ? "Edit Branch" : "Add New Branch"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={formData.branch_code}
                    onChange={(e) =>
                      handleInputChange("branch_code", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    placeholder="Enter branch code"
                    required
                  />

                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) =>
                      handleInputChange("branch_name", e.target.value)
                    }
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
                    placeholder="Enter branch name"
                    required
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
                >
                  {isEditing ? "Save changes" : "Add Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branch;

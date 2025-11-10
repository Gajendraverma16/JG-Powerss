import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical } from "react-icons/tb";
import api from "../../api";
import Swal from "sweetalert2";

const Branch = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
   const [branches, setBranches] = useState([]);
 
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState({ branch_name: "" , branch_code : "" });
  const [editId, setEditId] = useState(null);


    // State for Add Status Modal
   
    const [newBranchData, setNewBranchData] = useState({
      status_name: "",
    });

const fetchBranches = useCallback(async () => {
    try {
      const response = await api.get("/branches");
      if (response.data.status) {
        setBranches(response.data.data); 
      } else {
        console.error("Failed to fetch branches:", response.data.message);
      }
    } catch (err) {
      console.error("Error fetching branches:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { branch_name , branch_code } = formData;

 
  // Handle Add / Edit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData_name || !formData_code ) return alert("Please fill all fields");

    if (isEditing) {
      setBranches((prev) =>
        prev.map((branch) =>
          branch.id === editId ? { ...branch, name: formData_name  , code: formData_code} : branch
        )
      );
    } else {
      const newbranch = {
      id: branches.length + 1,
        name: formData_name,
        code: formData_code,
      };
      setBranches([...branches, newbranch]);
    }

    handleCancel();
  };

  // Edit branch (open modal)
  const handleEdit = (branch) => {
    setFormData({ name: branch_name , code : branch_code });
    setEditId(branch.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  // Delete branch (with Swal confirm)
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
      setBranches((prev) => prev.filter((branch) => branch.id !== id));
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "branch has been removed.",
        confirmButtonColor: "#0e4053",
        timer: 1200,
        showConfirmButton: false,
      });
    }
    setActiveDropdown(null);
  };

  // Cancel Modal/Form
  const handleCancel = () => {
    setFormData({ name: "" });
    setEditId(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

    if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading...
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
              Branch
            </span>
          </h1>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setFormData({ name: "" , code :"" });
            }}
            className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] transition-colors hover:bg-[#ee7f1b]"
          >
            Add Branch
          </button>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50  border-white/30">
            <div
              className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
              onClick={handleCancel}
            />

            <div className="w-11/12 max-w-[600px] max-h-[90vh]  overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
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
                {isEditing ? "Edit branch" : "Add New branch"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Branch Name
                    </label>
                    <input
                        type="text"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        placeholder="Enter branch name"
                        required
                      />
                      <label className="block text-[#4B5563] text-[16px] mb-2">
                        Branch Code
                      </label>
                      <input
                        type="text"
                        name="branch_code"
                        value={formData.branch_code}
                        onChange={handleInputChange}
                        className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                        placeholder="Enter branch code"
                        required
                      />
                   
                  </div>
                </div>
                <div className="mt-10 flex justify-center">
                  <button
                    type="submit"
                    className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                  >
                    {isEditing ? "Save changes" : "Add branch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Responsive List: Desktop grid + Mobile cards (pattern copied from LeadsSettings) */}
        <div className="flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          {/* Desktop grid */}
          <div className="hidden md:block w-full flex-grow">
            <div className="w-full rounded-lg overflow-hidden">
              <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563]">
                <div className="font-medium text-sm text-left">Branch ID</div>
                   <div className="font-medium text-sm text-left">Branch Code</div>
                <div className="font-medium text-sm text-left">Branch Name</div>               
                <div className="font-medium text-sm text-left">Actions</div>
                <div /> {/* spacer */}
                <div /> {/* spacer */}
              </div>

              <div className="pb-20">
                {branches.length === 0 ? (
                  <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-8 text-center text-[#4B5563] border-b border-gray-200 items-center last:border-b-0">
                    <div className="lg:col-span-5">No branch available.</div>
                  </div>
                ) : (
                  branches.map((branch , index) => (
                    <div
                      key={branch.branch_id}
                      className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-4 border-b border-gray-200 items-center last:border-b-0 transition-colors"
                    >
                      <div className="text-sm text-[#4B5563] text-left">
                        {index + 1}
                      </div>
                       <div className="text-sm text-[#4B5563] text-left whitespace-nowrap">
                        {branch.branch_code}
                      </div>
                      <div className="text-sm text-[#4B5563] text-left whitespace-nowrap">
                        {branch.branch_name}
                      </div>
                     

                      <div className="relative text-left">
                        <button
                          onClick={() => toggleDropdown(branch.branch_id)}
                          className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full transition-colors"
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === branch.id && (
                          <div className="relative">
                            <div
                              ref={(el) => {
                                if (el) {
                                  el.scrollIntoView({
                                    behavior: "smooth",
                                    block: "nearest",
                                  });
                                }
                              }}
                              className="absolute left-0 w-24 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden"
                            >
                              <button
                                onClick={() => handleEdit(branch)}
                                className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
                              >
                                Edit
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
                                onClick={() => handleDelete(branch.branch_id)}
                                className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div /> {/* spacer */}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden w-full space-y-4 pb-32 flex-grow">
            {branches.length === 0 ? (
              <div className="py-8 px-6 text-center text-[#4B5563]">No branch available.</div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch.branch_id}
                  className="rounded-lg shadow p-4 border border-gray-200/80"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1 pr-2">
                        <p className="font-bold text-lg text-[#1F2837]">{branch.branch_name}</p>
                            <p className="font-bold text-lg text-[#1F2837]">{branch.branch_code}</p>
                        <p className="text-sm text-gray-500 break-all">ID: {branch.branch_id}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(branch.branch_id)}
                        className="p-2 text-[#4B5563] rounded-full hover:bg-gray-100"
                      >
                        <TbDotsVertical className="w-5 h-5" />
                      </button>
                      {activeDropdown === branch.branch_id && (
                        <div className="absolute right-0 mt-1 w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden">
                          <div
                            ref={(el) => {
                              if (el) {
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "nearest",
                                });
                              }
                            }}
                          >
                            <button
                              onClick={() => handleEdit(branch)}
                              className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
                            >
                              Edit
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
                              onClick={() => handleDelete(branch.branch_id)}
                              className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Branch;









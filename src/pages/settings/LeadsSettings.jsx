import React, { useCallback, useEffect, useState } from "react";
import { TbDotsVertical, TbSearch } from "react-icons/tb";
import Swal from "sweetalert2";
import api from "../../api";

const LeadSettings = () => {

  const [leadStatuses, setLeadStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState(false); 
  const [editingStatus, setEditingStatus] = useState(null);
  const [activeScreen, setActiveScreen] = useState("status");
  const [formData, setFormData] = useState({
    status_name: "",
  });

   const [newStatusData, setNewStatusData] = useState({
    status_name: "",
  });

  // pagination & search
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  // fetch lead statuses 
  const fetchLeadStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/showleadstatus");
      if (response.data?.success) {
        setLeadStatuses(response.data.data || []);
      } else {
         setLeadStatuses(response.data?.data || []);
       console.error("Failed to fetch Shop Owner Categories:", response.data.message);
      }
    } catch (err) {
           console.error("Error fetching Shop Owner Categories:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadStatuses();
  }, [fetchLeadStatuses]);

  // search handler
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleNewStatusChange = (e) => {
    const { name, value } = e.target;
    setNewStatusData((prev) => ({ ...prev, [name]: value }));
  };

  // filter using searchQuery 
  const filteredStatuses = leadStatuses.filter((status) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(status.status_name || status.name || "")
        .toLowerCase()
        .includes(q) ||
      String(status.status_id || status._id || "")
        .toLowerCase()
        .includes(q)
    );
  });

  // pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentData = filteredStatuses.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStatuses.length / rowsPerPage);

  // dropdown toggle
  const toggleDropdown = (statusId) => {
    setActiveDropdown((prev) => (prev === statusId ? null : statusId));
  };

  // open edit modal 
  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      status_name: status.status_name || status.name || "",
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  // close edit modal
  const closeEditModal = () => {
    setEditingStatus(null);
    setFormData({ status_name: "" });
    setIsModalOpen(false);
    setActiveDropdown(null);
  };

  // submit edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingStatus) return;

    const formattedData = {
      name: formData.status_name,
    };

    try {
      const response = await api.post(
        `/updateleadstatus/${editingStatus.status_id || editingStatus._id}`,
        formattedData
      );
      if (response.data?.success) {
        setIsModalOpen(false);
        await Swal.fire({
          icon: "success",
          title: "Categories Updated",
          text: `${formData.status_name} was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
        fetchLeadStatuses();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: response.data?.message || "Failed to update Categories.",
          confirmButtonColor: "#DD6B55",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err?.message || "An error occurred while updating the Categories.",
        confirmButtonColor: "#DD6B55",
      });
    }
    setActiveDropdown(null);
  };
 
  // add status submit 
  const handleAddStatusSubmit = async (e) => {
    e.preventDefault();
    const loadingAlert = Swal.fire({
      title: "Adding Status...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const formattedData = {
      name: newStatusData.status_name,
    };

    try {
      const response = await api.post("/addleadstatus", formattedData);
      await loadingAlert.close();

      if (response.data?.success) {
        setIsAddStatusModalOpen(false);
        setNewStatusData({ status_name: "" });
        await Swal.fire({
          icon: "success",
          title: "Categories Added!",
          text: `${formattedData.name} has been successfully added.`,
          confirmButtonColor: "#0e4053",
        });
        fetchLeadStatuses();
      } else {
        throw new Error(response.data?.message || "Failed to add Categories.");
      }
    } catch (err) {
      await loadingAlert.close();
      Swal.fire({
        icon: "error",
        title: "Add Failed",
        text: err?.message || "An error occurred while adding the Categories.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  // delete 
  const handleDelete = async (statusId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This Categories will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await api.get(`/deletestatus/${statusId}`);
      
        if (!response.data?.success) {
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Categories has been removed.",
            confirmButtonColor: "#0e4053",
          });
          fetchLeadStatuses();
        } else {
          throw new Error(response.data?.message || "Failed to delete Categories.");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err?.message || "An error occurred while deleting the Categories.",
          confirmButtonColor: "#DD6B55",
        });
      }
    }
    setActiveDropdown(null);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full h-auto min-h-[300px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Title */}
        <div className="flex gap-6">
           <h2
              className={`text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap pb-1 ${
                activeScreen === "Shop Owner Categories"
                  ? "border-b-2 border-[#0e4053]"
                  : "border-b-2 border-transparent"
              }`}
            >
               Categories
            </h2>
          {/* <button
            onClick={() => setActiveScreen("Shop Owner Categories")}
            className="focus:outline-none"
          >
            <h2
              className={`text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap pb-1 ${
                activeScreen === "Shop Owner Categories"
                  ? "border-b-2 border-[#0e4053]"
                  : "border-b-2 border-transparent"
              }`}
            >
              Shop Owner Categories
            </h2>
          </button> */}
          {/* <button
            onClick={() => setActiveScreen("googleSheet")}
            className="focus:outline-none"
          >
            <h2
              className={`text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap pb-1 ${
                activeScreen === "googleSheet"
                  ? "border-b-2 border-[#0e4053]"
                  : "border-b-2 border-transparent"
              }`}
            >
              Google Sheet
            </h2>
          </button> */}
        </div>

        {activeScreen === "status" ? (
          <div className="flex items-center gap-3 md:gap-4">
            {/* Add Status button - user didn't specify, but often needed */}
            <button
              onClick={() => setIsAddStatusModalOpen(true)}
              className="hover:bg-[#004B8D] bg-[#003A72] text-white h-[44px] px-8 rounded-[8px] flex items-center justify-center"
            >
              Add Categories
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 md:gap-4">
            {/* No additional buttons needed for Google Sheet view */}
          </div>
        )}
      </div>

      {/* Desktop Table */}
        <div className="hidden md:block flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] p-4">
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] font-medium text-sm">
            <div>Categories ID</div>
            <div>Categories Name</div>
            <div>Actions</div>
          </div>

          <div className="pb-6">
            {leadStatuses.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No categories available.</div>
            ) : filteredStatuses.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No categories found matching "{searchQuery}"
              </div>
            ) : (
              currentData.map((status) => (
                <div
                  key={status.status_id || status._id}
                  className="grid md:grid-cols-[1fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center"
                >
                  <div>{status._id || status.status_id}</div>
                  <div>{status.status_name || status.name}</div>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(status.status_id || status._id)}
                      className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                    >
                      <TbDotsVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === (status.status_id || status._id) && (
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
                            onClick={() => handleEdit(status)}
                            className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors first:rounded-t-md"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              className="mr-2 w-4 h-4 fill-current text-[#4B5563] group-hover:text-white transition-colors"
                            >
                              <path
                                fill="currentColor"
                                d="M4 14v-2h7v2zm0-4V8h11v2zm0-4V4h11v2zm9 14v-3.075l6.575-6.55l3.075 3.05L16.075 20zm7.5-6.575l-.925-.925zm-6 5.075h.95l3.025-3.05l-.45-.475l-.475-.45l-3.05 3.025zm3.525-3.525l-.475-.45l.925.925z"
                              />
                            </svg>
                            <span className="group-hover:text-white transition-colors">
                              Edit
                            </span>
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
                            onClick={() => handleDelete(status.status_id || status._id)}
                            className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#004B8D] w-full transition-colors last:rounded-b-md"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              className="mr-2 w-4 h-4 fill-current text-[#4B5463] group-hover:text-white transition-colors"
                            >
                              <path
                                fill="currentColor"
                                d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
                              />
                            </svg>
                            <span className="group-hover:text-white transition-colors">
                              Delete
                            </span>
                          </button>
                        </div>
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
          {currentData.map((status) => (
            <div
              key={status.status_id || status._id}
              className="p-4 rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF] shadow-sm relative"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-[#1F2837] text-[18px]">
                    {status.status_name || status.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {status._id || status.status_id}
                  </p>
                </div>
                <button
                  onClick={() => toggleDropdown(status.status_id || status._id)}
                  className="p-1 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full"
                >
                  <TbDotsVertical className="w-5 h-5" />
                </button>
                {activeDropdown === (status.status_id || status._id) && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(status)}
                      className="px-3 py-1 text-sm rounded-md bg-[#003A72] text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(status.status_id || status._id)}
                      className="px-3 py-1 text-sm rounded-md bg-gray-300 text-[#1F2837]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
          </div>
          ))}
        </div>

      {/* Pagination bottom */}
      {filteredStatuses.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6">
          <div className="text-sm text-gray-600 mb-3 md:mb-0">
            Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredStatuses.length)} of{" "}
            {filteredStatuses.length} entries
            {searchQuery && ` (filtered from ${leadStatuses.length} total)`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 border-white/30">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          <div className="w-11/12 max-w-[600px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1L1 13" stroke="#1F2837" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 1L13 13" stroke="#1F2837" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">Edit Categories</h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">Categories ID</label>
                  <input
                    type="text"
                    value={editingStatus?.status_id || editingStatus?._id || ""}
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 text-[#545454] focus:ring-2 focus:ring-[#0e4053] outline-none cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">Categories Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="status_name"
                      value={formData.status_name}
                      onChange={(e) => setFormData((p) => ({ ...p, status_name: e.target.value }))}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2">
                      {/* small edit icon (SVG) */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6B7280" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Status Modal  */}
      {isAddStatusModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 border-white/30">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={() => {
              setIsAddStatusModalOpen(false);
              setNewStatusData({ status_name: "" });
            }}
          />
          <div className="w-11/12 max-w-[600px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={() => {
                setIsAddStatusModalOpen(false);
                setNewStatusData({ status_name: "" });
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1L1 13" stroke="#1F2837" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 1L13 13" stroke="#1F2837" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">Add New Categories</h2>

            <form onSubmit={handleAddStatusSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">Categories Name</label>
                  <input
                    type="text"
                    name="status_name"
                    value={newStatusData.status_name}
                    onChange={handleNewStatusChange}
                    placeholder="Enter Categories name"
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    required
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
                >
                  Add Categories
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSettings;



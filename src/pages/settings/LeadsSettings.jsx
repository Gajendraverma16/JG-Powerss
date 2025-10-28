import React, { useState, useEffect, useCallback } from "react";
import { TbDotsVertical } from "react-icons/tb";
import { FiEdit } from "react-icons/fi";
import api from "../../api";
import Swal from "sweetalert2";

const LeadSettings = () => {
  const [activeScreen, setActiveScreen] = useState("status"); // 'status' or 'googleSheet'
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [formData, setFormData] = useState({
    status_name: "",
  });
  const [googleSheetLink, setGoogleSheetLink] = useState("");

  // State for Add Status Modal
  const [isAddStatusModalOpen, setIsAddStatusModalOpen] = useState(false);
  const [newStatusData, setNewStatusData] = useState({
    status_name: "",
  });

  const fetchLeadStatuses = useCallback(async () => {
    try {
      const response = await api.get("/showleadstatus");
      if (response.data.success) {
        setLeadStatuses(response.data.data);
      } else {
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

  const toggleDropdown = (statusId) => {
    setActiveDropdown(activeDropdown === statusId ? null : statusId);
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      status_name: status.status_name,
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewStatusChange = (e) => {
    const { name, value } = e.target;
    setNewStatusData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseAddStatusModal = () => {
    setIsAddStatusModalOpen(false);
    setNewStatusData({ status_name: "" }); // Reset the form data
  };

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

      if (response.data.success) {
        handleCloseAddStatusModal();
        await Swal.fire({
          icon: "success",
          title: "Shop Owner Categories Added!",
          text: `${newStatusData.status_name} has been successfully added.`, // Corrected text
          confirmButtonColor: "#0e4053",
        });
        fetchLeadStatuses(); // Refetch statuses after adding
      } else {
        throw new Error(response.data.message || "Failed to add Shop Owner Categories.");
      }
    } catch (err) {
      await loadingAlert.close();
      Swal.fire({
        icon: "error",
        title: "Add Failed",
        text: err.message || "An error occurred while adding the Shop Owner Categories.",
        confirmButtonColor: "#DD6B55",
      });
    }
  };

  const handleDelete = async (statusId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This Shop Owner Categories will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await api.get(`/deletestatus/${statusId}`);
        if (!response.data.success) {
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Shop Owner Categories has been removed.",
            confirmButtonColor: "#0e4053",
          });
          fetchLeadStatuses(); // Refetch statuses after deleting
        } else {
          throw new Error(response.data.message || "Failed to delete Shop Owner Categories.");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.message || "An error occurred while deleting the Shop Owner Categories.",
          confirmButtonColor: "#DD6B55",
        });
      }
    }
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingStatus) return;

    const formattedData = {
      name: formData.status_name,
    };

    try {
      const response = await api.post(
        `/updateleadstatus/${editingStatus.status_id}`,
        formattedData
      );
      if (response.data.success) {
        setIsModalOpen(false);
        await Swal.fire({
          icon: "success",
          title: "Shop Owner Categories Updated",
          text: `${formData.status_name} was successfully updated.`,
          confirmButtonColor: "#0e4053",
        });
        fetchLeadStatuses(); // Refetch statuses after updating
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: response.data.message || "Failed to update Shop Owner Categories.",
          confirmButtonColor: "#DD6B55",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "An error occurred while updating the Shop Owner Categories.",
        confirmButtonColor: "#DD6B55",
      });
    }
    setActiveDropdown(null);
  };

  // const handleGoogleSheetSubmit = async (e) => {
  //   e.preventDefault();
  //   const loadingAlert = Swal.fire({
  //     title: "Importing Google Sheet...",
  //     allowOutsideClick: false,
  //     didOpen: () => {
  //       Swal.showLoading();
  //     },
  //   });

  //   try {
  //     const response = await api.post("/google-sheet", {
  //       sheet_url: googleSheetLink,
  //     });
  //     await loadingAlert.close();

  //     if (response.data.success) {
  //       await Swal.fire({
  //         icon: "success",
  //         title: "Sheet Imported!",
  //         text: response.data.message || "Google Sheet imported successfully.",
  //         confirmButtonColor: "#0e4053",
  //       });
  //       setGoogleSheetLink(""); // Clear the input
  //     } else {
  //       throw new Error(response.data.message || "Failed to import sheet.");
  //     }
  //   } catch (err) {
  //     await loadingAlert.close();
  //     Swal.fire({
  //       icon: "error",
  //       title: "Import Failed",
  //       text: err.message || "An error occurred while importing the sheet.",
  //       confirmButtonColor: "#DD6B55",
  //     });
  //   }
  // };

  // const handleDownloadSample = async () => {
  //   const loadingAlert = Swal.fire({
  //     title: "Downloading Sample...",
  //     allowOutsideClick: false,
  //     didOpen: () => {
  //       Swal.showLoading();
  //     },
  //   });
  //   try {
  //     const response = await api.get("/sheet-sample-download", {
  //       responseType: "blob", // Important for downloading files
  //     });
  //     await loadingAlert.close();

  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", "sample_sheet.csv"); // Or get filename from Content-Disposition header
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();

  //     Swal.fire({
  //       icon: "success",
  //       title: "Download Initiated",
  //       text: "Your sample file download should begin shortly.",
  //       confirmButtonColor: "#0e4053",
  //     });
  //   } catch (err) {
  //     await loadingAlert.close();
  //     Swal.fire({
  //       icon: "error",
  //       title: "Download Failed",
  //       text:
  //         err.response?.data?.message ||
  //         "An error occurred while downloading the sample file.",
  //       confirmButtonColor: "#DD6B55",
  //     });
  //   }
  // };

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
              className="hover:bg-[#ee7f1b] bg-[#ef7e1b] text-white h-[44px] px-8 rounded-[8px] flex items-center justify-center"
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

      {activeScreen === "status" ? (
        <>
          {/* Status List Table (Desktop) */}
          <div className="hidden md:block w-full flex-grow">
            <div className="w-full rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563]">
                <div className="font-medium text-sm text-left">Categories ID</div>
                <div className="font-medium text-sm text-left">Categories Name</div>
                <div className="font-medium text-sm text-left">Actions</div>
                <div /> {/* Empty header for spacing */}
                <div /> {/* New empty column */}
              </div>

              {/* Body */}
              <div className="pb-20">
                {leadStatuses?.length === 0 ? (
                  <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-8 text-center text-[#4B5563] border-b border-gray-200 items-center last:border-b-0  transition-colors">
                    <div className="lg:col-span-5">
                      No Categories available.
                    </div>{" "}
                    {/* Adjusted colspan for the new grid */}
                  </div>
                ) : (
                  leadStatuses?.map((status) => (
                    <div
                      key={status.status_id}
                      className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-4 border-b border-gray-200 items-center last:border-b-0  transition-colors"
                    >
                      <div className="text-sm text-[#4B5563] text-left">
                        {status.status_id}
                      </div>
                      <div className="text-sm text-[#4B5563] text-left whitespace-nowrap">
                        {status.status_name}
                      </div>
                      <div className="relative text-left">
                        {" "}
                        {/* Removed flex justify-center for left alignment */}
                        <button
                          onClick={() => toggleDropdown(status.status_id)}
                          className="p-2 text-[#4B5563] hover:bg-Duskwood-200  rounded-full transition-colors"
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === status.status_id && (
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
                              {" "}
                              {/* Aligned dropdown to the left */}
                              <button
                                onClick={() => handleEdit(status)}
                                className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
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
                                <polygon
                                  points="0,0 50,1 100,0"
                                  fill="#E5E7EB"
                                />
                              </svg>
                              <button
                                onClick={() => handleDelete(status.status_id)}
                                className="group flex items-center px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
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
                      <div /> {/* New empty column */}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Status List Cards (Mobile) */}
          <div className="md:hidden w-full space-y-4 pb-32 flex-grow">
            {leadStatuses?.length === 0 ? (
              <div className="py-8 px-6 text-center text-[#4B5563]">
                No lead statuses available.
              </div>
            ) : (
              leadStatuses?.map((status) => (
                <div
                  key={status.status_id}
                  className="rounded-lg shadow p-4 border border-gray-200/80"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1 pr-2">
                        <p className="font-bold text-lg text-[#1F2837]">
                          {status.status_name}
                        </p>
                        <p className="text-sm text-gray-500 break-all">
                          ID: {status.status_id}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(status.status_id)}
                        className="p-2 text-[#4B5563] rounded-full hover:bg-gray-100"
                      >
                        <TbDotsVertical className="w-5 h-5" />
                      </button>
                      {activeDropdown === status.status_id && (
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
                              className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors first:rounded-t-md"
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
                              onClick={() => handleDelete(status.status_id)}
                              className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full transition-colors last:rounded-b-md"
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
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="w-full flex-grow">
          {/* <form  className="space-y-5">
            <label
              htmlFor="googleSheetLink"
              className="block text-[#4B5563] text-[16px] mb-2"
            >
              Google Sheet Link
            </label>
            <input
              type="url"
              id="googleSheetLink"
              name="googleSheetLink"
              value={googleSheetLink}
              onChange={(e) => setGoogleSheetLink(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/2PACX-XXXXX/pub?output=csv"
              className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              required
            />
            <div className="flex justify-between items-center ">
              <p className="text-[10px] sm:text-sm lg:text-sm text-gray-500 w- ">
                Publish your spreadsheet to the web in CSV format (e.g., File →
                Share → Publish to web → Select CSV) <br /> and ensure it’s
                publicly viewable or shared with the service account.
              </p>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-[11px] sm:text-sm lg:text-base text-[#ef7e1b] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e4053] rounded-md px-2 py-1 transition-colors duration-200 whitespace-nowrap"
              >
                Download Sample File
              </button>
            </div>
            <button
              type="submit"
              className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
            >
              Import Sheet
            </button>
          </form> */}
        </div>
      )}

      {/* Edit Status Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="w-11/12 max-w-[600px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
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
              Edit  Categories
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                    Categories ID
                  </label>
                  <input
                    type="text"
                    value={editingStatus?.status_id || ""}
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 text-[#545454] focus:ring-2 focus:ring-[#0e4053] outline-none cursor-not-allowed"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                     Categories Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="status_name"
                      value={formData.status_name}
                      onChange={handleInputChange}
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2">
                      <FiEdit className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="submit"
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Status Modal */}
      {isAddStatusModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm border border-white/30"
            onClick={handleCloseAddStatusModal}
          />
          <div className="w-11/12 max-w-[600px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={handleCloseAddStatusModal}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
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
              Add New Categories
            </h2>
            <form onSubmit={handleAddStatusSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[#4B5563] text-[16px] mb-2">
                     Categories Name
                  </label>
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
                  className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition-colors"
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

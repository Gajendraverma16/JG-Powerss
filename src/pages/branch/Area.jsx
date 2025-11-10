
import React, { useState } from "react";
import { TbDotsVertical } from "react-icons/tb";
import Swal from "sweetalert2";

const Area = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [areas, setareas] = useState([
    { id: 1, name: "Indore"  , branch: "East Branch" ,route : "1"},
    { id: 2, name: "Bhopal",branch: "Main Branch"  ,route : "2" },
  ]);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState({ name: "", branch: "" ,route : "" });
  const [editId, setEditId] = useState(null);

  // Handle Add / Edit
  const handleSubmit = (e) => {
    e.preventDefault();
    if ( !formData.branch ||  
       !formData.route || !formData.name  ) return alert("Please fill all fields");

    if (isEditing) {
      setareas((prev) =>
        prev.map((area) =>
          area.id === editId ? { ...area, name: formData.name } : area
        )
      );
    } else {
      const newarea = {
        id: areas.length + 1,
        name: formData.name,
           branch: formData.branch,
            route: formData.route,
      };
      setareas([...areas, newarea]);
    }

    handleCancel();
  };

  // Edit area (open modal)
  const handleEdit = (area) => {
    setFormData({ name: area.name , branch: area.branch  , route: area.route });
    setEditId(area.id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  // Delete area (with Swal confirm)
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
      setareas((prev) => prev.filter((area) => area.id !== id));
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "area has been removed.",
        confirmButtonColor: "#0e4053",
        timer: 1200,
        showConfirmButton: false,
      });
    }
    setActiveDropdown(null);
  };

  // Cancel Modal/Form
  const handleCancel = () => {
    setFormData({ name: "", branch: "", route: ""  });
    setEditId(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto flex min-h-[440px] max-w-5xl flex-col rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E7F4FF] p-6 shadow-[0px_20px_45px_rgba(20,84,182,0.08)] md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-row gap-3 items-center justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Areas
            </span>
          </h1>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setFormData({ name: "" , branch: "", route: ""});
            }}
            className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] transition-colors hover:bg-[#ee7f1b]"
          >
            Add Area
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
                {isEditing ? "Edit area" : "Add New area"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[#4B5563] text-[16px] mb-2">
                      Area Name
                    </label>
                       <select
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                      required
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none"
                    >
                      <option value="">Select Branch </option>
                      <option value="Main Branch">Main Branch</option>
                      <option value="East Branch">East Branch</option>
                      <option value="West Branch">West Branch</option>
                      <option value="South Branch">South Branch</option>
                    </select>
                           <select
                      value={formData.route}
                      onChange={(e) =>
                        setFormData({ ...formData, route: e.target.value })
                      }
                      required
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none"
                    >
                      <option value="">Select Route </option>
                      <option value="Main Branch">1</option>
                      <option value="East Branch">2</option>
                      <option value="West Branch">3</option>
                      <option value="South Branch">4</option>
                    </select>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
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
                    {isEditing ? "Save changes" : "Add area"}
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
              <div className="font-medium text-sm text-left">Branch</div>
               <div className="font-medium text-sm text-left">Route</div>
                <div className="font-medium text-sm text-left">Area ID</div>
                <div className="font-medium text-sm text-left">Area Name</div>
                <div className="font-medium text-sm text-left">Actions</div>
                <div /> {/* spacer */}
                <div /> {/* spacer */}
              </div>

              <div className="pb-20">
                {areas?.length === 0 ? (
                  <div className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-8 text-center text-[#4B5563] border-b border-gray-200 items-center last:border-b-0">
                    <div className="lg:col-span-5">No area available.</div>
                  </div>
                ) : (
                  areas.map((area , index) => (
                    <div
                      key={area.id}
                      className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto_1fr] gap-x-4 px-6 py-4 border-b border-gray-200 items-center last:border-b-0 transition-colors"
                    >
                      
                      <div className="text-sm text-[#4B5563] text-left">
                        {area.branch}
                      </div>
                      
                      <div className="text-sm text-[#4B5563] text-left">
                        {area.route}
                      </div>
                      <div className="text-sm text-[#4B5563] text-left">
                        {index + 1}
                      </div>
                      <div className="text-sm text-[#4B5563] text-left whitespace-nowrap">
                        {area.name}
                      </div>

                      <div className="relative text-left">
                        <button
                          onClick={() => toggleDropdown(area.id)}
                          className="p-2 text-[#4B5563] hover:bg-[#F1F5FB] rounded-full transition-colors"
                        >
                          <TbDotsVertical className="w-4 h-4" />
                        </button>
                           {activeDropdown === area.id && (
                          <div className="absolute left-0 w-24 rounded-md shadow-md bg-white z-10">
                            <button
                              onClick={() => handleEdit(area)}
                              className="px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full text-left"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(area.id)}
                              className="px-2 py-1 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full text-left"
                            >
                              Delete
                            </button>
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
            {areas.length === 0 ? (
              <div className="py-8 px-6 text-center text-[#4B5563]">No area available.</div>
            ) : (
              areas.map((area , index) => (
                <div
                  key={area.id}
                  className="rounded-lg shadow p-4 border border-gray-200/80"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1 pr-2">
                        <p className="font-bold text-lg text-[#1F2837]">{area.name}</p>
                        <p className="text-sm text-gray-500">
                          Branch: {area.branch}
                        </p>
                        <p className="text-sm text-gray-500">
                          Route: {area.route}
                        </p>
                        <p className="text-sm text-gray-500 break-all">ID: {index + 1}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(area.id)}
                        className="p-2 text-[#4B5563] rounded-full hover:bg-gray-100"
                      >
                        <TbDotsVertical className="w-5 h-5" />
                      </button>
                         {activeDropdown === area.id && (
                        <div className="absolute right-0 mt-1 w-28 rounded-md shadow-md bg-white z-20">
                          <button
                            onClick={() => handleEdit(area)}
                            className="px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full text-left"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(area.id)}
                            className="px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] w-full text-left"
                          >
                            Delete
                          </button>
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

export default Area;

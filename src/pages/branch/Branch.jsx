import React, { useState } from "react";
import { TbDotsVertical } from "react-icons/tb";

const Branch = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [branches, setBranches] = useState([
    { id: 1, name: "Sales Branch"},
    { id: 2, name: "Marketing Branch" },
  ]);

  const [formData, setFormData] = useState({ name: "" });
  const [editId, setEditId] = useState(null);

  // Handle Add / Edit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name ) return alert("Please fill all fields");

    if (isEditing) {
      setBranches((prev) =>
        prev.map((branch) =>
          branch.id === editId ? { ...branch, name: formData.name } : branch
        )
      );
    } else {
      const newBranch = {
        id: Date.now(),
        name: formData.name,
      
      };
      setBranches([...branches, newBranch]);
    }

    handleCancel();
  };

  // Edit Branch
  const handleEdit = (branch) => {
    setFormData({ name: branch.name });
    setEditId(branch.id);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  // Delete Branch
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      setBranches(branches.filter((branch) => branch.id !== id));
    }
  };

  // Cancel Form
  const handleCancel = () => {
    setFormData({ name: ""});
    setEditId(null);
    setIsEditing(false);
    setIsFormOpen(false);
  };

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto flex min-h-[440px] max-w-5xl flex-col rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E7F4FF] p-6 shadow-[0px_20px_45px_rgba(20,84,182,0.08)] md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">
              Branch
            </span>
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(true);
              setIsEditing(false);
              setFormData({ name: ""});
            }}
            className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] transition-colors hover:bg-[#ee7f1b]"
          >
            Add Branch
          </button>
        </div>

        {/* Add/Edit Form */}
        {isFormOpen && (
          <div className="mb-6 rounded-[12px] border border-[#E3ECF7] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#1F2837]">
              {isEditing ? "Edit Branch" : "Add New Branch"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 md:flex-row md:items-end"
            >
              <div className="flex flex-col w-full md:w-1/2">
                <label className="text-sm font-medium text-[#4B5563] mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-[8px] border border-[#E3ECF7] p-2 outline-none focus:ring-2 focus:ring-[#ef7e1b]"
                  placeholder="Enter branch name"
                />
              </div>
            

              <div className="flex gap-3 md:gap-4">
                <button
                  type="submit"
                  className="mt-3 md:mt-0 h-[44px] w-full md:w-auto rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow hover:bg-[#ee7f1b] transition-colors"
                >
                  {isEditing ? "Update Branch" : "Save Branch"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-3 md:mt-0 h-[44px] w-full md:w-auto rounded-[10px] border border-gray-300 px-6 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-2/4" />
              <col className="w-1/4" />
              <col className="w-1/4" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#DFE8F6] text-left text-[#4B5563]">
                <th className="py-4 px-6 text-sm font-medium">Branch</th>
                              <th className="py-4 px-6 text-sm font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-12 px-6 text-center text-sm font-medium text-[#6B7280]"
                  >
                    No Branch available.
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-b border-[#E9F1FF] text-[#1F2837] last:border-b-0"
                  >
                    <td className="whitespace-nowrap py-5 px-6 text-sm font-medium">
                      {branch.name}
                    </td>
                  
                    <td className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="h-[34px] rounded-[8px] border border-[#E3ECF7] px-4 text-sm font-medium text-[#1F2837] hover:bg-[#F1F5FB]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="h-[34px] rounded-[8px] border border-[#E3ECF7] px-4 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Branch;










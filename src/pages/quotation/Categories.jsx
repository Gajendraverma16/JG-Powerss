import React, { useState, useEffect, useCallback } from "react";
import { TbDotsVertical } from "react-icons/tb";
import { FiEdit } from "react-icons/fi";
import api from "../../api";
import Swal from "sweetalert2";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    is_active: true,
  });

  const [newCategory, setNewCategory] = useState({
    category_name: "",
    description: "",
    is_active: true,
  });

  // =============================
  // READ
  // =============================
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      if (res.data?.success) {
        setCategories(res.data.data || []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  // =============================
  // CREATE
  // =============================
  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCategory((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.category_name.trim()) {
      return Swal.fire("Error", "Category name is required", "warning");
    }

    const loadingAlert = Swal.fire({
      title: "Adding Category...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await api.post("/categories", newCategory);
      await loadingAlert.close();

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Category created successfully.",
          confirmButtonColor: "#0e4053",
        });
        setIsAddModalOpen(false);
        setNewCategory({ category_name: "", description: "", is_active: true });
        fetchCategories();
      } else {
        throw new Error(res.data?.message || "Failed to add category");
      }
    } catch (err) {
      await loadingAlert.close();
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  // =============================
  // UPDATE
  // =============================
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name || "",
      description: category.description || "",
      is_active: category.is_active ?? true,
    });
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    const loadingAlert = Swal.fire({
      title: "Updating Category...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await api.post(`/categories/${editingCategory.id}`, formData);
      await loadingAlert.close();

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Category updated successfully.",
          confirmButtonColor: "#0e4053",
        });
        setIsEditModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        throw new Error(res.data?.message || "Failed to update category");
      }
    } catch (err) {
      await loadingAlert.close();
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  // =============================
  // DELETE
  // =============================
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}" permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data?.success) {
        Swal.fire("Deleted!", "Category deleted successfully.", "success");
        fetchCategories();
      } else {
        throw new Error(res.data?.message || "Failed to delete category");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    } finally {
      setActiveDropdown(null);
    }
  };

  // =============================
  // UI
  // =============================
  if (loading)
    return (
      <div className="w-full min-h-[797px] flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="w-full h-auto min-h-[300px] p-4 md:p-6 bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-[22px] font-medium text-[#1F2837]"> Product Categories</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hover:bg-[#ee7f1b] bg-[#ef7e1b] text-white h-[44px] px-8 rounded-[8px]"
        >
          Add Product Category
        </button>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block w-full flex-grow">
        <div className="w-full rounded-lg overflow-hidden">
          <div className="grid md:grid-cols-[1fr_2fr_2fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 text-[#4B5563] bg-[#ef7e1b] text-white font-medium">
            <div>ID</div>
            <div>Name</div>
            <div>Description</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          <div className="pb-20">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No  Product Categories found.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid md:grid-cols-[1fr_2fr_2fr_1fr_auto] gap-x-4 px-6 py-4 border-b border-gray-200 items-center hover:bg-[#E7EFF8] transition"
                >
                  <div>{cat.id}</div>
                  <div>{cat.category_name}</div>
                  <div>{cat.description || "—"}</div>
                  <div>{cat.is_active ? "Active" : "Inactive"}</div>
                  <div className="relative text-left">
                    <button
                      onClick={() => toggleDropdown(cat.id)}
                      className="p-2 text-[#4B5563] rounded-full hover:bg-gray-100"
                    >
                      <TbDotsVertical className="w-4 h-4" />
                    </button>
                    {activeDropdown === cat.id && (
                      <div className="absolute right-0 mt-2 w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-10 overflow-hidden">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] hover:text-white w-full transition-colors"
                        >
                          <FiEdit className="mr-2" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.category_name)}
                          className="group flex items-center px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] hover:text-white w-full transition-colors"
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-lg shadow p-4 border border-gray-200 bg-white"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{cat.category_name}</h3>
                <p className="text-sm text-gray-600">ID: {cat.id}</p>
                <p className="text-sm text-gray-500">
                  {cat.description || "—"}
                </p>
                <p className="text-sm mt-1">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      cat.is_active ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown(cat.id)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <TbDotsVertical className="w-5 h-5 text-gray-600" />
                </button>
                {activeDropdown === cat.id && (
                  <div className="absolute right-0 mt-1 w-28 rounded-md shadow-md bg-gradient-to-br from-white to-[#E7F4FF] z-20 overflow-hidden">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="block w-full px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.category_name)}
                      className="block w-full px-3 py-2 text-sm text-[#4B5563] hover:bg-[#ee7f1b] hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="w-11/12 max-w-[600px] p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-xl relative z-10">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500"
            >
              ✕
            </button>
            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              Add Product Category
            </h2>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#4B5563] mb-1">
                    Category Name
                  </label>
                  <input
                    name="category_name"
                    value={newCategory.category_name}
                    onChange={handleAddChange}
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#4B5563] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory.description}
                    onChange={handleAddChange}
                    className="w-full h-[80px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={newCategory.is_active}
                    onChange={handleAddChange}
                  />
                  <label>Active</label>
                </div>
                <div className="flex justify-center mt-10">
                  <button
                    type="submit"
                    className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition"
                  >
                    Add Product Category
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-gray-50/10 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="w-11/12 max-w-[600px] p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-xl relative z-10">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500"
            >
              ✕
            </button>
            <h2 className="text-[29px] font-medium text-[#1F2837] mb-8">
              Edit Category
            </h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#4B5563] mb-1">
                    Category Name
                  </label>
                  <input
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleEditChange}
                    className="w-full h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#4B5563] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleEditChange}
                    className="w-full h-[80px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleEditChange}
                  />
                  <label>Active</label>
                </div>
                <div className="flex justify-center mt-10">
                  <button
                    type="submit"
                    className="w-[207px] h-[46px] bg-[#ef7e1b] text-white rounded-[10px] hover:bg-[#ee7f1b] transition"
                  >
                    Update Category
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

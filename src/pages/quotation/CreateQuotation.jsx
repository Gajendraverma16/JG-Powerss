import React, { useState, useEffect, useContext } from "react";
import api from "../../api";
import Swal from "sweetalert2";
import { SidebarContext } from "../../components/Layout";

const CreateQuotation = () => {
  const { isCollapsed } = useContext(SidebarContext);

  const [formData, setFormData] = useState({
    item_name: "",
    sku: "",
    regular_price: "",
    sale_price: "",
    quantity: "",
    item_points: "",
    category_id: "",
    is_refundable: true,
    is_exchangeable: true,
    is_active: true,
    product_image: null,
    gallery_images: [],
    slug: "",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch all categories for dropdown
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data?.success) {
        setCategories(res.data.data || []);   
      } else {
        setCategories([]);
        console.error("Failed to fetch categories:", res.data?.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };
    
  fetchCategories();
}, []);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, product_image: file });
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) setFormData({ ...formData, gallery_images: files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      "item_name",
      "sku",
      "regular_price",
      "sale_price",
      "quantity",
      "item_points",
      "product_image",
      "category_id",
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        Swal.fire({
          icon: "warning",
          title: "Missing Fields",
          text: `Please fill in ${field.replace("_", " ")}.`,
          confirmButtonColor: "#0e4053",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "gallery_images") {
          formData.gallery_images.forEach((file) =>
            payload.append("gallery_images[]", file)
          );
        } else if (key === "slug") {
          payload.append(
            "slug",
            formData.slug || formData.item_name.toLowerCase().replace(/\s+/g, "-")
          );
        } else if (["is_refundable", "is_exchangeable", "is_active"].includes(key)) {
          payload.append(key, formData[key] ? 1 : 0);
        } else if (key === "product_image") {
          payload.append("product_image", formData.product_image);
        } else {
          payload.append(key, formData[key]);
        }
      });

      const response = await api.post("/products", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Product Added",
          text: `${formData.item_name} added successfully!`,
          confirmButtonColor: "#0e4053",
        });
        setFormData({
          item_name: "",
          sku: "",
          regular_price: "",
          sale_price: "",
          quantity: "",
          item_points: "",
          category_id: "",
          is_refundable: true,
          is_exchangeable: true,
          is_active: true,
          product_image: null,
          gallery_images: [],
          slug: "",
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Swal.fire({
        icon: "error",
        title: "Error Adding Product",
        text: error.response?.data?.message || error.message,
        confirmButtonColor: "#DD6B55",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-[797px] p-4 sm:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full ${
        isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
      } md:mx-auto overflow-auto`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 sm:gap-0">
        <h1 className="text-[22px] font-medium text-[#1F2837]">Add New Product</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-2xl p-4 sm:p-6 w-full max-w-lg mx-auto space-y-4 sm:space-y-6"
      >
        {/* Category Dropdown */}
        <div>
          <label className="block text-[#4B5563] text-[16px] mb-2">Select Product Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
          >
            <option value="">Select Product Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-[#4B5563] text-[16px] mb-2">Item Name</label>
          <input
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={handleInputChange}
            placeholder="Enter item name"
            className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-[#4B5563] text-[16px] mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            placeholder="Enter SKU"
            className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#4B5563] text-[16px] mb-2">Regular Price</label>
            <input
              type="number"
              name="regular_price"
              value={formData.regular_price}
              onChange={handleInputChange}
              placeholder="Enter regular price"
              className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
            />
          </div>
          <div>
            <label className="block text-[#4B5563] text-[16px] mb-2">Sale Price</label>
            <input
              type="number"
              name="sale_price"
              value={formData.sale_price}
              onChange={handleInputChange}
              placeholder="Enter sale price"
              className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
            />
          </div>
        </div>

        {/* Quantity & Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#4B5563] text-[16px] mb-2">Stock Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
            />
          </div>
          <div>
            <label className="block text-[#4B5563] text-[16px] mb-2">Points</label>
            <input
              type="number"
              name="item_points"
              value={formData.item_points}
              onChange={handleInputChange}
              placeholder="Enter points"
              className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
            />
          </div>
        </div>

        {/* Product Image */}
        <div>
          <label className="block text-[#4B5563] text-[16px] mb-2">Upload Product Image</label>
          <input type="file" accept="image/*" onChange={handleProductImageChange} className="w-full" />
        </div>

        {/* Gallery Images */}
        <div>
          <label className="block text-[#4B5563] text-[16px] mb-2">Upload Gallery Images</label>
          <input type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} className="w-full" />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[#4B5563] text-[16px] mb-2">Slug</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            placeholder="Enter slug (optional)"
            className="w-full h-[44px] sm:h-[48px] px-3 rounded-[12px] bg-[#E7EFF8] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454]"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_refundable" checked={formData.is_refundable} onChange={handleInputChange} className="h-4 w-4" />
            Refundable
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_exchangeable" checked={formData.is_exchangeable} onChange={handleInputChange} className="h-4 w-4" />
            Exchangeable
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4" />
            Active
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#ef7e1b] text-white h-[48px] rounded-xl hover:bg-[#ee7f1b] transition disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default CreateQuotation;

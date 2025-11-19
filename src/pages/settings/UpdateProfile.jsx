import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../auth/AuthContext"; // adjust path as needed
import api from "../../api";
import Swal from "sweetalert2";
import { Country, State, City } from "country-state-city";

const EditIcon = (props) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="22" height="22" rx="3" fill="#0e4053" />
    <path
      d="M2.75 19.25V15.3542L14.85 3.27708C15.0334 3.10903 15.2359 2.97917 15.4578 2.8875C15.6796 2.79583 15.9124 2.75 16.1563 2.75C16.4001 2.75 16.6369 2.79583 16.8667 2.8875C17.0965 2.97917 17.2951 3.11667 17.4625 3.3L18.7229 4.58334C18.9063 4.75139 19.0401 4.95 19.1244 5.17917C19.2088 5.40834 19.2506 5.6375 19.25 5.86667C19.25 6.11112 19.2082 6.34426 19.1244 6.56609C19.0407 6.78792 18.9069 6.9902 18.7229 7.17292L6.64584 19.25H2.75ZM16.1334 7.15001L17.4167 5.86667L16.1334 4.58334L14.85 5.86667L16.1334 7.15001Z"
      fill="white"
    />
  </svg>
);

const UpdateProfile = () => {
  const { user, updateUser } = useAuth();

  console.log(JSON.stringify(user), "user saved in context is here");
  // State for profile fields
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    pincode: "",
    avatar: null, // File object if user chooses a new file
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  // State for change-password section (unchanged)
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirmation: "",
  });

  // Optional: error/success state if you display inline messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Country, State, City state variables
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [selectedCityObj, setSelectedCityObj] = useState(null);

  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Filtered lists for country, state, city
  const filteredCountries = useMemo(
    () =>
      countries.filter((country) =>
        country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
      ),
    [countries, countrySearchTerm]
  );

  const filteredStates = useMemo(
    () =>
      states.filter((state) =>
        state.name.toLowerCase().includes(stateSearchTerm.toLowerCase())
      ),
    [states, stateSearchTerm]
  );

  const filteredCities = useMemo(
    () =>
      cities.filter((city) =>
        city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
      ),
    [cities, citySearchTerm]
  );

  // 1. Populate profile form when `user` becomes available
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.username || "",
        email: user.email || "",
        // If your API uses `contact` or `phoneno`, pick accordingly:
        contact: user.contact || user.phoneno || "",
        address: "",
        pincode: "",
        avatar: null, // leave null until new upload
      });
      // For avatar preview: use existing avatar URL if available, else default
      console.log(user.profile_pic, "user profile pic is here");
      if (user.profile_pic) {
        setAvatarPreview(user.profile_pic);
      } else {
        // Default placeholder if none in user object
        setAvatarPreview("/Avatar2.png");
      }

      // Parse address if it exists and populate country, state, city fields
      if (user.address && typeof user.address === "string") {
        try {
          const parsedAddress = JSON.parse(user.address);
          if (parsedAddress) {
            // Set address field
            if (parsedAddress.blockUnitStreetName) {
              setProfileData((prev) => ({
                ...prev,
                address: parsedAddress.blockUnitStreetName,
              }));
            }

            // Set pincode
            if (parsedAddress.pincode) {
              setProfileData((prev) => ({
                ...prev,
                pincode: parsedAddress.pincode,
              }));
            }

            // Set country
            if (parsedAddress.country) {
              const countryObj = Country.getAllCountries().find(
                (c) => c.name === parsedAddress.country
              );
              if (countryObj) {
                setSelectedCountryObj(countryObj);
                setCountrySearchTerm(parsedAddress.country);
                setStates(State.getStatesOfCountry(countryObj.isoCode));

                // Set state after country is set
                if (parsedAddress.state) {
                  const stateObj = State.getStatesOfCountry(
                    countryObj.isoCode
                  ).find((s) => s.name === parsedAddress.state);
                  if (stateObj) {
                    setSelectedStateObj(stateObj);
                    setStateSearchTerm(parsedAddress.state);
                    setCities(
                      City.getCitiesOfState(
                        stateObj.countryCode,
                        stateObj.isoCode
                      )
                    );

                    // Set city after state is set
                    if (parsedAddress.city) {
                      const cityObj = City.getCitiesOfState(
                        stateObj.countryCode,
                        stateObj.isoCode
                      ).find((c) => c.name === parsedAddress.city);
                      if (cityObj) {
                        setSelectedCityObj(cityObj);
                        setCitySearchTerm(parsedAddress.city);
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error parsing address JSON:", e);
        }
      }
    }
  }, [user]);

  // Load countries on component mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // Add useEffect for country dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setCountryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for state dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target)
      ) {
        setStateDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add useEffect for city dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target)
      ) {
        setCityDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers for Country, State, City pickers
  const handleCountrySearchChange = (e) => {
    const value = e.target.value;
    setCountrySearchTerm(value);
    setCountryDropdownOpen(true);

    // Clear dependent selections if country changes
    if (value === "") {
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setStates([]);
      setCities([]);
      setStateSearchTerm("");
      setCitySearchTerm("");
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountryObj(country);
    setCountrySearchTerm(country.name);
    setCountryDropdownOpen(false);
    setStates(State.getStatesOfCountry(country.isoCode));

    // Clear dependent selections
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setCities([]);
    setStateSearchTerm("");
    setCitySearchTerm("");
  };

  const handleStateSearchChange = (e) => {
    // Prevent state search if no country is selected
    if (!countrySearchTerm) {
      return;
    }

    const value = e.target.value;
    setStateSearchTerm(value);
    setStateDropdownOpen(true);

    // Clear dependent selections if state changes
    if (value === "") {
      setSelectedCityObj(null);
      setCities([]);
      setCitySearchTerm("");
    }
  };

  const handleStateSelect = (state) => {
    setSelectedStateObj(state);
    setStateSearchTerm(state.name);
    setStateDropdownOpen(false);
    setCities(City.getCitiesOfState(state.countryCode, state.isoCode));

    // Clear dependent selections
    setSelectedCityObj(null);
    setCitySearchTerm("");
  };

  const handleCitySearchChange = (e) => {
    // Prevent city search if no state is selected
    if (!stateSearchTerm) {
      return;
    }

    const value = e.target.value;
    setCitySearchTerm(value);
    setCityDropdownOpen(true);
  };

  const handleCitySelect = (city) => {
    setSelectedCityObj(city);
    setCitySearchTerm(city.name);
    setCityDropdownOpen(false);
  };

  // Handlers for profile fields
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setProfileData((prev) => ({ ...prev, avatar: file }));
      // Revoke previous preview URL if desired (cleanup) - optional
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleImageError = (e) => {
    console.error("Image failed to load:", e);
    // If the avatar preview is already the fallback, do nothing
    if (avatarPreview !== "/Avatar2.png") {
      console.log("Falling back to default avatar");
      setAvatarPreview("/Avatar2.png");
    }
  };

  // 2. Submit updated profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // --- Validations ---
    const { name, email, contact, address, avatar } = profileData;

    if (!name || !name.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Name is required.",
        confirmButtonColor: "#278AFF",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid email address.",
        confirmButtonColor: "#278AFF",
      });
      return;
    }

    const contactRegex = /^\+?[0-9\s-()]{10,}$/;
    if (!contact || !contactRegex.test(contact)) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid contact number (at least 10 digits).",
        confirmButtonColor: "#278AFF",
      });
      return;
    }

    // Address field validations removed as per request

    if (avatar instanceof File) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(avatar.type)) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Invalid file type. Please upload a PNG or JPG image.",
          confirmButtonColor: "#278AFF",
        });
        return;
      }
    }

    // Clear previous messages
    setError("");
    setSuccess("");
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Create address object with country, state, city
      const addressObject = {
        blockUnitStreetName: address,
        country: countrySearchTerm || "",
        state: stateSearchTerm || "",
        city: citySearchTerm || "",
        pincode: profileData.pincode || "",
      };

      // Build payload. If avatar file present, use FormData; else JSON is fine.
      let response;
      if (profileData.avatar instanceof File) {
        const formPayload = new FormData();
        formPayload.append("name", profileData.name);
        formPayload.append("email", profileData.email);
        formPayload.append("phoneno", profileData.contact);
        formPayload.append("address", JSON.stringify(addressObject));
        formPayload.append("profile_image", profileData.avatar);
        response = await api.post("/updateuserprofile", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // No new avatar: send JSON
        const payload = {
          name: profileData.name,
          email: profileData.email,
          phoneno: profileData.contact,
          address: JSON.stringify(addressObject),
        };
        response = await api.post("/updateuserprofile", payload);
      }

      // Adjust according to your API response structure
      if (response.data && (response.data.success || response.data.status)) {
        console.log("API Response:", response.data);

        // API was successful, create payload for context update
        // Match the structure that login API returns
        const updatedUserData = {
          username: profileData.name,
          email: profileData.email,
          phoneno: profileData.contact,
          address: JSON.stringify(addressObject),
        };

        // Conditionally add avatar URL if API provides it
        // Check different possible response structures
        if (response.data.result?.profile_pic) {
          updatedUserData.profile_pic = response.data.result.profile_pic;
        } else if (response.data.user?.profile_image) {
          updatedUserData.profile_pic = response.data.user.profile_image;
        } else if (response.data.user?.profile_pic) {
          updatedUserData.profile_pic = response.data.user.profile_pic;
        } else if (response.data.profile_pic) {
          updatedUserData.profile_pic = response.data.profile_pic;
        }

        console.log("Updated User Data:", updatedUserData);

        // Update context and localStorage via AuthContext
        updateUser(updatedUserData);

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Profile updated successfully",
          confirmButtonColor: "#278AFF",
        }).then(() => {
          window.location.reload();
        });
      } else {
        const msg =
          response.data?.message ||
          response.data?.error ||
          "Failed to update profile";
        Swal.fire({
          icon: "error",
          title: "Error",
          text: msg,
          confirmButtonColor: "#278AFF",
        });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error updating profile. Please try again.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#278AFF",
      });
    }
  };

  // Handlers for Change Password (kept intact from your original)
  const handlePasswordChange = (e) => {
    setPasswordFormData({
      ...passwordFormData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate password length
    if (passwordFormData.newPassword.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "New password must be at least 8 characters long.",
        confirmButtonColor: "#278AFF",
      });
      return;
    }

    // Validate passwords match
    if (
      passwordFormData.newPassword !== passwordFormData.newPasswordConfirmation
    ) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match",
        confirmButtonColor: "#278AFF",
      });
      return;
    }

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to update your password?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#278AFF",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload = {
      current_password: passwordFormData.currentPassword,
      new_password: passwordFormData.newPassword,
      new_password_confirmation: passwordFormData.newPasswordConfirmation,
    };

    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.post("/changePassword", payload);
      console.log("Response:", response);

      if (response.data) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password changed successfully",
          confirmButtonColor: "#278AFF",
        });
        setPasswordFormData({
          currentPassword: "",
          newPassword: "",
          newPasswordConfirmation: "",
        });
      }
    } catch (err) {
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        config: err.config,
      });

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error changing password. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#278AFF",
      });
    }
  };

  const isDummyImage = !avatarPreview || avatarPreview.endsWith("/Avatar2.png");

  // Render
  return (
    <>
      {/* ===== Profile Information Section (refactored) ===== */}
      <div className="flex bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] mb-5">
        <div className="w-full mx-auto p-4 md:p-6 rounded-[15.5px] relative">
          <h2 className="text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap mb-4">
            Profile Information
          </h2>

          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avatar */}
              <div className="md:col-span-3 flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="relative flex-shrink-0">
                  {avatarPreview ? (
                    <>
                      <div
                        className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ${
                          isDummyImage ? "bg-[#8CBFEC]" : ""
                        }`}
                      >
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                          onLoad={() =>
                            console.log(
                              "Image loaded successfully:",
                              avatarPreview
                            )
                          }
                        />
                      </div>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 cursor-pointer"
                      >
                        <EditIcon />
                        <input
                          id="avatar-upload"
                          name="avatar"
                          type="file"
                          accept="image/png, image/jpeg"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-300 animate-pulse" />
                  )}
                </div>
                <div className="text-xs md:text-sm text-[#4B5563] text-center md:text-left">
                  <p>Update your avatar by clicking the image beside.</p>
                  <p>288x288 px size recommended in PNG or JPG format only.</p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Username
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Contact Info
                </label>
                <input
                  type="text"
                  name="contact"
                  value={profileData.contact}
                  onChange={handleProfileChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Enter your contact number"
                  required
                />
              </div>

              {/* Address */}
              <div className="md:col-span-3">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Address
                </label>

                {/* Street Address */}
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="w-full h-[44px] px-3 rounded-t-[12px] bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Block/Unit/Street Name"

                />

                {/* State and City Dropdowns */}
                <div className="grid grid-cols-2 w-full">
                  {/* State Dropdown */}
                  <div className="relative" ref={stateDropdownRef}>
                    <input
                      type="text"
                      name="stateSearch"
                      value={stateSearchTerm}
                      onChange={handleStateSearchChange}
                      onFocus={() =>
                        countrySearchTerm && setStateDropdownOpen(true)
                      }
                      onBlur={() => setStateDropdownOpen(false)}
                      className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                        !countrySearchTerm
                          ? "bg-gray-300 cursor-not-allowed opacity-60"
                          : "bg-[#E7EFF8]/60"
                      }`}
                      placeholder="Select State"
                      disabled={!countrySearchTerm}
                      readOnly={!countrySearchTerm}
                      autoComplete="off"
                    />
                    {stateDropdownOpen && countrySearchTerm && (
                      <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                        {filteredStates.length > 0 ? (
                          filteredStates.map((state) => (
                            <div
                              key={state.isoCode}
                              className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                              onClick={() => handleStateSelect(state)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {state.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500">
                            No states found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* City Dropdown */}
                  <div className="relative" ref={cityDropdownRef}>
                    <input
                      type="text"
                      name="citySearch"
                      value={citySearchTerm}
                      onChange={handleCitySearchChange}
                      onFocus={() =>
                        stateSearchTerm && setCityDropdownOpen(true)
                      }
                      onBlur={() => setCityDropdownOpen(false)}
                      className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                        !stateSearchTerm
                          ? "bg-gray-300 cursor-not-allowed opacity-60"
                          : "bg-[#E7EFF8]/60"
                      }`}
                      placeholder="Select City"
                      disabled={!stateSearchTerm}
                      readOnly={!stateSearchTerm}
                      autoComplete="off"
                    />
                    {cityDropdownOpen && stateSearchTerm && (
                      <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((city) => (
                            <div
                              key={city.name}
                              className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                              onClick={() => handleCitySelect(city)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {city.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500">
                            No cities found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pincode and Country */}
                <div className="grid grid-cols-2 w-full">
                  {/* Pincode Input */}
                  <input
                    type="text"
                    name="pincode"
                    value={profileData.pincode}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 rounded-bl-[12px] outline-none"
                    placeholder="Pincode"
                  />
                  {/* Country Dropdown */}
                  <div className="relative" ref={countryDropdownRef}>
                    <input
                      type="text"
                      name="countrySearch"
                      value={countrySearchTerm}
                      onChange={handleCountrySearchChange}
                      onFocus={() => setCountryDropdownOpen(true)}
                      onBlur={() => setCountryDropdownOpen(false)}
                      className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                      placeholder="Select Country"
                      autoComplete="off"
                    />
                    {countryDropdownOpen && (
                      <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <div
                              key={country.isoCode}
                              className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                              onClick={() => handleCountrySelect(country)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {country.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500">
                            No countries found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 flex justify-start">
              <button
                type="submit"
                className="w-full md:w-[207px] h-[44px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== Change Password Section (unchanged) ===== */}
      <div className="flex bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)]">
        <div className="w-full mx-auto p-4 md:p-6 rounded-[15.5px] relative">
          <h2 className="text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap mb-4">
            Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Enter current password"
                  required
                />
              </div>

              {/* Empty div for spacing */}
              <div />

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Enter new password (At least 8 characters)"
                  required
                  minLength="8"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="newPasswordConfirmation"
                  value={passwordFormData.newPasswordConfirmation}
                  onChange={handlePasswordChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  placeholder="Confirm new password"
                  required
                  minLength="8"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 flex justify-start">
              <button
                type="submit"
                className="w-full md:w-[207px] h-[44px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateProfile;

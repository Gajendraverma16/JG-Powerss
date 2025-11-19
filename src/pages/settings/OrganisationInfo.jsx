import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { FiEdit } from "react-icons/fi";
import api from "../../api";
import Swal from "sweetalert2";
import { City, State, Country } from "country-state-city";
import { RxCross2 } from "react-icons/rx";
import { SidebarContext } from "../../components/Layout";


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

const OrganisationInfo = () => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Hardcoded data for the single list item, now in state
  const [organisation, setOrganisation] = useState({
    id: null,
    name: "",
    email: "",
    address: "",
    phoneno: "",
    organizationimage: null,
    profile_image: null,
    blockUnitStreetName: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    digital_seal: null,
    bankName: "",
    accountName: "",
    ifscCode: "",
    accountNo: "",
    bankBranch: "",
    terms: [],
  });

  // State for the form data
  const [formData, setFormData] = useState({ ...organisation });
  const [imagePreview, setImagePreview] = useState(null);
  const [digitalSeal, setDigitalSeal] = useState(null); // New state for digital seal file
  const [digitalSealPreview, setDigitalSealPreview] = useState(null); // New state for digital seal preview

  // New state for adding terms
  const [newTerm, setNewTerm] = useState("");

  // States for country-state-city data
  const [allCountries, setAllCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [allCities, setAllCities] = useState([]);

  // States to hold the selected country, state, city objects
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [selectedCityObj, setSelectedCityObj] = useState(null);

  // New states for search functionality
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);

  // New states for search functionality for State and City
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [filteredStates, setFilteredStates] = useState([]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);

  // New states for search functionality, similar to UpdateProfile
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");

  // Refs for dropdowns to handle outside clicks
  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Filtered lists for country, state, city (using useMemo for performance)
  const filteredCountriesMemo = useMemo(
    () =>
      allCountries.filter((country) =>
        country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
      ),
    [allCountries, countrySearchTerm]
  );

  const filteredStatesMemo = useMemo(
    () =>
      allStates.filter((state) =>
        state.name.toLowerCase().includes(stateSearchTerm.toLowerCase())
      ),
    [allStates, stateSearchTerm]
  );

  const filteredCitiesMemo = useMemo(
    () =>
      allCities.filter((city) =>
        city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
      ),
    [allCities, citySearchTerm]
  );

  // Effect to initialize countries and set default India
  useEffect(() => {
    const countries = Country.getAllCountries();
    setAllCountries(countries);
    // Removed setFilteredCountries(countries) as useMemo will handle it
    // No default India here, let the fetch populate if it exists
  }, []);

  // Effect to handle city change
  useEffect(() => {
    if (selectedCityObj) {
      setFormData((prev) => ({ ...prev, city: selectedCityObj.name }));
    }
  }, [selectedCityObj]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for adding a new term
  const handleAddTerm = (e) => {
    e.preventDefault();
    if (newTerm.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        terms: [...(prev.terms || []), newTerm.trim()],
      }));
      setNewTerm("");
    }
  };

  // Handler for removing a term
  const handleRemoveTerm = (idx) => {
    setFormData((prev) => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== idx),
    }));
  };

  const handleCountrySearchChange = (e) => {
    const query = e.target.value;
    setCountrySearchTerm(query); // Update search term
    setFormData((prev) => ({ ...prev, country: query }));
    setCountryDropdownOpen(true);
    if (query.trim() === "") {
      setSelectedCountryObj(null); // Clear selected country
      setSelectedStateObj(null); // Clear dependent states
      setSelectedCityObj(null);
      setAllStates([]);
      setAllCities([]);
      setStateSearchTerm(""); // Clear dependent search terms
      setCitySearchTerm("");
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountryObj(country);
    setCountrySearchTerm(country.name); // Set search term from selected country
    setFormData((prev) => ({ ...prev, country: country.name }));
    setCountryDropdownOpen(false);

    // When country changes, reset states and cities
    const states = State.getStatesOfCountry(country.isoCode);
    setAllStates(states);
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setAllCities([]);
    setStateSearchTerm("");
    setCitySearchTerm("");
    setFormData((prev) => ({ ...prev, state: "", city: "" })); // Clear form data as well
  };

  const handleStateSearchChange = (e) => {
    if (!countrySearchTerm) {
      // Prevent state search if no country is selected based on search term
      return;
    }
    const query = e.target.value;
    setStateSearchTerm(query); // Update search term
    setFormData((prev) => ({ ...prev, state: query }));
    setStateDropdownOpen(true);
    if (query.trim() === "") {
      setSelectedStateObj(null); // Clear selected state
      setSelectedCityObj(null); // Clear dependent cities
      setAllCities([]);
      setCitySearchTerm(""); // Clear dependent search term
    }
  };

  const handleStateSelect = (state) => {
    setSelectedStateObj(state);
    setStateSearchTerm(state.name); // Set search term from selected state
    setFormData((prev) => ({ ...prev, state: state.name }));
    setStateDropdownOpen(false);

    // When state changes, reset cities
    const cities = City.getCitiesOfState(state.countryCode, state.isoCode);
    setAllCities(cities);
    setSelectedCityObj(null);
    setCitySearchTerm("");
    setFormData((prev) => ({ ...prev, city: "" })); // Clear form data as well
  };

  const handleCitySearchChange = (e) => {
    if (!stateSearchTerm) {
      // Prevent city search if no state is selected based on search term
      return;
    }
    const query = e.target.value;
    setCitySearchTerm(query); // Update search term
    setFormData((prev) => ({ ...prev, city: query }));
    setCityDropdownOpen(true);
    if (query.trim() === "") {
      setSelectedCityObj(null); // Clear selected city
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCityObj(city);
    setCitySearchTerm(city.name); // Set search term from selected city
    setFormData((prev) => ({ ...prev, city: city.name }));
    setCityDropdownOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, organizationimage: file }));
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDigitalSealChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setDigitalSeal(file);
      if (digitalSealPreview && digitalSealPreview.startsWith("blob:")) {
        URL.revokeObjectURL(digitalSealPreview);
      }
      setDigitalSealPreview(URL.createObjectURL(file));
    }
  };

  const handleImageError = (e) => {
    console.error("Image failed to load:", e);
    if (imagePreview !== "/dummyavatar.jpeg") {
      console.log("Falling back to default avatar");
      setImagePreview("/dummyavatar.jpeg");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!formData.name.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Company Name cannot be empty.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (!formData.email.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Email cannot be empty.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    const emailRegex = /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid email address.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (!formData.phoneno.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Contact Number cannot be empty.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneno)) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid 10-digit phone number.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (!formData.blockUnitStreetName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Block/Unit/Street Name cannot be empty.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (!selectedCountryObj) {
      // Validate country selection
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a Country.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (!selectedStateObj) {
      // Validate state selection
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a State.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    if (!formData.pincode.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Pincode cannot be empty.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (formData.pincode.trim() && !pincodeRegex.test(formData.pincode)) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid 6-digit Pincode.",
        confirmButtonColor: "#0e4053",
      });
      return;
    }

    // Add validation for bank fields if needed

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to update the organisation details?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0e4053",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "No, cancel!",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      let response;
      // Construct address object for payload, similar to updateprofile.jsx
      const addressObject = {
        blockUnitStreetName: formData.blockUnitStreetName,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
      };
      const fullAddressJsonString = JSON.stringify(addressObject);
      // Add bank and terms to payload
      const bankDetails = {
        bankName: formData.bankName,
        accountName: formData.accountName,
        ifscCode: formData.ifscCode,
        accountNo: formData.accountNo,
        bankBranch: formData.bankBranch,
      };
      const terms = formData.terms || [];

      // Check if either image is a new File
      const isOrganizationImageNew = formData.organizationimage instanceof File;
      const isDigitalSealNew = digitalSeal instanceof File;

      if (isOrganizationImageNew || isDigitalSealNew) {
        const formPayload = new FormData();
        formPayload.append("organizationname", formData.name);
        formPayload.append("phone", formData.phoneno);
        formPayload.append("email", formData.email);
        formPayload.append("limit", formData.limit);
        formPayload.append("address", fullAddressJsonString);
        formPayload.append("aid", formData.id);
        formPayload.append("bank_name", formData.bankName);
        formPayload.append("account_name", formData.accountName);
        formPayload.append("ifsc_code", formData.ifscCode);
        formPayload.append("account_no", formData.accountNo);
        formPayload.append("bank_branch", formData.bankBranch);
        formPayload.append(
          "term_info",
          JSON.stringify(
            Object.fromEntries(
              (formData.terms || []).map((term, idx) => [
                `bulletpoint${idx + 1}`,
                term,
              ])
            )
          )
        );
        // Always send profile_image (file if new, else URL)
        if (isOrganizationImageNew) {
          formPayload.append("profile_image", formData.organizationimage);
        } else if (formData.profile_image) {
          formPayload.append("profile_image", formData.profile_image);
        }
        // Always send upload_seal (file if new, else URL)
        if (isDigitalSealNew) {
          formPayload.append("upload_seal", digitalSeal);
        } else if (formData.digital_seal) {
          formPayload.append("upload_seal", formData.digital_seal);
        }
        console.log(
          "new post here, formPayload",
          Array.from(formPayload.entries())
        );
        response = await api.post("/updateorganization", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Always send all fields, even if not changed
        const formattedData = {
          organizationname: formData.name,
          phone: formData.phoneno,
          email: formData.email,
          limit:formData.limit,
          address: fullAddressJsonString,
          aid: formData.id,
          bank_name: formData.bankName,
          account_name: formData.accountName,
          ifsc_code: formData.ifscCode,
          account_no: formData.accountNo,
          bank_branch: formData.bankBranch,
          term_info: JSON.stringify(
            Object.fromEntries(
              (formData.terms || []).map((term, idx) => [
                `bulletpoint${idx + 1}`,
                term,
              ])
            )
          ),
        };
        if (formData.profile_image) {
          formattedData.profile_image = formData.profile_image;
        }
        if (formData.digital_seal) {
          formattedData.upload_seal = formData.digital_seal;
        }
        response = await api.post("/updateorganization", formattedData);
      }

      if (response.status === 200) {
        setOrganisation((prevOrg) => ({
          ...prevOrg,
          ...formData,
          address: fullAddressJsonString, // Update organisation state with JSON string
        }));
        Swal.fire({
          title: "Success!",
          text: "Organisation details updated successfully!",
          icon: "success",
          confirmButtonColor: "#0e4053",
        }).then(() => {});
      } else {
        Swal.fire({
          title: "Error!",
          text: "Failed to update organisation details.",
          icon: "error",
          confirmButtonColor: "#0e4053",
        });
      }
    } catch (error) {
      console.error("Error updating organisation:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while updating.",
        icon: "error",
        confirmButtonColor: "#0e4053",
      });
    }
  };

  useEffect(() => {
    const fetchOrganisationData = async () => {
      try {
        const response = await api.get("/orglist");
        const result = response.data.result;

        // If result is an object, get the first value (organization)
        let orgData = null;
        if (result && typeof result === "object" && !Array.isArray(result)) {
          const orgArray = Object.values(result);
          orgData = orgArray.length > 0 ? orgArray[0] : null;
        } else if (Array.isArray(result)) {
          orgData = result[0];
        }

        if (orgData) {
          // Parse address
          let parsedAddress = {};
          if (orgData.address && typeof orgData.address === "string") {
            try {
              parsedAddress = JSON.parse(orgData.address);
            } catch (e) {
              console.error(
                "Error parsing address JSON from orgData.address:",
                e
              );
              // Fallback for old format or invalid JSON, splitting by '\r' for the provided API response
              const addressParts = orgData.address.split("\r");
              parsedAddress.blockUnitStreetName = addressParts[0] || "";
              const cityStatePart = addressParts[1] || "";
              const cityStateArray = cityStatePart.split(", ");
              if (cityStateArray.length === 2) {
                parsedAddress.city = cityStateArray[0];
                parsedAddress.state = cityStateArray[1];
              } else if (cityStateArray.length === 1) {
                parsedAddress.state = cityStateArray[0];
              }
              const countryPincodePart = addressParts[2] || "";
              const countryPincodeArray = countryPincodePart.split(" - ");
              if (countryPincodeArray.length === 2) {
                parsedAddress.country = countryPincodeArray[0];
                parsedAddress.pincode = countryPincodeArray[1];
              } else {
                parsedAddress.country = countryPincodePart;
              }
            }
          }

          const blockUnitStreetName = parsedAddress.blockUnitStreetName || "";
          const city = parsedAddress.city || "";
          const state = parsedAddress.state || "";
          const country = parsedAddress.country || "";
          const pincode = parsedAddress.pincode || "";

          // Always set search terms from parsed address first
          setCountrySearchTerm(country);
          setStateSearchTerm(state);
          setCitySearchTerm(city);

          // Update organisation and formData state
          setOrganisation({
            id: orgData.id,
            name: orgData.organizationname,
            email: orgData.email,
            address: orgData.address,
            limit:orgData.limit,
            phoneno: orgData.phone,
            organizationimage: null,
            profile_image: orgData.profile_image,
            blockUnitStreetName: blockUnitStreetName,
            city: city,
            state: state,
            country: country,
            pincode: pincode,
            digital_seal: orgData.upload_seal,
            bankName: orgData.bank_name || "",
            accountName: orgData.account_name || "",
            ifscCode: orgData.ifsc_code || "",
            accountNo: orgData.account_no || "",
            bankBranch: orgData.bank_branch || "",
            terms: (() => {
              if (orgData.term_info) {
                try {
                  let termsObj = orgData.term_info;
                  if (typeof termsObj === "string") {
                    termsObj = JSON.parse(termsObj); // first parse
                    if (typeof termsObj === "string") {
                      termsObj = JSON.parse(termsObj); // second parse if still string
                    }
                  }
                  return Object.values(termsObj);
                } catch {
                  return [];
                }
              }
              return [];
            })(),
          });

          setFormData({
            id: orgData.id,
            name: orgData.organizationname,
            email: orgData.email,
            address: orgData.address,
            phoneno: orgData.phone,
            limit:orgData.limit,
            organizationimage: null,
            profile_image: orgData.profile_image,
            blockUnitStreetName: blockUnitStreetName,
            city: city,
            state: state,
            country: country,
            pincode: pincode,
            digital_seal: orgData.upload_seal,
            bankName: orgData.bank_name || "",
            accountName: orgData.account_name || "",
            ifscCode: orgData.ifsc_code || "",
            accountNo: orgData.account_no || "",
            bankBranch: orgData.bank_branch || "",
            terms: (() => {
              if (orgData.term_info) {
                try {
                  let termsObj = orgData.term_info;
                  if (typeof termsObj === "string") {
                    termsObj = JSON.parse(termsObj); // first parse
                    if (typeof termsObj === "string") {
                      termsObj = JSON.parse(termsObj); // second parse if still string
                    }
                  }
                  return Object.values(termsObj);
                } catch {
                  return [];
                }
              }
              return [];
            })(),
          });

          setImagePreview(orgData.profile_image || "/dummyavatar.jpeg");
          setDigitalSealPreview(orgData.upload_seal || null);

          // Attempt to find Country, State, City objects from library and set selected objects
          const countryObj = allCountries.find(
            (c) => c.name.toLowerCase() === country.toLowerCase().trim()
          );

          if (countryObj) {
            setSelectedCountryObj(countryObj);
            const statesForCountry = State.getStatesOfCountry(
              countryObj.isoCode
            );
            setAllStates(statesForCountry); // Populate all states for this country

            const stateObj = statesForCountry.find(
              (s) => s.name.toLowerCase() === state.toLowerCase().trim()
            );

            if (stateObj) {
              setSelectedStateObj(stateObj);
              const citiesForState = City.getCitiesOfState(
                stateObj.countryCode,
                stateObj.isoCode
              );
              setAllCities(citiesForState); // Populate all cities for this state

              const cityObj = citiesForState.find(
                (c) => c.name.toLowerCase() === city.toLowerCase().trim()
              );

              if (cityObj) {
                setSelectedCityObj(cityObj);
              } else {
                setSelectedCityObj(null); // No city match in library
              }
            } else {
              setSelectedStateObj(null); // No state match in library
              setAllCities([]); // Clear cities dropdown if no state match
            }
          } else {
            setSelectedCountryObj(null); // No country match in library
            setAllStates([]); // Clear states dropdown if no country match
            setSelectedStateObj(null);
            setAllCities([]); // Clear cities dropdown if no country match
            setSelectedCityObj(null);
          }
        } else {
          // No orgData found - reset all states, including search terms
          setOrganisation({
            id: null,
            name: "",
            email: "",
            address: "",
            phoneno: "",
            organizationimage: null,
            profile_image: null,
            blockUnitStreetName: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            digital_seal: null,
            bankName: "",
            accountName: "",
            ifscCode: "",
            accountNo: "",
            bankBranch: "",
            terms: [],
          });
          setFormData({
            id: null,
            name: "",
            email: "",
            address: "",
            phoneno: "",
            organizationimage: null,
            profile_image: null,
            blockUnitStreetName: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            digital_seal: null,
            bankName: "",
            accountName: "",
            ifscCode: "",
            accountNo: "",
            bankBranch: "",
            terms: [],
          });
          setImagePreview("/dummyavatar.jpeg");
          setDigitalSealPreview(null);
          setSelectedCountryObj(null);
          setSelectedStateObj(null);
          setSelectedCityObj(null);
          setAllStates([]);
          setAllCities([]);
          setCountrySearchTerm("");
          setStateSearchTerm("");
          setCitySearchTerm("");
        }
      } catch (error) {
        console.error("Failed to fetch organisation data:", error);
        // Error handling: reset to default empty states rather than "Failed to load"
        setOrganisation({
          id: null,
          name: "",
          email: "",
          address: "",
          phoneno: "",
          organizationimage: null,
          profile_image: null,
          blockUnitStreetName: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
          digital_seal: null,
          bankName: "",
          accountName: "",
          ifscCode: "",
          accountNo: "",
          bankBranch: "",
          terms: [],
        });
        setFormData({
          id: null,
          name: "",
          email: "",
          address: "",
          phoneno: "",
          organizationimage: null,
          profile_image: null,
          blockUnitStreetName: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
          digital_seal: null,
          bankName: "",
          accountName: "",
          ifscCode: "",
          accountNo: "",
          bankBranch: "",
          terms: [],
        });
        setImagePreview("/dummyavatar.jpeg");
        setDigitalSealPreview(null);
        setSelectedCountryObj(null);
        setSelectedStateObj(null);
        setSelectedCityObj(null);
        setAllStates([]);
        setAllCities([]);
        setCountrySearchTerm("");
        setStateSearchTerm("");
        setCitySearchTerm("");
      }
    };
    // Only fetch data if countries are loaded
    if (allCountries.length > 0) {
      fetchOrganisationData();
    }
  }, [allCountries]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    // Initial check
    checkMobile();
    // Add event listener for resize
    window.addEventListener("resize", checkMobile);
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkMobile);
      // Cleanup blob URL when component unmounts
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // New useEffect for digitalSealPreview cleanup
  useEffect(() => {
    return () => {
      if (digitalSealPreview && digitalSealPreview.startsWith("blob:")) {
        URL.revokeObjectURL(digitalSealPreview);
      }
    };
  }, [digitalSealPreview]);

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

  const isDummyImage =
    !imagePreview || imagePreview.endsWith("/dummyavatar.jpeg");


  // Consume SidebarContext
  const { isCollapsed } = useContext(SidebarContext);


  return (
    <div className="">
      {/* Edit Form Section */}
      <div className={`mb-6 p-4 md:p-6 bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] ${
        isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
      } `}>
        <h2 className="text-[22px] font-medium text-[#1F2837] mb-4">
          Edit Details
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Image */}
            <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
              <div className="relative flex-shrink-0">
                {imagePreview ? (
                  <>
                    <div
                      className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ${
                        isDummyImage ? "bg-[#8CBFEC]" : ""
                      }`}
                    >
                      <img
                        src={imagePreview}
                        alt="Organisation Image"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                    <label
                      htmlFor="image-upload"
                      className="absolute bottom-0 right-0 cursor-pointer"
                    >
                      <EditIcon />
                      <input
                        id="image-upload"
                        name="organizationimage"
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-300 animate-pulse" />
                )}
              </div>
              <div className="text-xs md:text-sm text-[#4B5563] text-center md:text-left">
                <p>
                  Update your organisation image by clicking the image beside.
                </p>
                <p>288x288 px size recommended in PNG or JPG format only.</p>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label className="block text-[#4B5563] text-sm font-medium">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                />
                <FiEdit className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[#4B5563] text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            </div>

            {/* Set Limit */}
            <div className="space-y-1">
              <label className="block text-[#4B5563] text-sm font-medium">
                Contact Number
              </label>
              <input
                type="text"
                name="phoneno"
                value={formData.phoneno}
                onChange={handleInputChange}
                className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[#4B5563] text-sm font-medium">
               Set Limit
              </label>
              <input
                type="text"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                className="w-full h-[44px] px-3 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            </div>

            {/* Empty div for spacing */}
            <div />

            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[#4B5563] text-sm font-medium">
                Address
              </label>
              <div className="w-full rounded-[12px]  border border-white/20 flex flex-col">
                <input
                  type="text"
                  name="blockUnitStreetName"
                  value={formData.blockUnitStreetName}
                  onChange={handleInputChange}
                  className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b  bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-t-[12px]"
                  placeholder="Block/Unit/Street Name"
                />

                {/* State and City Dropdowns */}
                <div className="grid grid-cols-2  w-full">
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
                        countrySearchTerm
                          ? "bg-[#E7EFF8]/60"
                          : "bg-gray-300 cursor-not-allowed opacity-60"
                      }`}
                      placeholder="Select State"
                      disabled={!countrySearchTerm}
                      readOnly={!countrySearchTerm}
                      autoComplete="off"
                    />
                    {stateDropdownOpen && countrySearchTerm && (
                      <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                        {filteredStatesMemo.length > 0 ? (
                          filteredStatesMemo.map((state) => (
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
                        stateSearchTerm
                          ? "bg-[#E7EFF8]/60"
                          : "bg-gray-300 cursor-not-allowed opacity-60"
                      }`}
                      placeholder="Select City"
                      disabled={!stateSearchTerm}
                      readOnly={!stateSearchTerm}
                      autoComplete="off"
                    />
                    {cityDropdownOpen && stateSearchTerm && (
                      <div className="absolute custom-scrollbar z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                        {filteredCitiesMemo.length > 0 ? (
                          filteredCitiesMemo.map((city) => (
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
                <div className="grid grid-cols-2  w-full">
                  {/* Pincode Input */}
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
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
                      className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20  outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                      placeholder="Select Country"
                      autoComplete="off"
                    />
                    {countryDropdownOpen && ( // Show dropdown when open
                      <div className="absolute z-10 custom-scrollbar w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                        {filteredCountriesMemo.length > 0 ? (
                          filteredCountriesMemo.map((country) => (
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

            {/* Bank Details Section (styled like Address) */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[#4B5563] text-sm font-medium">
                Bank Details
              </label>
              <div className="w-full rounded-[12px] border border-white/20 flex flex-col">
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-t-[12px]"
                  placeholder="Bank Name"
                />
                {/* Two-column grid for Account Name/IFSC and Account No/Bank Branch */}
                <div className="grid grid-cols-2  w-full">
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-none "
                    placeholder="Account Name"
                    style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                  />
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 rounded-br-[12px] flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-none"
                    placeholder="IFSC Code"
                  />
                </div>
                <div className="grid grid-cols-2 w-full">
                  <input
                    type="text"
                    name="accountNo"
                    value={formData.accountNo}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 rounded-bl-[12px] flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-none"
                    placeholder="Account Number"
                  />
                  <input
                    type="text"
                    name="bankBranch"
                    value={formData.bankBranch}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 rounded-br-[12px] flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-none"
                    placeholder="Bank Branch"
                  />
                </div>
              </div>
            </div>
            {/* Terms and Conditions Section */}
            <div className="md:col-span-2 space-y-1 mb-5">
              <label className="block text-[#4B5563] text-sm font-medium">
                Terms and Conditions
              </label>
              <div className="flex gap-2 mb-2">
                <textarea
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="flex-1 h-[44px] px-3 py-2 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] resize"
                  placeholder="Add a term and press +"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className={`h-[44px] px-4 bg-[#003A72] text-white rounded-[10px] transition-colors ${
                    !newTerm.trim()
                      ? "opacity-50 cursor-not-allowed bg-[#003A72]" // disabled look
                      : "hover:bg-[#004B8D]"
                  }`}
                  title="Add Term"
                  disabled={!newTerm.trim()}
                >
                  +
                </button>
              </div>
              <div className="space-y-2">
                {(formData.terms || []).map((term, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <textarea
                      value={term}
                      onChange={(e) => {
                        const updatedTerms = [...formData.terms];
                        updatedTerms[idx] = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          terms: updatedTerms,
                        }));
                      }}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] resize"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="h-[44px] px-3 text-red-500 rounded-[10px] hover:bg-red-700 hover:text-white transition-colors text-xs "
                      title="Remove"
                    >
                      <RxCross2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Digital Seal Upload */}
          <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-4">
            <div className="relative flex-shrink-0">
              {digitalSealPreview ? (
                <div
                  className={`w-24 h-24 rounded-md overflow-hidden flex items-center justify-center ${
                    digitalSealPreview.endsWith("/dummyavatar.jpeg")
                      ? "bg-[#8CBFEC]"
                      : ""
                  }`}
                >
                  <img
                    src={digitalSealPreview}
                    alt="Digital Seal Preview"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-md bg-gray-300 animate-pulse" />
              )}
              <label
                htmlFor="digital-seal-upload"
                className="absolute bottom-0 right-0 cursor-pointer"
              >
                <EditIcon />
                <input
                  id="digital-seal-upload"
                  name="upload_seal"
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleDigitalSealChange}
                />
              </label>
            </div>
            <div className="text-xs md:text-sm text-[#4B5563] text-center md:text-left">
              <p>Upload your Digital Seal by clicking the image beside.</p>
              <p>Recommended size: 288x288 px in PNG or JPG format only.</p>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="w-full md:w-[207px] h-[44px] bg-[#003A72] text-white rounded-[10px] hover:bg-[#004B8D] transition-colors"
            >
              Update Details
            </button>
          </div>
        </form>
      </div>

      {/* Header Section */}
      <div className={`p-4 md:p-6 bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] mb-8 ${
        isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
      }`}>
        <h2 className="text-[22px] font-medium text-[#1F2837] mb-4">
          Organisation Details
        </h2>

        {/* Organisation List Table for Desktop */}
        <div className="hidden md:block w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1000px] border-collapse  ">
            <thead>
              <tr className="text-left text-[#4B5563]">
                <th className="py-4 px-6 font-medium text-sm">Company</th>
                {/* Removed Address column header */}
                <th className="py-4 px-6 font-medium text-sm">Bank Details</th>
                <th className="py-4 px-6 font-medium text-sm">
                  Terms & Conditions
                </th>
                <th className="py-4 px-6 font-medium text-sm">Digital Seal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#E5E7EB]">
                <td className="py-4 px-6 text-sm text-[#4B5563] flex flex-col gap-2 items-start">
                  <div className="flex items-center gap-3">
                    {organisation.profile_image ? (
                      <img
                        src={organisation.profile_image}
                        alt="Organisation Logo"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 items-center"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                        No Logo
                      </div>
                    )}
                    <div>
                      <span className="whitespace-nowrap font-semibold block">
                        {organisation.name}
                      </span>
                      <span className="block text-xs text-gray-500 break-all">
                        {organisation.email}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {organisation.phoneno}
                      </span>
                    </div>
                  </div>
                  {/* Address below company info */}
                  <div className="text-xs text-gray-600 mt-2 ml-14">
                    {(() => {
                      try {
                        const addressObj = JSON.parse(organisation.address);
                        return (
                          <>
                            <span className="block">
                              {addressObj.blockUnitStreetName}
                            </span>
                            <span>
                              {addressObj.city && `${addressObj.city}, `}
                              {addressObj.state}
                            </span>
                            <br />
                            <span>
                              {addressObj.pincode}
                              {addressObj.country && `, ${addressObj.country}`}
                            </span>
                          </>
                        );
                      } catch (e) {
                        console.error("Error parsing address for display:", e);
                        return organisation.address; // Fallback to original if parsing fails
                      }
                    })()}
                  </div>
                </td>
                {/* Removed Address <td> */}
                {/* Bank Details column */}
                <td className="py-4 px-6 text-sm text-[#4B5563]">
                  {organisation.bankName || organisation.bank_name ? (
                    <div className="grid grid-cols-[max-content_1fr] gap-x-2">
                      <strong>Bank Name:</strong>
                      <span>
                        {organisation.bankName || organisation.bank_name}
                      </span>
                      <strong>Account Name:</strong>
                      <span>
                        {organisation.accountName || organisation.account_name}
                      </span>
                      <strong>IFSC Code:</strong>
                      <span>
                        {organisation.ifscCode || organisation.ifsc_code}
                      </span>
                      <strong>Account No:</strong>
                      <span>
                        {organisation.accountNo || organisation.account_no}
                      </span>
                      <strong>Branch:</strong>
                      <span>
                        {organisation.bankBranch || organisation.bank_branch}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">No Bank Details</span>
                  )}
                </td>
                {/* Terms & Conditions column */}
                <td className="py-4 px-6 text-sm text-[#4B5563] whitespace-pre-wrap">
                  {(() => {
                    let terms = [];
                    if (organisation.terms && organisation.terms.length > 0) {
                      terms = organisation.terms;
                    } else if (organisation.term_info) {
                      try {
                        let termsObj = organisation.term_info;
                        if (typeof termsObj === "string") {
                          termsObj = JSON.parse(termsObj);
                          if (typeof termsObj === "string") {
                            termsObj = JSON.parse(termsObj);
                          }
                        }
                        terms = Object.values(termsObj);
                      } catch {}
                    }
                    return terms.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {terms.map((term, idx) => (
                          <li key={idx}>{term}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">No Terms</span>
                    );
                  })()}
                </td>
                <td className="py-4 px-6 text-sm text-[#4B5563]">
                  {organisation.digital_seal ? (
                    <img
                      src={organisation.digital_seal}
                      alt="Digital Seal"
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-gray-500">No Seal</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Organisation Card for Mobile */}
        <div className="md:hidden w-full space-y-4 pb-24">
          <div className=" rounded-lg shadow p-4 border border-gray-200/80 ">
            <div className="flex justify-between items-start">
              {/* Combined Logo and Name */}
              <div className="flex items-center gap-3 pr-2 flex-grow">
                {organisation.profile_image ? (
                  <img
                    src={organisation.profile_image}
                    alt="Organisation Logo"
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                    No Logo
                  </div>
                )}
                <div className="space-y-1">
                  <p className="font-bold text-lg text-[#1F2837]">
                    {organisation.name}
                  </p>
                  <p className="text-sm text-gray-500 break-all">
                    {organisation.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {organisation.phoneno}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-8 text-sm">
              <div>
                <span className="font-medium text-gray-600">Address: </span>
                <span className="text-gray-800 whitespace-pre-wrap">
                  {(() => {
                    try {
                      const addressObj = JSON.parse(organisation.address);
                      return (
                        <>
                          <strong className="block">
                            {addressObj.blockUnitStreetName}
                          </strong>
                          <span>
                            {addressObj.city && `${addressObj.city}, `}
                            {addressObj.state}
                          </span>
                          <br />
                          <span>
                            {addressObj.pincode}
                            {addressObj.country && `, ${addressObj.country}`}
                          </span>
                        </>
                      );
                    } catch (e) {
                      console.error("Error parsing address for display:", e);
                      return organisation.address; // Fallback to original if parsing fails
                    }
                  })()}
                </span>
              </div>
              {/* Bank Details for mobile */}
              <div>
                <span className="font-medium text-gray-600">
                  Bank Details:{" "}
                </span>
                <div className="text-gray-800 mt-1">
                  {organisation.bankName || organisation.bank_name ? (
                    <div className="grid grid-cols-[max-content_1fr] gap-x-2">
                      <strong>Bank Name:</strong>
                      <span>
                        {organisation.bankName || organisation.bank_name}
                      </span>
                      <strong>Account Name:</strong>
                      <span>
                        {organisation.accountName || organisation.account_name}
                      </span>
                      <strong>IFSC:</strong>
                      <span>
                        {organisation.ifscCode || organisation.ifsc_code}
                      </span>
                      <strong>Account No:</strong>
                      <span>
                        {organisation.accountNo || organisation.account_no}
                      </span>
                      <strong>Branch:</strong>
                      <span>
                        {organisation.bankBranch || organisation.bank_branch}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">No Bank Details</span>
                  )}
                </div>
              </div>
              {/* Terms & Conditions for mobile */}
              <div>
                <span className="font-medium text-gray-600">
                  Terms & Conditions:{" "}
                </span>
                <span className="text-gray-800 whitespace-pre-wrap">
                  {(() => {
                    let terms = [];
                    if (organisation.terms && organisation.terms.length > 0) {
                      terms = organisation.terms;
                    } else if (organisation.term_info) {
                      try {
                        let termsObj = organisation.term_info;
                        if (typeof termsObj === "string") {
                          termsObj = JSON.parse(termsObj);
                          if (typeof termsObj === "string") {
                            termsObj = JSON.parse(termsObj);
                          }
                        }
                        terms = Object.values(termsObj);
                      } catch {}
                    }
                    return terms.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {terms.map((term, idx) => (
                          <li key={idx}>{term}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">No Terms</span>
                    );
                  })()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  Digital Seal:{" "}
                </span>
                {organisation.digital_seal ? (
                  <img
                    src={organisation.digital_seal}
                    alt="Digital Seal"
                    className="h-16 w-auto object-contain inline-block ml-2"
                  />
                ) : (
                  <span className="text-gray-800">No Seal</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganisationInfo;

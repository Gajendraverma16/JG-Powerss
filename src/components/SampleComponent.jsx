import React, { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
//DONT USE THIS FILE DIRECTLY---COPY PASTE INTO ANOTHER THEN USE.
const CreateUser = () => {
  // Mobile detection and search state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSearchExpanded(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  const handleSearchBlur = () => {
    if (isMobile) {
      setIsSearchExpanded(false);
    }
  };

  return (
    // Add `relative` here so that absolute children position within this container:
    <div className="relative w-full min-h-[797px] p-4 md:p-6 bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)]">
      {/* Header Section */}
      <div className="flex items-center gap-2 md:gap-4 mb-8">
        <h1 className="text-[16px] md:text-[20px] font-medium text-[#1F2837] whitespace-nowrap">
          Create New Member
        </h1>

        {/* Search Container */}
        <div className={`flex-1 max-w-[377px] ${isMobile ? "ml-2" : "mx-auto"}`}>
          {isMobile && !isSearchExpanded ? (
            // Collapsed state: just the search icon
            <button
              onClick={handleSearchToggle}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-[6px] hover:bg-gray-50 transition-colors"
            >
              {/* search icon SVG */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
                  stroke="#787374"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.3333 18.3333L20.1667 20.1667"
                  stroke="#787374"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            // Expanded state or desktop: full search bar
            <div className="relative w-full">
              <div className="absolute left-[16.8px] top-1/2 transform -translate-y-1/2 pointer-events-none">
                {/* search icon SVG */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
                    stroke="#787374"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.3333 18.3333L20.1667 20.1667"
                    stroke="#787374"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder={isMobile ? "Search" : "Search by Name, Contact"}
                className="w-full h-[36px] md:h-[44px] pl-12 pr-4 bg-[#E9F1F9] rounded-[6px] text-[#787374] placeholder-[#787374] focus:outline-none text-sm md:text-base placeholder:text-[10.3px] md:placeholder:text-base"
                onBlur={handleSearchBlur}
                autoFocus={isMobile && isSearchExpanded}
              />
            </div>
          )}
        </div>

        {/* Display Dropdown */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto">
          <span className="text-[#727A90] text-sm md:text-base whitespace-nowrap">
            Display
          </span>
          <div className="flex items-center h-[36px] md:h-[40px] px-2 md:px-3 bg-white border border-[#E9EAEA] rounded-[12px] cursor-pointer">
            <span className="text-[#242729] mr-1 md:mr-2 text-sm md:text-base">
              10
            </span>
            <FiChevronDown className="w-3 h-3 md:w-4 md:h-4 text-[#727A90]" />
          </div>
        </div>
      </div>

      {/* Main content here... e.g. user list/table */}

      {/* Pagination Controls */}
      <div
        className={`
          fixed bottom-10 left-0 right-0 flex justify-center gap-2 px-4
          md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:px-0
        `}
      >
        <button className="w-[44px] h-[44px] md:w-[52px] md:h-[52px] rounded-full flex items-center justify-center hover:bg-gray-50">
          <img
            src="/hugeicons_less-than.svg"
            alt="Previous"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>
        <button className="w-[44px] h-[44px] md:w-[52px] md:h-[52px] rounded-full border border-[#7E7B7B] flex items-center justify-center hover:bg-gray-50">
          <img src="/right.svg" alt="Next" className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

export default CreateUser;

// src/components/Layout.jsx

import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, createContext } from "react";

export const SidebarContext = createContext(null);

export default function Layout() {
  // Responsive sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const width = window.innerWidth;
    if (width < 768) return false; // mobile: not collapsed (handled as mobile)
    if (width < 1280) return true; // tablet & small desktop: collapsed by default
    return false; // large desktop: not collapsed
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    () => window.innerWidth >= 768 && window.innerWidth < 1280
  );
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/admin/dashboard");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1280);
      // Collapse sidebar on tablet & small desktop, expand on large desktop, keep as is on mobile
      if (width < 768) {
        setIsCollapsed(false);
      } else if (width < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      // Reset search expansion when switching to desktop
      if (width >= 768) {
        setIsSearchExpanded(false);
      }
    };
    window.addEventListener("resize", handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  const handleSearchBlur = () => {
    // Only collapse on mobile when losing focus
    if (isMobile) {
      setIsSearchExpanded(false);
    }
  };

  return (
    // Use flex so sidebar and main sit side by side on desktop
    // Use min-h-screen so page can grow taller if sidebar/content expands
    <div className="app-container flex flex-col min-h-screen bg-[linear-gradient(to_bottom_right,_#FFFFFF_0%,_#EDF4FA_26%,_#DEEAF6_98%)] overflow-hidden">
      {/*
        Main wrapper: flex-1 so it grows to fill available space.
        Removed internal overflow-auto: when sidebar expands, page scroll appears.
      */}
      <div className="flex flex-1 w-full pr-4 ">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobile={isMobile}
        />
        <SidebarContext.Provider value={{ isCollapsed }}>
          <main className="flex-1 transition-all duration-300 rounded-3xl ml-4 min-h-full">
            <div
              className={`flex items-center justify-between  w-full ${
                isMobile ? "px-4" : "p-2"
              }`}
            >
              {/* Left side: Search bar (conditionally rendered) */}
              <div className={`flex-shrink-0 ${!isDashboard && "invisible"}`}>
                {/* Mobile: Show only icon or expanded search */}
                {/* {isMobile ? (
                  <div className="relative p-1">
                    {!isSearchExpanded ? (
                      // Collapsed state: just the search icon
                      <button
                        onClick={handleSearchToggle}
                        className="w-10 h-10 flex items-center justify-center rounded-[6px]  hover:bg-gray-50 transition-colors ml-8"
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 22 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.83334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
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
                      // Expanded state: full search bar
                      <div className="relative w-[190px] h-[35px] ml-8">
                        <div className="absolute inset-y-0 left-[16.8px] flex items-center pointer-events-none">
                          <svg
                            width="22"
                            height="22"
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
                          placeholder="Search here..."
                          className="w-full h-full pl-12 pr-4 rounded-[6px] bg-white text-[#787374] placeholder-[#787374] focus:outline-none focus:ring-2 focus:ring-Duskwood-500"
                          style={{
                            fontSize: "14px",
                            lineHeight: "17px",
                          }}
                          onBlur={handleSearchBlur}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop: Always show full search bar
                  <div className="relative w-[417px] h-[44px]">
                    <div className="absolute inset-y-0 left-[16.8px] flex items-center pointer-events-none">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.83334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z"
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
                      placeholder="Search here..."
                      className="w-full h-full pl-12 pr-4 rounded-[6px] bg-white text-[#787374] placeholder-[#787374] focus:outline-none focus:ring-2 focus:ring-Duskwood-500"
                      style={{
                        fontSize: "14px",
                        lineHeight: "17px",
                      }}
                    />
                  </div>
                )} */}
              </div>
              {/* Right side: Icons container */}
              {/* <div
                className={`flex items-center gap-2 ${isMobile ? "" : "mr-5"}`}
              >
                <img src="/calendar-2.svg" alt="Calendar" className="w-6 h-6" />
                <img
                  src="/message-question.svg"
                  alt="Message"
                  className="w-6 h-6"
                />
                <img
                  src="/notification.svg"
                  alt="Notification"
                  className="w-6 h-6"
                />
              </div> */}
            </div>

            <div  className={`py-4 md:py-6 lg:py-8 w-full  ${
    isCollapsed ? "lg:pr-12" : "lg:pr-2"
  }`}>
              <Outlet />
            </div>
          </main>
        </SidebarContext.Provider>
      </div>
    </div>
  );
}

import React from "react";
import { BsCardChecklist } from "react-icons/bs";

const Container1 = ({
  leads,
  newToday,
  increasePercent,
  gradient = "linear-gradient(45deg, white, #e6f4fb)",
  icon, // Accept a React element for the icon
  totalLeadsLabel = "Total Customers",
}) => {
  return (
    <div
      className="relative inline-block p-[3px] mx-auto md:mx-0 rounded-2xl overflow-hidden w-[23%] min-w-[260px] "
      style={{
        backgroundImage: `linear-gradient(to top right, transparent 70%, #ee7f1b)`,
        backgroundPosition: ``, // Removed, as no longer needed
        backgroundSize: ``, // Removed, as no longer needed
      }}
    >
      {/* Glow effect */}
      <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#ee7f1b] rounded-full blur-[30px] pointer-events-none z-0" />

      {/* Inner content */}
      <div
        className="relative z-10 rounded-[14px] min-h-[130px] px-5 pt-5 pb-3 flex flex-col -ml-1.5 justify-center "
        style={{ background: gradient }}
      >
        {/* Top Content */}
        <div>
          <div className="flex justify-between">
            <div>
              {leads !== undefined && leads !== null && (
                <>
                  <div className="text-[#ef7e1b] text-[25px] font-extrabold font-quicksand">
                    {leads}+
                  </div>
                  <div className="text-black font-semibold">
                    {totalLeadsLabel}
                  </div>
                </>
              )}
            </div>
            <div className="bg-[#3498DB33] rounded-full w-[60px] h-[60px] flex justify-center items-center -mt-1.5">
              {icon && (
                <span className="w-[30px] h-[30px] flex items-center justify-center text-[30px] text-[#ef7e1b]">
                  {icon}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Container1;

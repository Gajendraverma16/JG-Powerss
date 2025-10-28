import React from "react";
import { BsCardChecklist } from "react-icons/bs";

const Container1 = ({
  leads,
  newToday,
  increasePercent,
  gradient = "linear-gradient(45deg, white, #e6f4fb)",
  iconSrc = "/task-square.png",
}) => {
  return (
    <div
      className="relative inline-block p-[3px] rounded-2xl overflow-hidden w-[23%] min-w-[220px] mx-[0.5%]"
      style={{
        backgroundImage: `linear-gradient(to top right, transparent 70%, #0e4053)`,
        backgroundPosition: ``, // Removed, as no longer needed
        backgroundSize: ``, // Removed, as no longer needed
      }}
    >
      {/* Glow effect */}
      <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#a3c9f1] rounded-full blur-[30px] pointer-events-none z-0" />

      {/* Inner content */}
      <div
        className="relative z-10 rounded-[14px] min-h-[130px] px-5 pt-5 pb-3 flex flex-col -ml-1.5"
        style={{ background: gradient }}
      >
        {/* Top Content */}
        <div>
          <div className="flex justify-between">
            <div>
              {Customers !== undefined && Customers !== null && (
                <>
                  <div className="text-[#ef7e1b] text-[25px] font-extrabold font-quicksand">
                    {Customers}+
                  </div>
                  <div className="text-black font-semibold">Total Customers</div>
                </>
              )}
            </div>
            <div className="bg-[rgba(52,152,219,0.2)] rounded-full w-[60px] h-[60px] flex justify-center items-center -mt-1.5">
              <img
                src={iconSrc}
                alt="task icon"
                className="w-[30px] h-[30px] object-contain"
              />
            </div>
          </div>

          {/* New Today */}
          {newToday !== undefined && newToday !== null && (
            <div className="text-gray-500 text-xs mt-1">{`New Today: ${newToday}`}</div>
          )}
        </div>

        {/* Bottom Increase Percent */}
        <div className="flex-1 relative">
          {increasePercent !== undefined && increasePercent !== null && (
            <div className="absolute bottom-0 flex items-center gap-2 text-xs -mb-1.5">
              <span className="text-green-500 font-medium flex items-center text-xs">
                <span
                  className="inline-block mr-1"
                  style={{ transform: "rotate(30deg)", fontSize: "12px" }}
                >
                  ↑
                </span>
                {increasePercent}%
              </span>
              <span className="text-gray-500 text-xs">from last week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Container1;

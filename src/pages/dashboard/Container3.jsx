import React from "react";

const Container3 = ({
  leads,
  gradient = "linear-gradient(45deg, white, #e6f4fb)",
  icon,
  totalLeadsLabel = "Assigned Villages",
}) => {
  return (
    <div
      className="relative inline-block p-[3px] mx-auto md:mx-0 rounded-2xl overflow-hidden w-[23%] min-w-[260px]"
      style={{
        backgroundImage: `linear-gradient(to top right, transparent 70%, #ee7f1b)`,
      }}
    >
      {/* Glow Effect */}
      <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#ee7f1b] rounded-full blur-[30px] pointer-events-none z-0" />

      {/* Inner Card */}
      <div
        className="relative z-10 rounded-[14px] min-h-[150px] px-5 pt-5 pb-3 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        style={{ background: gradient }}
      >
        {/* Top Section */}
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

            {/* Icon */}
            <div className="bg-[#3498DB33] rounded-full w-[60px] h-[60px] flex justify-center items-center -mt-1.5">
              {icon && (
                <span className="w-[30px] h-[30px] flex items-center justify-center text-[30px] text-[#ef7e1b]">
                  {icon}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Empty Space */}
        <div className="mt-4 text-[14px] font-semibold h-[20px] opacity-0">
          Placeholder
        </div>
      </div>
    </div>
  );
};

export default Container3;

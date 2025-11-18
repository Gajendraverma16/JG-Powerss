
import React from "react";
import { useNavigate } from "react-router-dom";

const ContainerActions = ({ 
  gradient = "linear-gradient(45deg, white, #e6f4fb)",
  icon,                      
  totalLeadsLabel = "Quick Actions" }) => {

      const navigate = useNavigate();

  return (
    <div
      className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                 w-full sm:w-[48%] lg:w-[23%] min-w-[280px]"
      style={{
        backgroundImage: `linear-gradient(to top right, transparent 70%, #ee7f1b)`,
      }}
    >
      {/* Glow Effect */}
      <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#ee7f1b] rounded-full blur-[30px]" />

      {/* Inner Card */}
      <div
        className="relative z-10 rounded-[14px] min-h-[150px] h-full
                   px-5 pt-5 pb-4 flex flex-col justify-between
                   shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
      >
        {/* Title + Icon Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="text-[#ef7e1b] font-bold text-[20px]">
            Quick Actions
          </div>

          {/*  Icon  */}
          <div className="bg-[#3498DB33] rounded-full w-[55px] h-[55px] flex justify-center items-center mt-1">
            {icon && (
              <span className="w-[28px] h-[28px] flex items-center justify-center text-[28px] text-[#ef7e1b]">
                {icon}
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
           onClick={() => navigate("/leads/all")}
            className="w-full py-2.5 text-sm font-semibold rounded-xl 
                       bg-[#003a72] text-white shadow hover:opacity-90"
          >
            View Customer
          </button>

          <button
            onClick={() => navigate("/Order/new")}
            className="w-full py-2.5 text-sm font-semibold rounded-xl 
                       bg-[#003a72] text-white shadow hover:opacity-90"
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContainerActions;















import React from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

const Quotation = ({
  leads = 200,
  newToday = 15,
  increasePercent = "2.50%",
  gradient = "linear-gradient(45deg, white, #e6f4fb)",
}) => {
  return (
    <div
      className="relative inline-block p-[3px] rounded-2xl overflow-hidden w-[23%] min-w-[240px] mx-[0.5%]"
      style={{
        backgroundImage: `
          linear-gradient(to right, white, #0e4053),
          linear-gradient(to bottom, #0e4053, #a3c9f1),
          linear-gradient(to right, white, #a3c9f1),
          linear-gradient(to bottom, white, white)
        `,
        backgroundPosition: `
          top left,
          top right,
          bottom left,
          top left
        `,
        backgroundSize: `
          100% 2px,
          2px 100%,
          100% 2px,
          2px 100%
        `,
      }}
    >
      {/* Glow effect */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[100px] bg-[#a3c9f1] rounded-full blur-[30px] pointer-events-none z-0" />

      {/* Inner content */}
      <div
        className="relative z-10 rounded-[14px] min-h-[240px] px-5 pt-5 pb-3 flex flex-col -ml-1.5"
        style={{ background: gradient }}
      >
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div>Average Shop Owners</div>
          <div>
            <BsThreeDotsVertical />
          </div>
        </div>
        <div>
          <div>Number ofLeds per week</div>
        </div>
      </div>
    </div>
  );
};

export default Quotation;

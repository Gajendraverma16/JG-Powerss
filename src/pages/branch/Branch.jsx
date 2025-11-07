import React from "react";
import { TbDotsVertical } from "react-icons/tb";

const Branch = () => {
  const roles = [{ id: 1, name: "Sales man" }];

  return (
    <div className="w-full px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto flex min-h-[440px] max-w-5xl flex-col rounded-[18px] border border-white/60 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E7F4FF] p-6 shadow-[0px_20px_45px_rgba(20,84,182,0.08)] md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1F2837]">
            <span className="inline-block border-b-2 border-[#0e4053] pb-1">Roles</span>
          </h1>
          <button className="h-[44px] rounded-[10px] bg-[#ef7e1b] px-6 text-sm font-medium text-white shadow-[0px_6px_18px_rgba(239,126,27,0.4)] transition-colors hover:bg-[#ee7f1b]">
            Add Role
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-[16px] border border-[#E3ECF7] bg-gradient-to-br from-white to-[#F6FAFF]">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-3/4" />
              <col className="w-1/4" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#DFE8F6] text-left text-[#4B5563]">
                <th className="py-4 px-6 text-sm font-medium">Role</th>
                <th className="py-4 px-6 text-sm font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="py-12 px-6 text-center text-sm font-medium text-[#6B7280]"
                  >
                    No roles available.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-[#E9F1FF] text-[#1F2837] last:border-b-0"
                  >
                    <td className="whitespace-nowrap py-5 px-6 text-sm font-medium">
                      {role.name}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#4B5563] transition-colors hover:bg-[#F1F5FB]">
                        <TbDotsVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Branch;

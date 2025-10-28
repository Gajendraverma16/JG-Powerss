import React, { useState, useEffect } from 'react';

/**
 * DataContainer: A reusable container component for list-based UIs with title, search, pagination, and mobile responsiveness.
 *
 * Props:
 * - title: string - Title to display in header.
 * - fetchData: () => Promise<Array> - Async function to fetch the data array.
 * - searchFields: string[] - Keys in each item to filter by searchTerm (case-insensitive).
 * - itemsPerPageOptions: number[] - Options for items per page dropdown.
 * - defaultItemsPerPage: number - Initial items per page.
 * - actions: JSX.Element - Actions to show in header (e.g., Create button).
 * - children: function - Render prop receiving container state and helper functions: {
 *       currentItems: Array,
 *       filteredItems: Array,
 *       searchTerm: string,
 *       onSearchChange: (e) => void,
 *       isMobile: boolean,
 *       isSearchExpanded: boolean,
 *       toggleSearch: () => void,
 *       onSearchBlur: () => void,
 *       itemsPerPage: number,
 *       onItemsPerPageChange: (newCount) => void,
 *       currentPage: number,
 *       totalPages: number,
 *       onPreviousPage: () => void,
 *       onNextPage: () => void,
 *       loading: boolean,
 *       error: string | null,
 *   } => JSX
 *
 * Usage Example:
 *
 * <DataContainer
 *   title="Users"
 *   fetchData={async () => { const res = await api.get('/userlist'); return res.data.result; }}
 *   searchFields={[ 'name', 'email', 'phoneno', 'address' ]}
 *   itemsPerPageOptions={[5, 10, 20, 50]}
 *   defaultItemsPerPage={10}
 *   actions={<button onClick={openCreateModal}>Create User</button>}
 * >
 *   {({ currentItems, filteredItems, searchTerm, onSearchChange, isMobile, isSearchExpanded, toggleSearch, onSearchBlur, itemsPerPage, onItemsPerPageChange, currentPage, totalPages, onPreviousPage, onNextPage, loading, error }) => (
 *     <> // Render table or cards here using currentItems
 *       {loading ? (
 *         <div className="w-full min-h-[200px] flex items-center justify-center">Loading...</div>
 *       ) : error ? (
 *         <div className="text-red-600">{error}</div>
 *       ) : (
 *         <>
 *           {/* Example: render table for desktop */}
 *           <div className="hidden md:block w-full">
 *             <table className="w-full border-collapse">
 *               <thead>...</thead>
 *               <tbody>
 *                 {currentItems.map(item => (
 *                   <tr key={item.id}>...</tr>
 *                 ))}
 *               </tbody>
 *             </table>
 *           </div>
 *           {/* Mobile cards */}
 *           <div className="md:hidden space-y-4">
 *             {currentItems.map(item => (
 *               <div key={item.id} className="bg-white p-4 rounded-lg shadow">...</div>
 *             ))}
 *           </div>
 *         </>
 *       )}
 *     </>
 *   )}
 * </DataContainer>
 */

const DataContainer = ({
  title,
  fetchData,
  searchFields = [],
  itemsPerPageOptions = [5, 10, 20, 50],
  defaultItemsPerPage = 10,
  actions = null,
  children,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchData();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error fetching data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSearchExpanded(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter items by searchTerm
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return searchFields.some(key => {
      const val = item[key];
      return typeof val === 'string' && val.toLowerCase().includes(lower);
    });
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when searchTerm or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Handlers
  const onSearchChange = e => setSearchTerm(e.target.value);
  const toggleSearch = () => setIsSearchExpanded(prev => !prev);
  const onSearchBlur = () => {
    if (isMobile) setIsSearchExpanded(false);
  };

  const onItemsPerPageChange = newCount => setItemsPerPage(newCount);
  const onPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  const onNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Header JSX
  const renderHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      {/* Title */}
      <h1 className="text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap">
        {title}
      </h1>

      {/* Search Container */}
      <div className="flex-1 max-w-[400px] mx-1">
        {isMobile && !isSearchExpanded ? (
          <button
            onClick={toggleSearch}
            className="w-10 h-10 flex items-center rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            {/* search icon SVG */}
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z" stroke="#787374" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.3333 18.3333L20.1667 20.1667" stroke="#787374" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <div className="relative w-full">
            {/* Search icon inside input */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.5417 19.25C15.3512 19.25 19.25 15.3512 19.25 10.5417C19.25 5.73223 15.3512 1.83334 10.5417 1.83334C5.73223 1.83334 1.83334 5.73223 1.33334 10.5417C1.83334 15.3512 5.73223 19.25 10.5417 19.25Z" stroke="#787374" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.3333 18.3333L20.1667 20.1667" stroke="#787374" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <input
              type="search"
              placeholder={isMobile ? 'Search' : 'Search'}
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full h-[44px] pl-12 pr-4 bg-[#E9F1F9] rounded-[6px] text-[#787374] placeholder-[#787374] focus:outline-none text-sm md:text-base"
              onBlur={onSearchBlur}
              autoFocus={isMobile && isSearchExpanded}
            />
          </div>
        )}
      </div>

      {/* Actions Slot */}
      {actions && (
        <div className="flex items-center gap-3 md:gap-4">
          {actions}
        </div>
      )}

      {/* Items per page dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-[#727A90] text-sm md:text-base whitespace-nowrap">Display</span>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={e => onItemsPerPageChange(parseInt(e.target.value, 10))}
            className="appearance-none h-[44px] pl-3 pr-10 min-w-[72px] md:min-w-[88px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-sm md:text-base focus:outline-none"
          >
            {itemsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <img src="/caret-down.svg" alt="" aria-hidden="true" className="pointer-events-none absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-4 h-4" />
        </div>
      </div>
    </div>
  );

  // Pagination Controls JSX
  const renderPagination = () => (
    filteredItems.length > 0 && (
      <div className="flex justify-center p-4 md:p-6 mt-8">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Previous Page */}
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 1}
            className={`w-[44px] h-[44px] md:w-[52px] md:h-[52px] rounded-full border border-[#7E7B7B] flex items-center justify-center transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'group hover:bg-Duskwood-200 '}`}
          >
            <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`stroke-current text-[#7E7B7B] ${currentPage === 1 ? '' : 'group-hover:text-white'}`}>
              <path d="M23.1667 5.33398L12.06 13.3873C9.09198 15.5407 9.09198 16.462 12.06 18.614L23.1667 26.6673" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Page Info */}
          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
            <span>Page {currentPage} of {totalPages}</span>
            <span>({filteredItems.length} total)</span>
          </div>

          {/* Next Page */}
          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            className={`w-[44px] h-[44px] md:w-[52px] md:h-[52px] rounded-full border border-[#7E7B7B] flex items-center justify-center transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'group hover:bg-Duskwood-200 '}`}
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={`stroke-current text-[#7E7B7B] ${currentPage === totalPages ? '' : 'group-hover:text-white'}`}>
              <circle cx="26" cy="26" r="25.5" strokeWidth="1" />
              <path d="M20.8333 15.334L31.94 23.3873C34.908 25.5407 34.908 26.462 31.94 28.614L20.8333 36.6673" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    )
  );

  return (
    <div className="w-full min-h-[200px] p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)]">
      {renderHeader()}
      {/* Optional search results info */}
      {searchTerm && (
        <div className="mb-4 text-sm text-[#4B5563]">
          Showing {filteredItems.length} results for "{searchTerm}"
        </div>
      )}
      {/* Children render function for list content */}
      {children({
        currentItems,
        filteredItems,
        searchTerm,
        onSearchChange,
        isMobile,
        isSearchExpanded,
        toggleSearch,
        onSearchBlur,
        itemsPerPage,
        onItemsPerPageChange,
        currentPage,
        totalPages,
        onPreviousPage,
        onNextPage,
        loading,
        error,
      })}
      {renderPagination()}
    </div>
  );
};

export default DataContainer;

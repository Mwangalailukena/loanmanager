import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [loanDetailOpen, setLoanDetailOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const openLoanDetail = useCallback((loanId) => {
    setSelectedLoanId(loanId);
    setLoanDetailOpen(true);
  }, []);

  const closeLoanDetail = useCallback(() => {
    setLoanDetailOpen(false);
    setSelectedLoanId(null);
  }, []);


  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleMobileSearchOpen = useCallback(() => {
    setIsMobileSearchOpen(true);
  }, []);

  const handleMobileSearchClose = useCallback(() => {
    setIsMobileSearchOpen(false);
    setSearchTerm(''); // Clear search when closing mobile search
  }, []);

  const value = useMemo(() => ({
    searchTerm,
    setSearchTerm,
    handleSearchChange,
    isMobileSearchOpen,
    handleMobileSearchOpen,
    handleMobileSearchClose,
    loanDetailOpen,
    selectedLoanId,
    openLoanDetail,
    closeLoanDetail,
  }), [
    searchTerm,
    isMobileSearchOpen,
    loanDetailOpen,
    selectedLoanId,
    handleSearchChange,
    handleMobileSearchOpen,
    handleMobileSearchClose,
    openLoanDetail,
    closeLoanDetail
  ]);

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

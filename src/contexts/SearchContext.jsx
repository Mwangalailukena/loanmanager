import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [loanDetailOpen, setLoanDetailOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const openLoanDetail = (loanId) => {
    setSelectedLoanId(loanId);
    setLoanDetailOpen(true);
  };

  const closeLoanDetail = () => {
    setLoanDetailOpen(false);
    setSelectedLoanId(null);
  };


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

  const value = {
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
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

import React from 'react';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import { useSearch } from '../contexts/SearchContext';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useNavigate } from 'react-router-dom';
import SearchResultsList from './SearchResultsList';

const SearchResults = ({ anchorEl, onClose, variant = 'popover' }) => {
  const { searchTerm, setSearchTerm, openLoanDetail } = useSearch();
  const { borrowers, loans } = useFirestore();
  const navigate = useNavigate();

  

  const handleBorrowerClick = (borrowerId) => {
    navigate(`/borrowers/${borrowerId}`);
    setSearchTerm('');
    if (onClose) onClose();
  };

  const handleLoanClick = (loanId) => {
    openLoanDetail(loanId);
    setSearchTerm('');
    if (onClose) onClose();
  };

  const lowercasedSearchTerm = searchTerm.toLowerCase();

  const filteredBorrowers = searchTerm ? borrowers.filter(borrower =>
    borrower.name.toLowerCase().startsWith(lowercasedSearchTerm) ||
    (borrower.phone && borrower.phone.includes(searchTerm))
  ).slice(0, 5) : [];

  const enrichedLoans = searchTerm ? loans.map(loan => {
    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    return {
      ...loan,
      borrowerName: borrower ? borrower.name : (loan.borrower || 'Unknown Borrower')
    };
  }) : [];

  const filteredLoans = searchTerm ? enrichedLoans.filter(loan =>
    loan.borrowerName.toLowerCase().startsWith(lowercasedSearchTerm)
  ).slice(0, 5) : [];

  const resultsList = (
    <SearchResultsList
      filteredBorrowers={filteredBorrowers}
      filteredLoans={filteredLoans}
      onBorrowerClick={handleBorrowerClick}
      onLoanClick={handleLoanClick}
    />
  );

  if (variant === 'popover') {
    return (
      <Popover
        open={Boolean(anchorEl) && searchTerm.length > 0}
        anchorEl={anchorEl}
        onClose={() => {
          setSearchTerm('');
          if (onClose) onClose();
        }}
        disableAutoFocus
        disableEnforceFocus
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: anchorEl ? anchorEl.clientWidth : '350px',
            marginTop: '8px',
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        {resultsList}
      </Popover>
    );
  }

  return (
    <Paper sx={{ position: 'absolute', top: 60, right: 20, left: 20, zIndex: 1300 }}>
      {resultsList}
    </Paper>
  );
};

export default SearchResults;
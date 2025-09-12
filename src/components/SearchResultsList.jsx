import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';

const SearchResultsList = ({ filteredBorrowers, filteredLoans, onBorrowerClick, onLoanClick }) => {
  if (filteredBorrowers.length === 0 && filteredLoans.length === 0) {
    return (
      <ListItem>
        <ListItemText primary="No results found" />
      </ListItem>
    );
  }

  return (
    <List>
      {filteredBorrowers.map(borrower => (
        <ListItem button key={borrower.id} onClick={() => onBorrowerClick(borrower.id)}>
          <ListItemText primary={borrower.name} secondary="Borrower" />
        </ListItem>
      ))}
      {filteredLoans.map(loan => (
        <ListItem button key={loan.id} onClick={() => onLoanClick(loan.id)}>
          <ListItemText primary={`Loan for ${loan.borrowerName}`} secondary={`Amount: ${loan.principal}`} />
        </ListItem>
      ))}
    </List>
  );
};

export default SearchResultsList;

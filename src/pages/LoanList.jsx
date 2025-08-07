// src/components/LoanList.jsx
// ... (imports and other code remain the same)

export default function LoanList({ globalSearchTerm }) {
  // ... (state and functions remain the same)

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* ... (top filters and desktop view code remain the same) */}

      {loadingLoans ? (
        // ... (loading state remains the same)
      ) : (
        <>
          {isMobile ? (
            <>
              <AnimatePresence>
                {displayedLoans.map((loan, index) => {
                  const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
                  const isPaid = calcStatus(loan).toLowerCase() === "paid";
                  return (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      layout
                      style={{
                        marginBottom: 12,
                        boxShadow: theme.shadows[1],
                        borderRadius: theme.shape.borderRadius,
                        borderLeft: `5px solid ${theme.palette.secondary.main}`,
                        padding: 12,
                        background: theme.palette.background.paper,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600" noWrap>
                            {loan.borrower}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {loan.phone}
                          </Typography>
                        </Box>
                        
                        {/* New: This Stack is only visible when the row is COLLAPSED.
                          It shows the status and outstanding amount.
                        */}
                        {expandedRow !== loan.id && (
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />
                            <Typography 
                              variant="body2" 
                              fontWeight="bold" 
                              color="secondary.main" 
                              noWrap
                            >
                              ZMW {outstanding.toFixed(2)}
                            </Typography>
                          </Stack>
                        )}
                        
                        <IconButton size="small" onClick={() => toggleRow(loan.id)} aria-label="expand" color="secondary">
                          {expandedRow === loan.id ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                        </IconButton>
                      </Stack>
                      <Collapse in={expandedRow === loan.id} timeout="auto" unmountOnExit>
                        <Box mt={1} fontSize="0.85rem" sx={{ color: theme.palette.text.secondary }}>
                          <Typography noWrap>Principal: ZMW {Number(loan.principal).toFixed(2)}</Typography>
                          <Typography noWrap>Interest: ZMW {Number(loan.interest).toFixed(2)}</Typography>
                          <Typography noWrap>Total Repayable: ZMW {Number(loan.totalRepayable).toFixed(2)}</Typography>
                          
                          {/* New: This is the detailed view inside the collapse.
                            It now includes the Outstanding amount and Status, as you requested.
                          */}
                          <Typography noWrap>Outstanding: <Typography component="span" fontWeight="bold" color="secondary.main">{outstanding.toFixed(2)}</Typography></Typography>
                          <Typography noWrap>Start: {loan.startDate}</Typography>
                          <Typography noWrap>Due: {loan.dueDate}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                            <Typography component="span" noWrap sx={{ mr: 1, color: 'text.secondary', fontSize: '0.85rem' }}>Status:</Typography>
                            <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />
                          </Box>
                          
                          <Stack direction="row" spacing={0.5} mt={1} justifyContent="flex-start">
                            <Tooltip title="Edit">
                              <span>
                                <IconButton size="small" onClick={() => openEditModal(loan)} aria-label="edit" disabled={isPaid} color="secondary">
                                  <Edit fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <span>
                                <IconButton size="small" color="error" onClick={() => setConfirmDelete({ open: true, loanId: loan.id })} aria-label="delete" disabled={isPaid}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Add Payment">
                              <span>
                                <IconButton size="small" onClick={() => openPaymentModal(loan.id)} aria-label="payment" disabled={isPaid} color="secondary">
                                  <Payment fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton size="small" onClick={() => openHistoryModal(loan.id)} aria-label="history" color="secondary">
                                <History fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Collapse>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {useInfiniteScroll && displayedLoans.length < filteredLoans.length && (
                // ... (loading more spinner remains the same)
              )}
            </>
          ) : (
            // ... (desktop view code remains the same)
          )}
          {/* ... (no loans message and dialogs remain the same) */}
        </>
      )}
      {/* ... (dialogs and snackbar remain the same) */}
    </Box>
  );
}


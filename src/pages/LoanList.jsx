// src/pages/LoanList.jsx

import React, { useState, useEffect } from "react"; import { Box, Typography, TextField, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Button, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Stack, } from "@mui/material"; import { Edit, Delete } from "@mui/icons-material"; import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"; import { db } from "../firebase"; import LoanModal from "../components/LoanModal";

const LoanList = () => { const [loans, setLoans] = useState([]); const [search, setSearch] = useState(""); const [filteredLoans, setFilteredLoans] = useState([]); const [selectedLoan, setSelectedLoan] = useState(null); const [editOpen, setEditOpen] = useState(false); const isMobile = useMediaQuery("(max-width:600px)");

useEffect(() => { fetchLoans(); }, []);

const fetchLoans = async () => { const snapshot = await getDocs(collection(db, "loans")); const loansData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); setLoans(loansData); setFilteredLoans(loansData); };

useEffect(() => { const lowerSearch = search.toLowerCase(); const filtered = loans.filter((loan) => loan.name.toLowerCase().includes(lowerSearch) ); setFilteredLoans(filtered); }, [search, loans]);

const handleDelete = async (id) => { await deleteDoc(doc(db, "loans", id)); fetchLoans(); };

const openEditModal = (loan) => { setSelectedLoan(loan); setEditOpen(true); };

return ( <Box p={2}> <Typography variant="h5" gutterBottom> Loan List </Typography>

<TextField
    label="Search by name"
    variant="outlined"
    fullWidth
    margin="normal"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Phone</TableCell>
        <TableCell>Amount</TableCell>
        <TableCell>Interest</TableCell>
        <TableCell>Total</TableCell>
        <TableCell>Start</TableCell>
        <TableCell>Due</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredLoans.map((loan) => (
        <TableRow key={loan.id}>
          <TableCell>{loan.name}</TableCell>
          <TableCell>{loan.phone}</TableCell>
          <TableCell>{loan.amount}</TableCell>
          <TableCell>{loan.interest}</TableCell>
          <TableCell>{loan.totalRepayable}</TableCell>
          <TableCell>{loan.startDate}</TableCell>
          <TableCell>{loan.dueDate}</TableCell>
          <TableCell align="right">
            <IconButton onClick={() => openEditModal(loan)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => handleDelete(loan.id)}>
              <Delete />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  {selectedLoan && (
    <LoanModal
      open={editOpen}
      onClose={() => setEditOpen(false)}
      loan={selectedLoan}
      onSuccess={fetchLoans}
    />
  )}
</Box>

); };

export default LoanList;


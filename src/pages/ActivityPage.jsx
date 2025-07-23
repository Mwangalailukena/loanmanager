// src/pages/ActivityPage.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { motion, AnimatePresence } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function ActivityPage() {
  const { activityLogs } = useFirestore();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredLogs = useMemo(() => {
    return activityLogs
      .filter((log) => {
        if (filterType !== "all" && log.type !== filterType) return false;
        if (
          search &&
          !log.description.toLowerCase().includes(search.toLowerCase()) &&
          !(log.user && log.user.toLowerCase().includes(search.toLowerCase()))
        )
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [activityLogs, filterType, search]);

  return (
    <Box p={3} maxWidth={700} mx="auto">
      <Typography variant="h4" gutterBottom>
        Activity Log
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="loan_creation">Loan Creation</MenuItem>
            <MenuItem value="edit">Edit</MenuItem>
            <MenuItem value="payment">Payment</MenuItem>
            <MenuItem value="login">Login</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <List>
        <AnimatePresence>
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={itemVariants}
            >
              <ListItem alignItems="flex-start" divider>
                <ListItemText
                  primary={`${log.user ?? "Unknown User"} - ${
                    log.type
                      ? log.type.replace("_", " ").toUpperCase()
                      : "UNKNOWN"
                  }`}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : "No Date"}
                      </Typography>
                      {" — " + (log.description ?? "")}
                    </>
                  }
                />
              </ListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </List>
    </Box>
  );
}


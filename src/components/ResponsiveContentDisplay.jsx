"use client";

import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ResponsiveContentDisplay = ({ sections }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [expandedPanel, setExpandedPanel] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  if (isDesktop) {
    return (
      <Grid container spacing={isDesktop ? 3 : 2}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.id}>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 1.5, color: theme.palette.primary.main }}>{section.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{section.title}</Typography>
              </Box>
              {typeof section.content === 'string' ? (
                <Typography variant="body2" color="text.secondary">{section.content}</Typography>
              ) : (
                section.content
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  } else {
    // Mobile View: Accordion
    return (
      <Box>
        {sections.map((section) => (
          <Accordion
            key={section.id}
            expanded={expandedPanel === section.id}
            onChange={handleChange(section.id)}
            sx={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              border: 'none',
              '&:before': { // Remove default accordion border/shadow on expanded
                display: 'none',
              },
              borderBottom: `1px solid ${theme.palette.divider}`, // 1px bottom divider
              '&:last-child': {
                borderBottom: 'none', // No border for the last item
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />}
              aria-controls={`${section.id}-content`}
              id={`${section.id}-header`}
              sx={{
                py: 1, // Padding vertical
                px: 0, // No horizontal padding for header
                '& .MuiAccordionSummary-content': {
                  my: 0, // Reduce margin for content inside summary
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 1.5, color: theme.palette.text.secondary }}>{section.icon}</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{section.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pb: 2, pt: 0 }}> {/* No horizontal padding, adjust bottom/top */}
              {typeof section.content === 'string' ? (
                <Typography variant="body2" color="text.secondary">{section.content}</Typography>
              ) : (
                section.content
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }
};

export default ResponsiveContentDisplay;

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ConversationHeaderProps {
  title: string;
  subtitle: React.ReactNode;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box
      data-testid="conversation-header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        padding: 2,
        height: 'auto',
        minHeight: '80px'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
};

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ConversationHeaderProps {
  title: string;
  subtitle: React.ReactNode;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  title,
  subtitle
}) => {
  return (
    <Box
      data-testid="conversation-header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: 'appBar'
      }}
    >
      <Typography variant="h6" component="h1">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
};

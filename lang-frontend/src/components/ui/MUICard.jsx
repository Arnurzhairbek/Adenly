import { memo } from "react";
import { Card as MUICard, CardContent, useTheme } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Обертка для MUI Card с нашим дизайном
 */
function MUICardWrapper({ children, className = "", hover = false, onClick, sx = {}, ...props }) {
  const theme = useTheme();
  
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(88, 28, 135, 0.7) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
    cursor: onClick || hover ? 'pointer' : 'default',
    '&:hover': (onClick || hover) ? {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
      borderColor: 'rgba(139, 92, 246, 0.5)',
    } : {},
    ...sx,
  };

  const CardComponent = (
    <MUICard
      onClick={onClick}
      sx={cardStyle}
      className={className}
      {...props}
    >
      <CardContent sx={{ p: 3 }}>
        {children}
      </CardContent>
    </MUICard>
  );

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={hover ? { scale: 1.02 } : {}}
        transition={{ duration: 0.2 }}
      >
        {CardComponent}
      </motion.div>
    );
  }

  return CardComponent;
}

export default memo(MUICardWrapper);


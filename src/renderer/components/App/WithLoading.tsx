import { Box } from '@mui/material';
import React, { useState } from 'react';
import Loading, { LoadingProps } from './Loading';
type WithLoadingProps = {
  children: React.ReactNode;
  loadingProps: LoadingProps;
};
const WithLoading = ({ children, loadingProps }: WithLoadingProps) => {
  const [animationFinished, setAnimationFinished] = useState<boolean>(false);
  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          visibility: animationFinished ? 'visible' : 'hidden',
        }}
      >
        {children}
      </Box>
      <Loading {...loadingProps} setAnimationFinished={setAnimationFinished} />
    </Box>
  );
};

export default WithLoading;

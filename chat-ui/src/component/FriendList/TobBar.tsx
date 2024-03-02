import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const TopBar = () => {
  return (
    <Box sx={{ flexGrow: 1, px: "16px", py: "8px" }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography variant="h5" component="h2">
            Chat
          </Typography>
        </Grid>
        <Grid item xs={4}>
          ....
        </Grid>
      </Grid>
    </Box>
  );
};

export default TopBar;

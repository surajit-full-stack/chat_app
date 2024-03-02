"use client"
import React, { useState } from "react";
import { Box, Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import AddIcon from "@mui/icons-material/Add";
import MicIcon from "@mui/icons-material/Mic";
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
type InputSectionProps = {
  getInputValue: (message: string) => void;
};
const InputSection = ({ getInputValue }: InputSectionProps) => {
  const [inputValue, setInputValue] = useState('');
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid alignItems="center" container>
        <Grid item xs={1} display="flex" justifyContent="space-around">
          <InsertEmoticonIcon />
          <AddIcon />
        </Grid>

        <Grid item xs={10}>
          <TextField
          value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            fullWidth
            placeholder="Type a message..."
            id="fullWidth"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                   
                    onClick={()=>{
                      setInputValue("")
                      getInputValue(inputValue)
                    }}
                    edge="end"
                  >
                 <  KeyboardDoubleArrowUpIcon/>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid display="flex" justifyContent="center" item xs={1}>
          <MicIcon />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InputSection;

"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Box, CssBaseline, Grid } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TopBar from "@/component/FriendList/TobBar";
import FriendList from "@/component/FriendList/Index";

const inter = Inter({ subsets: ["latin"] });

export const mainTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={mainTheme}>
          <CssBaseline />
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid sx={{ borderRight: "1px solid black" }} item xs={3}>
                <TopBar />
                <Box
                  sx={{ maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}
                >
                  <FriendList />
                </Box>
              </Grid>
              {children}
            </Grid>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}

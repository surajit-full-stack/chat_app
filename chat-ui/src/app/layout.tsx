"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Box, CssBaseline, Grid, useMediaQuery } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TopBar from "@/component/FriendList/TobBar";
import FriendList from "@/component/FriendList/Index";
import { cacheStore } from "@/cache/chatStore";
import { useParams } from "next/navigation";

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
  const { auth } = cacheStore();
  const isSmallScreen = useMediaQuery("(max-width:600px)");
  const isLargeScreen = useMediaQuery("(min-width:1200px)");
  const chat = !!useParams().friendId;
  const SideBar = () => (
    <Grid
      sx={{ borderRight: "1px solid black" }}
      item
      xs={isSmallScreen ? 12 : 3}
    >
      <TopBar />
      <Box sx={{ maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>
        <FriendList />
      </Box>
    </Grid>
  );
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={mainTheme}>
          <CssBaseline />
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              {auth && isLargeScreen ? <SideBar /> : !chat ? <SideBar /> : null}
              {children}
            </Grid>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}

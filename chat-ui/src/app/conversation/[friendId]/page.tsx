"use client"
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import React, { useEffect } from "react";
import Page from "../page";
import { Container } from "@mui/material";



const page = ({ params }: { params: Params }) => {

  return (
    <>
      <Page params={params} />
    </>
  );
};

export default page;

"use client"
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import React from "react";
import Page from "../page";
import { Container } from "@mui/material";
import { useRouter } from "next/router";
const page = ({ params }: { params: Params }) => {

console.log('router.query',params)
  return (
    <>
      <Page params={params} />
    </>
  );
};

export default page;

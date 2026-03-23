"use client";
import { createContext, useContext } from "react";
export const EditingContext = createContext<boolean>(false);
export const useEditing = () => useContext(EditingContext);

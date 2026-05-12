"use client";
import { createContext, useContext } from "react";

export type ImageEditTarget = {
  url: string;
  onChange: (url: string) => void;
  primaryColor: string;
  accentColor: string;
} | null;

interface Ctx {
  target: ImageEditTarget;
  open: (t: NonNullable<ImageEditTarget>) => void;
  close: () => void;
}

export const ImageEditContext = createContext<Ctx>({ target: null, open: () => {}, close: () => {} });
export const useImageEdit = () => useContext(ImageEditContext);

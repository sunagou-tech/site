"use client";
import { createContext, useContext } from "react";

interface ImagePickContextValue {
  pickedUrl: string | null;
  pick: (url: string) => void;
  clear: () => void;
}

export const ImagePickContext = createContext<ImagePickContextValue>({
  pickedUrl: null,
  pick: () => {},
  clear: () => {},
});

export const useImagePick = () => useContext(ImagePickContext);

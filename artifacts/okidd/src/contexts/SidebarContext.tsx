import { createContext, useContext } from "react";

interface SidebarCtx {
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarCtx>({ openSidebar: () => {} });

export const useSidebar = () => useContext(SidebarContext);

export default SidebarContext;

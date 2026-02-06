import { createContext, useContext, useState, ReactNode } from 'react';

interface InboxViewContextType {
  /** When true, main app sidebar should hide (e.g. when a chat is open in Inbox). */
  hideMainSidebar: boolean;
  setHideMainSidebar: (hide: boolean) => void;
}

const InboxViewContext = createContext<InboxViewContextType | undefined>(undefined);

export function InboxViewProvider({ children }: { children: ReactNode }) {
  const [hideMainSidebar, setHideMainSidebar] = useState(false);
  return (
    <InboxViewContext.Provider value={{ hideMainSidebar, setHideMainSidebar }}>
      {children}
    </InboxViewContext.Provider>
  );
}

export function useInboxView() {
  const context = useContext(InboxViewContext);
  if (context === undefined) {
    throw new Error('useInboxView must be used within an InboxViewProvider');
  }
  return context;
}

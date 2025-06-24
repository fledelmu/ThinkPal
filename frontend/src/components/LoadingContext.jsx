import { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  return (
    <LoadingContext.Provider value={{ loading, setLoading, loadingMessage, setLoadingMessage }}>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-rule-bg p-4 border-2 border-rule-60 rounded shadow">{loadingMessage}</div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import Loading from "../components/Loading";

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);

  const value = {
    isLoading,
    setIsLoading,
    setLoading,
  };
  
  useEffect(() => {
    // 保底超时机制：10秒后强制完成加载
    // 解决移动端或3D模型加载失败时无法进入主页面的问题
    const failSafeTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Fail-safe: Forcing loading completion after timeout");
        setLoading(100);
        // 给一些时间让UI更新后再关闭加载页面
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    }, 10000);

    return () => clearTimeout(failSafeTimeout);
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={value as LoadingType}>
      {isLoading && <Loading percent={loading} />}
      <main className={`main-body ${isLoading ? 'main-loading' : ''}`}>{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

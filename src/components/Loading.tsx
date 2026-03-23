import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";
import { initialFX } from "./utils/initialFX";

import Marquee from "react-fast-marquee";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading, setLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [localPercent, setLocalPercent] = useState(0);

  // 确定使用哪个百分比值
  // 优先使用外部传入的 percent，否则使用本地模拟的
  const displayPercent = percent > localPercent ? percent : localPercent;

  // 自驱动进度模拟 - 确保在任何情况下都有进度显示
  // 当外部 percent 为 0 时（如移动端或3D模型未渲染），
  // 组件自身模拟加载进度
  useEffect(() => {
    if (percent === 0 && localPercent === 0 && !loaded) {
      let currentPercent = 0;
      const interval = setInterval(() => {
        if (currentPercent <= 50) {
          const rand = Math.round(Math.random() * 5);
          currentPercent = Math.min(55, currentPercent + rand);
        } else if (currentPercent <= 90) {
          currentPercent = Math.min(90, currentPercent + 1);
        } else {
          clearInterval(interval);
        }
        setLocalPercent(currentPercent);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [percent, localPercent, loaded]);

  // 保底机制：当进度达到90%以上后，再等待一小段时间自动完成加载
  // 确保即使没有外部驱动时也能进入主页面
  useEffect(() => {
    if (displayPercent >= 90 && displayPercent < 100 && !loaded) {
      const timer = setTimeout(() => {
        setLocalPercent(100);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [displayPercent, loaded]);

  useEffect(() => {
    // 只要 percent >= 100 就开始加载完成流程
    // 用 loaded 作为标志防止重复触发
    if (displayPercent >= 100 && !loaded) {
      const timer1 = setTimeout(() => {
        setLoaded(true);
        const timer2 = setTimeout(() => {
          setIsLoaded(true);
        }, 1000);
        return () => clearTimeout(timer2);
      }, 600);
      return () => clearTimeout(timer1);
    }
  }, [displayPercent, loaded]);

  useEffect(() => {
    if (isLoaded) {
      setClicked(true);
      const timer = setTimeout(() => {
        initialFX();
        setIsLoading(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, setIsLoading]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          RK
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>
      <div className="loading-screen">
        <div className="loading-marquee">
          <Marquee>
            <span> RITESH KADIAN</span> <span>Software Engineer</span>
            <span> RITESH KADIAN</span> <span>Software Engineer</span>
          </Marquee>
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{displayPercent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

// eslint-disable-next-line react-refresh/only-export-components
export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;

  let interval = setInterval(() => {
    if (percent <= 50) {
      const rand = Math.round(Math.random() * 5);
      percent = percent + rand;
      setLoading(percent);
    } else {
      clearInterval(interval);
      interval = setInterval(() => {
        percent = percent + Math.round(Math.random());
        setLoading(percent);
        if (percent > 91) {
          clearInterval(interval);
        }
      }, 2000);
    }
  }, 100);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      clearInterval(interval);
      interval = setInterval(() => {
        if (percent < 100) {
          percent++;
          setLoading(percent);
        } else {
          resolve(percent);
          clearInterval(interval);
        }
      }, 2);
    });
  }
  return { loaded, percent, clear };
};

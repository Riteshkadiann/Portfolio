declare module "gsap/SplitText" {
  import { gsap } from "gsap";
  
  interface SplitTextConfig {
    type?: string;
    linesClass?: string;
    [key: string]: any;
  }
  
  class SplitText {
    constructor(element: HTMLElement | string | (string | HTMLElement)[], config?: SplitTextConfig);
    words: HTMLElement[];
    lines: HTMLElement[];
    chars: HTMLElement[];
    revert(): void;
    [key: string]: any;
  }
  
  export { SplitText };
}

declare module "gsap/ScrollSmoother" {
  interface ScrollSmootherConfig {
    wrapper?: string | HTMLElement;
    content?: string | HTMLElement;
    smooth?: number;
    speed?: number;
    effects?: boolean;
    autoResize?: boolean;
    ignoreMobileResize?: boolean;
    [key: string]: any;
  }
  
  class ScrollSmoother {
    static create(config: ScrollSmootherConfig): ScrollSmoother;
    static refresh(updateDependencies?: boolean): void;
    [key: string]: any;
  }
  
  export { ScrollSmoother };
}

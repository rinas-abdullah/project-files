"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.7, 0.9] : [1.05, 1]);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-240 md:h-320 flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} isMobile={isMobile} />
        <Card rotate={rotate} translate={translate} scale={scale} isMobile={isMobile}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
  isMobile,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
  isMobile: boolean;
}) => {
  return (
    <motion.div
      style={isMobile ? {} : {
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  isMobile,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
  isMobile: boolean;
}) => {
  return (
    <motion.div
      style={isMobile ? {
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      } : {
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #00000030, 0 10px 30px rgba(0,0,0,0.1), 0 35px 50px rgba(0,0,0,0.15), 0 70px 70px rgba(0,0,0,0.12)",
      }}
      className="max-w-5xl -mt-12 mx-auto h-120 md:h-160 w-full border-4 border-[#2D2D30] p-2 md:p-4 bg-[#121212] rounded-[30px] shadow-2xl transition-colors duration-300"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-[#FAFCFE] dark:bg-slate-950 md:rounded-2xl md:p-4">
        {children}
      </div>
    </motion.div>
  );
};


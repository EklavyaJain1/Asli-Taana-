import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SlideTabsProps {
  items: { name: string; key?: string }[];
  activeItem: string;
  onChange: (name: string) => void;
}

export const SlideTabs = ({ items, activeItem, onChange }: SlideTabsProps) => {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const selectedIndex = items.findIndex((i) => i.name === activeItem) >= 0 
    ? items.findIndex((i) => i.name === activeItem) 
    : 0;

  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const selectedTab = tabsRef.current[selectedIndex];
    if (selectedTab) {
      const { width } = selectedTab.getBoundingClientRect();
      setPosition({
        left: selectedTab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  }, [selectedIndex, items]);

  return (
    <ul
      onMouseLeave={() => {
        const selectedTab = tabsRef.current[selectedIndex];
        if (selectedTab) {
          const { width } = selectedTab.getBoundingClientRect();
          setPosition({
            left: selectedTab.offsetLeft,
            width,
            opacity: 1,
          });
        }
      }}
      className="relative mx-auto flex w-fit rounded-full border border-[#1a1a1a]/15 bg-[#f9f8f4] p-1 shadow-sm"
    >
      {items.map((tab, i) => (
        <Tab
          key={tab.name}
          ref={(el) => {
            tabsRef.current[i] = el;
          }}
          setPosition={setPosition}
          onClick={() => onChange(tab.name)}
          isActive={selectedIndex === i}
        >
          {tab.name}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
};

const Tab = React.forwardRef<
  HTMLLIElement,
  {
    children: React.ReactNode;
    setPosition: any;
    onClick: () => void;
    isActive: boolean;
  }
>(({ children, setPosition, onClick, isActive }, ref) => {
  return (
    <li
      ref={ref}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!ref || !(ref as any).current) return;
        const currentRef = (ref as any).current;
        const { width } = currentRef.getBoundingClientRect();

        setPosition({
          left: currentRef.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider transition-colors md:px-5 md:py-2.5 ${
        isActive ? "text-white mix-blend-difference" : "text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
      }`}
    >
      {children}
    </li>
  );
});

Tab.displayName = "Tab";

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={{
        ...position,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className="absolute z-0 h-7 rounded-full bg-[#1a1a1a] md:h-9"
    />
  );
};

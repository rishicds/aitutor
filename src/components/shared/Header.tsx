"use client";

import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import { Dispatch, JSX, SetStateAction, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiHome,
  FiBookOpen,
  FiZap,
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiLogIn,
  FiMenu,
  FiX,
} from "react-icons/fi";

const ResponsiveNavigation = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener
    window.addEventListener("resize", checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <>
      {isMobile ? (
        <MobileNavigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      ) : (
        <DesktopSideNav />
      )}
    </>
  );
};

const DesktopSideNav = () => {
  const [selected, setSelected] = useState(0);
  const [user] = useAuthState(auth);

  return (
    <div className="fixed left-0 top-0 h-screen bg-white text-slate-700 shadow-lg z-50">
      <nav className="h-full w-20 p-4 flex flex-col items-center gap-4">
        {/* Logo */}
        <Link href="/">
          <div className="mb-6 cursor-pointer bg-lavender-100 p-2 rounded-full">
            <svg
              width="40"
              height="28"
              viewBox="0 0 40 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.98578 4.11462L0 14C1.99734 15.9773 4.27899 17.6437 6.76664 18.9474C7.45424 20.753 8.53203 22.4463 10 23.8995C15.5229 29.3668 24.4772 29.3668 30 23.8995C31.468 22.4463 32.5458 20.753 33.2334 18.9473C35.721 17.6437 38.0027 15.9773 40 14L30.0223 4.12266C30.0149 4.11527 30.0075 4.10788 30 4.1005C24.4772 -1.36683 15.5229 -1.36683 10 4.1005C9.99527 4.10521 9.99052 4.10991 9.98578 4.11462ZM29.0445 20.7309C26.1345 21.7031 23.0797 22.201 20 22.201C16.9203 22.201 13.8656 21.7031 10.9556 20.7309C11.2709 21.145 11.619 21.5424 12 21.9196C16.4183 26.2935 23.5817 26.2935 28 21.9196C28.381 21.5424 28.7292 21.145 29.0445 20.7309ZM12.2051 5.8824C12.9554 6.37311 13.7532 6.79302 14.588 7.13536C16.3038 7.83892 18.1428 8.20104 20 8.20104C21.8572 8.20104 23.6962 7.83892 25.412 7.13536C26.2468 6.79302 27.0446 6.3731 27.795 5.88238C23.4318 1.77253 16.5682 1.77254 12.2051 5.8824Z"
                fill="#8B5CF6"
              ></path>
            </svg>
          </div>
        </Link>

        {/* Navigation Links */}
        <NavItem selected={selected === 0} id={0} setSelected={setSelected} link="/">
          <FiHome />
          <span className="sr-only">Home</span>
        </NavItem>
        <NavItem selected={selected === 1} id={1} setSelected={setSelected} link="/dashboard">
          <FiBookOpen />
          <span className="sr-only">Dashboard</span>
        </NavItem>
        <NavItem selected={selected === 2} id={2} setSelected={setSelected} link="/ai-tutors">
          <FiUser />
          <span className="sr-only">AI Tutors</span>
        </NavItem>
        <NavItem selected={selected === 3} id={3} setSelected={setSelected} link="/pyq">
          <FiZap />
          <span className="sr-only">PYQ</span>
        </NavItem>
        <NavItem selected={selected === 4} id={4} setSelected={setSelected} link="/purchase">
          <FiShoppingCart />
          <span className="sr-only">Purchase</span>
        </NavItem>

        {/* Auth Buttons (Sign In/Out) */}
        <div className="mt-auto">
          <AuthButton />
        </div>
      </nav>
    </div>
  );
};

const MobileNavigation = ({ 
  mobileMenuOpen, 
  setMobileMenuOpen 
}: { 
  mobileMenuOpen: boolean; 
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>> 
}) => {
  const [selected, setSelected] = useState(0);
  
  return (
    <>
      {/* Floating Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-lg text-slate-700 rounded-full shadow-xl z-50 w-5/6 max-w-sm border border-lavender-100">
        <div className="flex justify-around items-center h-16 px-2">
          <MobileNavItem selected={selected === 0} id={0} setSelected={setSelected} link="/">
            <FiHome size={22} />
            <span className="text-xs mt-1">Home</span>
          </MobileNavItem>
          <MobileNavItem selected={selected === 1} id={1} setSelected={setSelected} link="/dashboard">
            <FiBookOpen size={22} />
            <span className="text-xs mt-1">Learn</span>
          </MobileNavItem>
          
          {/* Center Action Button */}
          <div className="relative -mt-6">
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex justify-center items-center w-16 h-16 rounded-full bg-lavender-600 text-white shadow-lg border-4 border-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {mobileMenuOpen ? <FiX size={26} /> : <FiMenu size={28} />}
            </motion.button>
          </div>
          
          <MobileNavItem selected={selected === 2} id={2} setSelected={setSelected} link="/ai-tutors">
            <FiUser size={22} />
            <span className="text-xs mt-1">Tutors</span>
          </MobileNavItem>
          <MobileNavItem selected={selected === 3} id={3} setSelected={setSelected} link="/pyq">
            <FiZap size={22} />
            <span className="text-xs mt-1">PYQ</span>
          </MobileNavItem>
        </div>
      </div>

      {/* Mobile Menu Overlay with Animated Cards */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex flex-col items-center justify-end pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full px-4 flex flex-col items-center gap-3 max-w-md"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Logo Card */}
              <motion.div 
                className="bg-white w-full rounded-xl p-4 flex justify-center items-center shadow-lg border border-lavender-100"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Link href="/">
                  <svg
                    width="60"
                    height="42"
                    viewBox="0 0 40 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="cursor-pointer"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.98578 4.11462L0 14C1.99734 15.9773 4.27899 17.6437 6.76664 18.9474C7.45424 20.753 8.53203 22.4463 10 23.8995C15.5229 29.3668 24.4772 29.3668 30 23.8995C31.468 22.4463 32.5458 20.753 33.2334 18.9473C35.721 17.6437 38.0027 15.9773 40 14L30.0223 4.12266C30.0149 4.11527 30.0075 4.10788 30 4.1005C24.4772 -1.36683 15.5229 -1.36683 10 4.1005C9.99527 4.10521 9.99052 4.10991 9.98578 4.11462ZM29.0445 20.7309C26.1345 21.7031 23.0797 22.201 20 22.201C16.9203 22.201 13.8656 21.7031 10.9556 20.7309C11.2709 21.145 11.619 21.5424 12 21.9196C16.4183 26.2935 23.5817 26.2935 28 21.9196C28.381 21.5424 28.7292 21.145 29.0445 20.7309ZM12.2051 5.8824C12.9554 6.37311 13.7532 6.79302 14.588 7.13536C16.3038 7.83892 18.1428 8.20104 20 8.20104C21.8572 8.20104 23.6962 7.83892 25.412 7.13536C26.2468 6.79302 27.0446 6.3731 27.795 5.88238C23.4318 1.77253 16.5682 1.77254 12.2051 5.8824Z"
                      fill="#8B5CF6"
                    ></path>
                  </svg>
                </Link>
              </motion.div>

              {/* Purchase Card */}
              <motion.div 
                className="bg-white w-full rounded-xl p-4 shadow-lg border border-lavender-100"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Link href="/purchase" onClick={() => setMobileMenuOpen(false)}>
                  <motion.div
                    className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-lavender-500 to-purple-500 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <h3 className="font-bold text-lg text-white">Upgrade Now</h3>
                      <p className="text-sm text-lavender-100">Get premium features</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <FiShoppingCart size={24} className="text-white" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Auth Card */}
              <motion.div 
                className="bg-white w-full rounded-xl p-4 shadow-lg border border-lavender-100"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AuthButton isMobile={true} setMobileMenuOpen={setMobileMenuOpen} />
              </motion.div>

              {/* Quick Links Card */}
              <motion.div 
                className="bg-white w-full rounded-xl p-4 shadow-lg border border-lavender-100"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-slate-700 font-medium mb-3">Quick Links</h3>
                <div className="grid grid-cols-2 gap-2">
                  <QuickLinkButton icon={<FiUser />} label="Profile" onClick={() => setMobileMenuOpen(false)} link="/profile" />
                  <QuickLinkButton icon={<FiShoppingCart />} label="Cart" onClick={() => setMobileMenuOpen(false)} link="/cart" />
                  <QuickLinkButton icon={<FiBookOpen />} label="Courses" onClick={() => setMobileMenuOpen(false)} link="/courses" />
                  <QuickLinkButton icon={<FiZap />} label="Practice" onClick={() => setMobileMenuOpen(false)} link="/practice" />
                </div>
              </motion.div>

              {/* Close Menu Area - Tap anywhere to close */}
              <motion.button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-slate-700 p-2 mt-4 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Close Menu
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Desktop Navigation Item
const NavItem = ({
  children,
  selected,
  id,
  setSelected,
  link,
}: {
  children: JSX.Element | JSX.Element[];
  selected: boolean;
  id: number;
  setSelected: Dispatch<SetStateAction<number>>;
  link: string;
}) => {
  return (
    <Link href={link}>
      <motion.button
        className="p-3 text-xl bg-white hover:bg-lavender-50 rounded-full transition-colors relative"
        onClick={() => setSelected(id)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className={`block relative z-10 ${selected ? 'text-white' : 'text-lavender-500'}`}>{children}</span>
        <AnimatePresence>
          {selected && (
            <motion.span
              className="absolute inset-0 rounded-full bg-lavender-500 z-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            ></motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </Link>
  );
};

// Mobile Navigation Item
const MobileNavItem = ({
  children,
  selected,
  id,
  setSelected,
  link,
}: {
  children: JSX.Element | JSX.Element[];
  selected: boolean;
  id: number;
  setSelected: Dispatch<SetStateAction<number>>;
  link: string;
}) => {
  return (
    <Link href={link}>
      <motion.button
        className="p-2 relative flex flex-col items-center"
        onClick={() => setSelected(id)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className={`relative z-10 flex flex-col items-center ${selected ? 'text-lavender-600' : 'text-slate-500'}`}>
          {children}
        </div>
        <AnimatePresence>
          {selected && (
            <motion.span
              className="absolute inset-0 rounded-full bg-lavender-100 z-0"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            ></motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </Link>
  );
};

// Quick Link Button for Mobile Menu
const QuickLinkButton = ({ 
  icon, 
  label, 
  onClick,
  link 
}: { 
  icon: JSX.Element; 
  label: string; 
  onClick: () => void;
  link: string;
}) => {
  return (
    <Link href={link} onClick={onClick}>
      <motion.div
        className="flex items-center gap-2 p-3 bg-lavender-50 rounded-lg border border-lavender-100"
        whileHover={{ scale: 1.03, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <span className="text-lavender-500">{icon}</span>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </motion.div>
    </Link>
  );
};

// Auth Button Component 
const AuthButton = ({ 
  isMobile = false,
  setMobileMenuOpen = () => {}
}: { 
  isMobile?: boolean,
  setMobileMenuOpen?: Dispatch<SetStateAction<boolean>>
}) => {
  const [user] = useAuthState(auth);

  const handleClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
    if (user) {
      signOut(auth);
    }
  };

  if (user) {
    if (isMobile) {
      return (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-lavender-100 rounded-full flex items-center justify-center">
              <FiUser size={24} className="text-lavender-500" />
            </div>
            <div>
              <h3 className="font-medium text-slate-700">{user.displayName || 'User'}</h3>
              <p className="text-sm text-slate-500 truncate max-w-full">{user.email || 'Signed In'}</p>
            </div>
          </div>
          <motion.button
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 p-3 text-base bg-red-100 text-red-500 hover:bg-red-200 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiLogOut />
            <span>Sign Out</span>
          </motion.button>
        </div>
      );
    } else {
      return (
        <motion.button
          onClick={handleClick}
          className="p-3 text-xl bg-red-100 text-red-500 hover:bg-red-200 rounded-full transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiLogOut />
        </motion.button>
      );
    }
  } else {
    if (isMobile) {
      return (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-lavender-100 rounded-full flex items-center justify-center">
              <FiUser size={24} className="text-lavender-500" />
            </div>
            <div>
              <h3 className="font-medium text-slate-700">Welcome</h3>
              <p className="text-sm text-slate-500">Sign in to continue</p>
            </div>
          </div>
          <Link href="/signin" className="w-full block" onClick={() => setMobileMenuOpen(false)}>
            <motion.button
              className="w-full flex items-center justify-center gap-2 p-3 text-base bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLogIn />
              <span>Sign In</span>
            </motion.button>
          </Link>
        </div>
      );
    } else {
      return (
        <Link href="/signin" onClick={() => isMobile && setMobileMenuOpen(false)}>
          <motion.button
            className="p-3 text-xl bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLogIn />
          </motion.button>
        </Link>
      );
    }
  }
};

export default ResponsiveNavigation;
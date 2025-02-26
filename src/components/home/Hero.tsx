"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
import { FiArrowDown } from "react-icons/fi"
//ignore eslint for entire page
/* eslint-disable */
export const Hero = () => {
  const targetRef = useRef(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)

  // Scroll-based animations
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.85])
  const yTransform = useTransform(scrollYProgress, [0, 0.5], [0, -50])
  
  // Parallax effect for background elements
  const bgCircleY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const bgCircleScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.5])
  
  // Mouse movement effect
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any }) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    
    // Trigger load animation
    const timer = setTimeout(() => setIsLoaded(true), 300)
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      clearTimeout(timer)
    }
  }, [])
  
  // Spring physics for smoother mouse following
  const springConfig = { damping: 25, stiffness: 100 }
  const mouseXSpring = useSpring(useMotionValue(0), springConfig)
  const mouseYSpring = useSpring(useMotionValue(0), springConfig)
  
  useEffect(() => {
    mouseXSpring.set(mousePosition.x / 50)
    mouseYSpring.set(mousePosition.y / 50)
  }, [mousePosition, mouseXSpring, mouseYSpring])

  return (
    <section ref={targetRef} className="h-[100vh] text-gray-900 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 -z-10 opacity-70 overflow-hidden">
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-200 to-blue-400 blur-3xl"
          style={{ 
            top: '30%', 
            left: '10%',
            y: bgCircleY,
            scale: bgCircleScale,
            x: mouseXSpring
          }}
        />
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-200 to-purple-400 blur-3xl"
          style={{ 
            top: '50%', 
            right: '15%',
            y: bgCircleY,
            scale: bgCircleScale,
            x: mouseYSpring
          }}
        />
        
        {/* Ink Splashes */}
        <InkSplash 
          top="15%"
          left="25%"
          size="w-32 h-32"
          color="bg-blue-500"
          delay={0.2}
          mouseXInfluence={1.2}
          mouseYInfluence={0.8}
          mouseXSpring={mouseXSpring}
          mouseYSpring={mouseYSpring} right={""} bottom={""} />
        <InkSplash 
          top="65%"
          right="28%"
          size="w-40 h-40"
          color="bg-purple-600"
          delay={0.5}
          mouseXInfluence={-0.8}
          mouseYInfluence={1.5}
          mouseXSpring={mouseXSpring}
          mouseYSpring={mouseYSpring} left={""} bottom={""}        />
        <InkSplash 
          top="35%"
          right="15%"
          size="w-24 h-24"
          color="bg-blue-400"
          delay={1.2}
          mouseXInfluence={-1}
          mouseYInfluence={-0.6}
          mouseXSpring={mouseXSpring}
          mouseYSpring={mouseYSpring} left={""} bottom={""}        />
        <InkSplash 
          bottom="10%"
          left="35%"
          size="w-36 h-36"
          color="bg-indigo-500"
          delay={0.8}
          mouseXInfluence={1.3}
          mouseYInfluence={-1.2}
          mouseXSpring={mouseXSpring}
          mouseYSpring={mouseYSpring} top={""} right={""}        />
      </div>
      
      <motion.div
        style={{ opacity, scale, y: yTransform }}
        className="sticky top-0 flex h-screen flex-col justify-between py-8 px-6 md:px-12 backdrop-blur-sm"
      >
        <AnimatePresence>
          {isLoaded && (
            <Nav mouseXSpring={mouseXSpring} mouseYSpring={mouseYSpring} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isLoaded && (
            <CenterCopy mouseXSpring={mouseXSpring} mouseYSpring={mouseYSpring} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isLoaded && <ScrollArrow />}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

// Ink Splash Component
const InkSplash = ({ top, left, right, bottom, size, color, delay, mouseXInfluence, mouseYInfluence, mouseXSpring, mouseYSpring }: {
  top: string;
  left: string;
  right: string;
  bottom: string;
  size: string;
  color: string;
  delay: number;
  mouseXInfluence: number;
  mouseYInfluence: number;
  mouseXSpring: any;
  mouseYSpring: any;
}) => {
  const positionStyle = {
    ...(top && { top }),
    ...(left && { left }),
    ...(right && { right }),
    ...(bottom && { bottom }),
  };
  
  // Calculate a custom transform based on mouse position with custom influence factor
  const xTransform = mouseXSpring ? useTransform(mouseXSpring, (value: number) => value * mouseXInfluence) : 0;
  const yTransform = mouseYSpring ? useTransform(mouseYSpring, (value: number) => value * mouseYInfluence) : 0;
  
  return (
    <motion.div
      className={`absolute ${size} ${color} opacity-20 rounded-full`}
      style={{
        ...positionStyle,
        x: xTransform,
        y: yTransform,
        filter: "blur(2px)",
        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
      }}
      initial={{ scale: 0, opacity: 0, rotate: -30 }}
      animate={{ 
        scale: [0, 1.2, 1],
        opacity: [0, 0.3, 0.2],
        rotate: [30, 0],
      }}
      transition={{ 
        duration: 2,
        delay: delay,
        ease: "easeOut"
      }}
    />
  );
};

const Nav = ({ mouseXSpring, mouseYSpring }: { mouseXSpring: any, mouseYSpring: any }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex justify-between items-center relative"
    >
      <Logo mouseXSpring={mouseXSpring} mouseYSpring={mouseYSpring} />
      <Links />
    </motion.div>
  )
}

const Logo = ({ mouseXSpring, mouseYSpring }: { mouseXSpring: any, mouseYSpring: any }) => {
  return (
    <motion.div 
      className="text-xl font-light tracking-wide relative"
      style={{ x: mouseXSpring, y: mouseYSpring }}
    >
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        brain
      </motion.span>
      <motion.span
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-bold"
      >
        boost
      </motion.span>
      <motion.div 
        className="absolute -z-10 w-8 h-8 rounded-full bg-blue-200 blur-lg"
        style={{ left: -10, top: -5 }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          repeat: Number.POSITIVE_INFINITY,
          duration: 4,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}

const Links = () => {
  return (
    <nav className="flex gap-6 text-sm">
      {["Subjects", "Practice", "AI Tutor"].map((link, index) => (
        <motion.a 
          key={link}
          href="#"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
          className="hover:text-blue-600 transition-colors relative"
          whileHover={{ scale: 1.05 }}
        >
          {link}
          <motion.span 
            className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600"
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.2 }}
          />
        </motion.a>
      ))}
    </nav>
  )
}

const CenterCopy = ({ mouseXSpring, mouseYSpring }: { mouseXSpring: any, mouseYSpring: any }) => {
  const firstPartText = "Learn "
  const markedText = "Smarter"
  const lastPartText = " with"
  const boldCharacters = "AI-Powered Tutoring".split("")
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="flex flex-col items-center text-center"
    >
      <h1 className="text-4xl md:text-6xl font-light mb-6 relative">
        <div className="overflow-hidden mb-2 relative">
          {/* First part of the text */}
          {firstPartText.split("").map((char, index) => (
            <motion.span
              key={`first-${char}-${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.03 }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
          
          {/* Marked text with circle effect */}
          <span className="relative inline-block">
            {/* The marker circle behind "Smarter" */}
            <motion.span 
              className="absolute inset-0 -z-10 bg-red-300 rounded-full -mx-2 -my-1 px-2 py-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                opacity: 0.4,
                rotate: [-10, 0]
              }}
              transition={{ 
                duration: 0.8, 
                delay: 1.3,
                ease: "easeOut"
              }}
              style={{
                transformOrigin: "center",
              }}
            />
            
            {/* Marker pen stroke effect */}
            <motion.span 
              className="absolute -z-10 h-2 bg-red-400 opacity-70 left-0 right-0 bottom-1"
              initial={{ width: 0, x: "-50%" }}
              animate={{ width: "120%", x: "-10%" }}
              transition={{ 
                duration: 0.7, 
                delay: 1.4,
                ease: "easeOut"
              }}
              style={{
                rotate: "-2deg"
              }}
            />
            
            {markedText.split("").map((char, index) => (
              <motion.span
                key={`marked-${char}-${index}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + (firstPartText.length + index) * 0.03 }}
                className="inline-block font-medium relative z-10"
              >
                {char}
              </motion.span>
            ))}
          </span>
          
          {/* Last part of the text */}
          {lastPartText.split("").map((char, index) => (
            <motion.span
              key={`last-${char}-${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.7 + (firstPartText.length + markedText.length + index) * 0.03 
              }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>
        <br />
        <div className="overflow-hidden font-bold">
          {boldCharacters.map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + index * 0.03 }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>
        
        {/* Floating accent elements */}
        <motion.div 
          className="absolute -z-10 w-16 h-16 rounded-full bg-blue-200 blur-xl"
          style={{ 
            right: '10%', 
            top: '-20%',
            x: mouseXSpring,
            y: mouseYSpring
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3] 
          }}
          transition={{ 
            repeat: Number.POSITIVE_INFINITY,
            duration: 5,
            ease: "easeInOut"
          }}
        />
      </h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl"
      >
        Personalized learning experiences for JEE, NEET, and B.Tech students. Unlock your potential with adaptive AI
        technology.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25, 
          delay: 1.5 
        }}
      >
        <motion.button
          whileHover={{ 
            scale: 1.05, 
            boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          className="relative bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-medium overflow-hidden group"
        >
          <motion.span 
            className="absolute inset-0 w-full h-full bg-blue-500 -z-10"
            initial={{ x: "-100%", opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          Start Learning
          <motion.span 
            className="absolute top-0 left-0 w-full h-full bg-white mix-blend-overlay opacity-0 -z-10"
            whileHover={{ 
              opacity: [0, 0.2, 0],
              x: ["0%", "150%"]
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

const ScrollArrow = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.8 }}
      className="flex justify-center"
    >
      <motion.div
        animate={{ 
          y: [0, 10, 0],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          repeat: Number.POSITIVE_INFINITY, 
          duration: 1.5,
          ease: "easeInOut"
        }}
        className="text-gray-400 relative"
      >
        <FiArrowDown size={24} />
        <motion.div
          className="absolute -inset-4 bg-blue-100 rounded-full -z-10 opacity-0"
          whileHover={{ opacity: 0.6, scale: 1.2 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </motion.div>
  )
}
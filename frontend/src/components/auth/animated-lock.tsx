import { motion } from 'framer-motion';

export function AnimatedLock() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="relative w-16 h-16 mx-auto mb-6"
    >
      <motion.div
        initial={{ y: -8 }}
        animate={{ y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.5,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 border-4 border-gray-400 rounded-full"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-0 w-full h-10 bg-gradient-to-r from-blue-500 to-pink-500 rounded-xl"
      />
    </motion.div>
  );
}
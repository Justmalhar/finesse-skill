import { motion } from "motion/react";
export const A = () => <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>Saved</motion.div>;
export const B = () => <span className="scale-x-0 group-hover:scale-x-100">Docs</span>;

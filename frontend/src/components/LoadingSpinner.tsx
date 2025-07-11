import { motion } from "framer-motion";

function LoadingSpinner() {
    return (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center z-50">
            <motion.div
                className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-xl font-medium text-blue-900"
            >
                กำลังโหลด...
            </motion.span>
        </div>
    );
}

export default LoadingSpinner;
"use client";

import { motion } from "framer-motion";
import Hero from "./hero";
import Features from "./features";
import Pricing from "./pricing";
import CTA from "./CTA";
import TrustedBy from "./truested-by";

const containerVariants = {
	hidden: { opacity: 1 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.14,
			delayChildren: 0.06,
		},
	},
};

export default function AnimatedHomePage() {
	return (
		<motion.main
			className="pt-24"
			variants={containerVariants}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, amount: 0.15 }}
		>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 28 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.6,
							ease: [0, 0, 0.58, 1],
						},
					},
				}}
				className="overflow-hidden"
			>
				<Hero />
			</motion.div>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 28 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.6,
							ease: [0, 0, 0.58, 1],
						},
					},
				}}
				className="overflow-hidden"
			>
				<TrustedBy />
			</motion.div>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 28 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.6,
							ease: [0, 0, 0.58, 1],
						},
					},
				}}
				className="overflow-hidden"
			>
				<Features />
			</motion.div>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 28 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.6,
							ease: [0, 0, 0.58, 1],
						},
					},
				}}
				className="overflow-hidden"
			>
				<Pricing />
			</motion.div>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 28 },
					visible: {
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.6,
							ease: [0, 0, 0.58, 1],
						},
					},
				}}
				className="overflow-hidden"
			>
				<CTA />
			</motion.div>
		</motion.main>
	);
}

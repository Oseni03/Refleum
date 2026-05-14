"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Code2 } from "lucide-react";
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
            animate="visible"
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

            {/* ── Developer Resources ── */}
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
                <section className="mx-auto max-w-[1400px] px-container-padding py-16">
                    <div className="mb-10 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Developer Resources
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            Everything you need to integrate.
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Docs card */}
                        <Link
                            href="/docs"
                            className="group flex items-start gap-5 rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="mb-1 text-lg font-semibold text-foreground">Documentation</h3>
                                <p className="text-sm text-muted-foreground">
                                    Authentication, rate limits, request shapes, response envelopes,
                                    and pipeline internals — everything you need to integrate in minutes.
                                </p>
                                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                    Read the docs →
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>
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

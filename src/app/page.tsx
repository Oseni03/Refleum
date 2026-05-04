import React from "react";
import Header from "@/components/homepage/header";
import AnimatedHomePage from "@/components/homepage/animated-homepage";
import Footer from "@/components/homepage/footer";

const Page = () => {
    return (
        <div className="text-foreground selection:bg-accent selection:text-primary">
            {/* Navbar */}
            <Header />
            <AnimatedHomePage />
            {/* <!-- Footer --> */}
            <Footer />
        </div>
    );
};

export default Page;

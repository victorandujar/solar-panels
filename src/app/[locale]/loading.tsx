"use client";

import { useEffect, useState } from "react";
import Loader from "../components/Loader/Loader";

export default function Loading() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50 h-screen">
      <Loader height="30px" width="30px" />
    </div>
  );
}

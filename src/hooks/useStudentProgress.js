// src/hooks/useStudentProgress.js
import { useEffect } from "react";
import { useAuth } from "../auth.jsx";
import { bumpProgress } from "../utils/progress.js";

export default function useStudentProgress(area, total, index) {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.role === "student" && index >= 0 && total > 0) {
      bumpProgress(user.uid, area, total, index);
    }
  }, [user?.uid, user?.role, area, total, index]);
}

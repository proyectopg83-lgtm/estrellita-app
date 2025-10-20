import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PingSupabase() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const ping = async () => {
    setMsg(""); setErr("");
    const { count, error } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });
    if (error) { setErr(error.message); return; }
    setMsg(`OK: DB respondió. Alumnos visibles: ${count ?? 0}`);
  };

  return (
    <div style={{margin:"12px 0"}}>
      <button onClick={ping}>Ping DB</button>
      {msg && <p>{msg}</p>}
      {err && <p style={{color:"crimson"}}>{err}</p>}
    </div>
  );
}

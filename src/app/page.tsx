import React from "react";

export default function Home() {
  return (
    <main style={{ padding: "24px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>MMA Roadmap</h1>
      <p>Deployment OK. If you see this page, routing is working.</p>
      <ul>
        <li>
          <a href="/api/debug_env">/api/debug_env</a>
        </li>
      </ul>
    </main>
  );
}

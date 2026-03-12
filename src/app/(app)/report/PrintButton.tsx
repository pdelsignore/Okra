"use client";
export default function PrintButton() {
  function handleExport() {
    const sidebar = document.querySelector("aside") as HTMLElement | null;
    if (sidebar) sidebar.style.display = "none";
    window.addEventListener("afterprint", () => {
      if (sidebar) sidebar.style.display = "";
    }, { once: true });
    window.print();
  }

  return (
    <button onClick={handleExport} className="btn-primary print:hidden">
      Export PDF
    </button>
  );
}

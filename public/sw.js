self.addEventListener("sync", (event) => {
  if (event.tag === "sync-loans") {
    event.waitUntil(syncOfflineLoans());
  }
});

async function syncOfflineLoans() {
  const db = await openDB("loan-manager-db", 1);
  const tx = db.transaction("loanQueue", "readwrite");
  const store = tx.objectStore("loanQueue");

  const allLoans = await store.getAll();

  for (const loan of allLoans) {
    try {
      const response = await fetch("/api/sync-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loan),
      });

      if (response.ok) {
        await store.delete(loan.id);
      }
    } catch (err) {
      console.error("Sync failed for loan:", loan, err);
    }
  }

  await tx.done;
}


export function DeployStamp() {
  const stamp = typeof __DEPLOYED_AT__ === "string" && __DEPLOYED_AT__ ? __DEPLOYED_AT__ : null;
  if (!stamp) return null;
  return (
    <div className="pointer-events-none fixed bottom-2 left-2 rounded bg-black/40 px-2 py-1 text-[10px] text-white/90">
      {stamp}
    </div>
  );
}

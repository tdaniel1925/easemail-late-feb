export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar will be added in Agent 5 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
